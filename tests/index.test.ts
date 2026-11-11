// Sanity checks on the prebuilt index against facts verified on-chain during research.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import type { IndexCircuit, TracedIndex } from '../src/lib/indexTypes';

const root = new URL('../public/data/', import.meta.url);
const ix: TracedIndex = JSON.parse(fs.readFileSync(new URL('index.json', root), 'utf8'));
for (const addr of ix.meta.shards ?? []) {
  const data = JSON.parse(fs.readFileSync(new URL(`c/${addr}.json`, root), 'utf8')) as { cpu: string; circuits: Record<string, IndexCircuit> };
  for (const [id, rec] of Object.entries(data.circuits)) ix.circuits[`${addr}:${id}`] = rec;
}
const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const FAB = '0x87bfca3494aa228ff589ab9b642143a5e8c8f9a6';
const TAPELIQUID = '0x69f663931209096037474d7c20402232e5c762ca';
const N9898 = '0x60918c204f3c94630d3d793738fc36293c8405d6';
const get = (cpu: string, id: number) => ix.circuits[`${cpu}:${id}`];

describe('prebuilt index', () => {
  it('covers every circuit on the official factory at the snapshot block', () => {
    expect(ix.meta.circuitsIndexed).toBe(11749);
    expect(ix.meta.refEdges).toBe(1514);
    expect(ix.meta.twinGroups).toBe(345);
    expect(ix.meta.block).toBe(75628053);
    expect(ix.meta.skipped).toEqual([]);
    expect(ix.meta.shards).toEqual(expect.arrayContaining([FAB, TAPELIQUID, N9898]));
  });

  it('records honest per-processor coverage, including the late FAB-Genisis head', () => {
    const byAddr = new Map(ix.cpus.map(c => [c.a, c]));
    for (const [addr, n] of [[N9898, 1022], [TAPELIQUID, 1387], [FAB, 6953]] as const) {
      const c = byAddr.get(addr)!;
      expect(c.i).toBe(n);
      expect(c.c).toBe(n);
      expect(c.st).toBe('scanned');
    }
    expect(byAddr.get(FAB)!.latest).toBe(6954);
    expect(byAddr.get(C)!.i).toBe(38);
    expect(byAddr.get(C)!.st).toBe('scanned');
  });

  it('Cerebr #5 cites #2, #3, #1 and is a wrapper with a verified tx', () => {
    expect(get(C, 5).p.map(p => p[1])).toEqual([2, 3, 1]);
    expect(get(C, 5).k).toBe('wrapper');
    expect(get(C, 5).x?.tx).toBe('0xc3e10087944a57070a3f4acf618992085d06d6af5e381b4675d9fd482976b66e');
  });

  it('Cerebr #3 has 109 REF uses from #5 and #37', () => {
    expect(get(C, 3).c.reduce((a, c) => a + c[2], 0)).toBe(109);
    expect(get(C, 3).c.map(c => c[1]).sort((a, b) => a - b)).toEqual([5, 37]);
    expect(get(C, 3).k).toBe('library');
  });

  it('Cerebr #4 and #34 are silent twins with #4 as the likely original', () => {
    expect(get(C, 4).h).toBe(get(C, 34).h);
    expect(get(C, 4).t).toBe(get(C, 34).t);
    const g = ix.twins[get(C, 4).t];
    expect(g.ref).toBe(0);
    expect(g.original).toEqual([C, 4]);
    expect(get(C, 4).o).not.toBe(get(C, 34).o);
  });

  it('Cerebr #34 has a tape-out tx and the twin original is picked by block', () => {
    expect(get(C, 34).x?.tx).toBe('0x0c5b2a199f1b9f2f924fe560396b15752b341f264d00ecc7030678b4d002fb85');
    expect(get(C, 34).x?.block).toBe(72819370);
    const g = ix.twins[get(C, 4).t];
    expect(g.basis).toBe('block');
    expect(g.original).toEqual([C, 4]);
    expect(get(C, 4).x!.block).toBeLessThan(get(C, 34).x!.block);
  });

  it('indexes a real REF on TAPELIQUID and keeps 9898 as 1,022 identical 3-NAND toys', () => {
    expect(get(TAPELIQUID, 1238).k).toBe('wrapper');
    expect(get(TAPELIQUID, 1238).p).toEqual([[TAPELIQUID, 1236, 1]]);
    expect(get(TAPELIQUID, 1236).k).toBe('library');
    const h = get(N9898, 1).h;
    expect(get(N9898, 1).n).toBe(3);
    expect(get(N9898, 1).r).toBe(0);
    expect(get(N9898, 1022).h).toBe(h);
    const g = ix.twins[get(N9898, 1).t];
    expect(g.members.filter(m => m[0] === N9898)).toHaveLength(1022);
    expect(g.nand).toBe(3);
    expect(g.ref).toBe(0);
  });
});
