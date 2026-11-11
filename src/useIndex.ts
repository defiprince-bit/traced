import { useCallback, useEffect, useState } from 'react';
import type { IndexCircuit, TracedIndex } from './lib/indexTypes';

export interface LoadedIndex extends TracedIndex {
  cpuName: (addr: string) => string;
  byHash: Map<string, number>;
  shardsLoaded: Set<string>;
  loadCpu: (addr: string) => Promise<void>;
}

let cached: Promise<LoadedIndex> | null = null;
const inflight = new Map<string, Promise<void>>();

function hydrate(ix: TracedIndex, shardsLoaded: Set<string>, bump?: () => void): LoadedIndex {
  const names = new Map(ix.cpus.map(c => [c.a, c.n]));
  const byHash = new Map(ix.twins.map((g, i) => [g.hash, i]));
  const shardSet = new Set((ix.meta.shards ?? []).map(a => a.toLowerCase()));

  const loadCpu = async (addr: string) => {
    const a = addr.toLowerCase();
    if (!shardSet.has(a) || shardsLoaded.has(a)) return;
    let p = inflight.get(a);
    if (!p) {
      p = (async () => {
        const r = await fetch(`${import.meta.env.BASE_URL}data/c/${a}.json`);
        if (!r.ok) throw new Error(`shard ${a} HTTP ${r.status}`);
        const data = await r.json() as { cpu: string; circuits: Record<string, IndexCircuit> };
        for (const [id, rec] of Object.entries(data.circuits)) {
          ix.circuits[`${a}:${id}`] = rec;
        }
        shardsLoaded.add(a);
        bump?.();
      })().catch(err => {
        inflight.delete(a);
        throw err;
      });
      inflight.set(a, p);
    }
    await p;
  };

  return { ...ix, byHash, shardsLoaded, loadCpu, cpuName: (addr: string) => names.get(addr.toLowerCase()) ?? `${addr.slice(0, 6)}…${addr.slice(-4)}` };
}

function load(bump?: () => void): Promise<LoadedIndex> {
  cached ??= fetch(`${import.meta.env.BASE_URL}data/index.json`).then(r => {
    if (!r.ok) throw new Error(`index.json HTTP ${r.status}`);
    return r.json();
  }).then((ix: TracedIndex) => hydrate(ix, new Set(), bump));
  return cached;
}

export function useIndex() {
  const [ix, setIx] = useState<LoadedIndex | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const bump = useCallback(() => setIx(cur => cur ? { ...cur } : cur), []);
  useEffect(() => { load(bump).then(setIx, e => setErr(String(e))); }, [bump]);
  return { ix, err };
}

/** Node helper used by tests: load index.json plus every shard from disk. */
export async function loadFullIndexFromFs(read: (url: URL) => string, indexUrl: URL): Promise<TracedIndex> {
  const ix: TracedIndex = JSON.parse(read(indexUrl));
  ix.circuits ??= {};
  for (const addr of ix.meta.shards ?? []) {
    const shardUrl = new URL(`../public/data/c/${addr}.json`, indexUrl);
    try {
      const data = JSON.parse(read(shardUrl)) as { circuits: Record<string, IndexCircuit> };
      for (const [id, rec] of Object.entries(data.circuits)) ix.circuits[`${addr}:${id}`] = rec;
    } catch (e) {
      throw new Error(`failed to read shard ${addr}: ${e}`);
    }
  }
  return ix;
}
