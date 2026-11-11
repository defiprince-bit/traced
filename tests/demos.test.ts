import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import type { IndexCircuit, TracedIndex } from '../src/lib/indexTypes';
import { CEREBR } from '../src/route';
import { N9898, startDemos } from '../src/lib/demos';
import { toHash } from '../src/route';

const root = new URL('../public/data/', import.meta.url);
const ix: TracedIndex = JSON.parse(fs.readFileSync(new URL('index.json', root), 'utf8'));
for (const addr of ix.meta.shards ?? []) {
  const data = JSON.parse(fs.readFileSync(new URL(`c/${addr}.json`, root), 'utf8')) as { cpu: string; circuits: Record<string, IndexCircuit> };
  for (const [id, rec] of Object.entries(data.circuits)) ix.circuits[`${addr}:${id}`] = rec;
}

describe('start-screen demo cards', () => {
  const cards = startDemos(ix);
  const byKey = Object.fromEntries(cards.map(c => [c.key, c]));

  it('offers the three Cerebr examples, plus the 9898 copy group when the index supports it', () => {
    expect(cards.map(c => c.key)).toEqual(['cerebr-5', 'cerebr-34', 'cerebr-12', 'n9898-group']);
  });

  it('Cerebr #5 is the XOR wrapper built from #1/#2/#3', () => {
    const c = byKey['cerebr-5'];
    expect(c.cpu).toBe(CEREBR);
    expect(c.id).toBe(5);
    expect(c.view).toBe('lookup');
    expect(c.title).toMatch(/XOR wrapper/i);
    expect(c.fact).toMatch(/#2.*#3.*#1/);
    expect(c.kicker).toBe('Cerebr #5');
  });

  it('Cerebr #34 is a silent copy of #4, proven by block', () => {
    const c = byKey['cerebr-34'];
    expect(c.id).toBe(34);
    expect(c.vs).toBe(4);
    expect(c.view).toBe('copy');
    expect(c.title).toMatch(/silent copy of #4/i);
    expect(c.title).toMatch(/by block/i);
    expect(c.fact).toMatch(/#4/);
    expect(toHash({ cpu: c.cpu, id: c.id, vs: c.vs, view: c.view })).toBe(`#/${CEREBR}/34?vs=4&view=copy`);
  });

  it('Cerebr #12 reports 11 REF uses across 3 parents', () => {
    const rec = ix.circuits[`${CEREBR}:12`];
    const uses = rec.p.reduce((a, p) => a + p[2], 0);
    expect(rec.p).toHaveLength(3);
    expect(uses).toBe(11);
    const c = byKey['cerebr-12'];
    expect(c.view).toBe('lineage');
    expect(c.fact).toMatch(/11 REF uses across 3 parents/);
    expect(c.fact).toMatch(/#9 ×8/);
  });

  it('9898 #1 links the identical-toy copy group without inventing a size', () => {
    const rec = ix.circuits[`${N9898}:1`];
    const g = ix.twins[rec.t];
    const c = byKey['n9898-group'];
    expect(c.cpu).toBe(N9898);
    expect(c.id).toBe(1);
    expect(c.view).toBe('copy');
    expect(g.members.length).toBe(1523);
    expect(c.title).toMatch(/1,523-member identical-toy copy group/);
    expect(c.fact).toMatch(/1,523 circuits share these 3-NAND bytes/);
    expect(c.fact).toMatch(/1,022 of them on 9898/);
    expect(c.fact).toMatch(/isn’t proven by block/);
    expect(toHash({ cpu: c.cpu, id: c.id, vs: c.vs, view: c.view })).toBe(`#/${N9898}/1?view=copy`);
  });

  it('omits a card when the supporting index fact is gone', () => {
    const empty: TracedIndex = { ...ix, circuits: {}, twins: [] };
    expect(startDemos(empty)).toEqual([]);
  });

  it('can build the 9898 card from the core index without loading shards', () => {
    const core: TracedIndex = JSON.parse(fs.readFileSync(new URL('index.json', root), 'utf8'));
    const cards = startDemos(core);
    expect(cards.map(c => c.key)).toEqual(['cerebr-5', 'cerebr-34', 'cerebr-12', 'n9898-group']);
    expect(core.circuits[`${N9898}:1`]).toBeUndefined();
  });
});
