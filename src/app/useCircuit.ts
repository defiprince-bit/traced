import { useEffect, useMemo, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import { isMissingCircuitError, readCircuit, type LiveCircuit } from '../lib/xlayer';
import { decodeNetlist, refParents, type DecodedNetlist } from '../lib/netlist';
import { classify, type CircuitClass } from '../lib/classify';
import { keyOf } from '../lib/format';
import type { IndexCircuit, IndexTwinGroup } from '../lib/indexTypes';
import type { Route } from '../route';

export interface CircuitModel {
  cpu: `0x${string}` | string;
  id: number | null;
  live: LiveCircuit | null;
  err: string | null;
  loading: boolean;
  rec: IndexCircuit | undefined;
  decoded: DecodedNetlist | null;
  parents: { cpu: string; id: number; uses: number }[];
  children: [string, number, number][];
  hash: string | undefined;
  group: IndexTwinGroup | null;
  cls: CircuitClass | undefined;
  indexed: boolean;
  owner: string | null;
  pins: { nIn: number; nOut: number; nState: number; gateCount: number } | null;
  tx: IndexCircuit['x'];
  isOriginal: boolean;
  silent: boolean;
  notFound: boolean;
}

export function useCircuit(ix: LoadedIndex, route: Route): CircuitModel {
  const cpu = route.cpu as `0x${string}`;
  const id = route.id;
  const [live, setLive] = useState<LiveCircuit | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id == null) { setLive(null); setErr(null); setLoading(false); return; }
    let cancelled = false;
    setLive(null); setErr(null); setLoading(true);
    readCircuit(cpu, id).then(
      v => { if (!cancelled) { setLive(v); setLoading(false); } },
      e => { if (!cancelled) { setErr(String((e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? e)); setLoading(false); } },
    );
    return () => { cancelled = true; };
  }, [cpu, id]);

  return useMemo(() => {
    const empty: CircuitModel = {
      cpu, id: null, live, err, loading, rec: undefined, decoded: null, parents: [], children: [],
      hash: undefined, group: null, cls: undefined, indexed: false, owner: null, pins: null, tx: null,
      isOriginal: false, silent: false, notFound: false,
    };
    if (id == null) return empty;
    const k = keyOf(cpu, id);
    const rec = ix.circuits[k];
    const decoded = live ? decodeNetlist(live.netlist) : null;
    const parents = decoded ? refParents(decoded.refs) : (rec?.p.map(([c, i, u]) => ({ cpu: c, id: i, uses: u })) ?? []);
    const children = rec?.c ?? ix.externalChildren[k] ?? [];
    const hash = live?.hash ?? rec?.h;
    const gi = hash ? ix.byHash.get(hash) : undefined;
    const group = gi != null ? ix.twins[gi] : null;
    const cls = decoded && live
      ? classify({ nand: decoded.nand, latch: decoded.latch, ref: decoded.refs.length, children: children.length, gateCount: live.gateCount })
      : rec?.k;
    const owner = live?.owner ?? rec?.o ?? null;
    const pins = live ?? (rec ? { nIn: rec.i, nOut: rec.u, nState: rec.s, gateCount: rec.g } : null);
    const tx = rec?.x ?? null;
    const isOriginal = !!(group?.original && group.original[0] === cpu && group.original[1] === id);
    const silent = !!(group && group.ref === 0);
    const notFound = !loading && !live && !!err && isMissingCircuitError(err);
    return { cpu, id, live, err, loading, rec, decoded, parents, children, hash, group, cls, indexed: !!rec, owner, pins, tx, isOriginal, silent, notFound };
  }, [ix, cpu, id, live, err, loading]);
}
