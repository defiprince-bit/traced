import { useEffect, useState } from 'react';
import type { TracedIndex } from './lib/indexTypes';

export interface LoadedIndex extends TracedIndex {
  cpuName: (addr: string) => string;
  byHash: Map<string, number>;
}

let cached: Promise<LoadedIndex> | null = null;
function load(): Promise<LoadedIndex> {
  cached ??= fetch(`${import.meta.env.BASE_URL}data/index.json`).then(r => {
    if (!r.ok) throw new Error(`index.json HTTP ${r.status}`);
    return r.json();
  }).then((ix: TracedIndex) => {
    const names = new Map(ix.cpus.map(c => [c.a, c.n]));
    const byHash = new Map(ix.twins.map((g, i) => [g.hash, i]));
    return { ...ix, byHash, cpuName: (a: string) => names.get(a.toLowerCase()) ?? `${a.slice(0, 6)}…${a.slice(-4)}` };
  });
  return cached;
}

export function useIndex() {
  const [ix, setIx] = useState<LoadedIndex | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { load().then(setIx, e => setErr(String(e))); }, []);
  return { ix, err };
}
