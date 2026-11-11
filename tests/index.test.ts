// Sanity checks on the prebuilt index against facts verified on-chain during research.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import type { TracedIndex } from '../src/lib/indexTypes';

const ix: TracedIndex = JSON.parse(fs.readFileSync(new URL('../public/data/index.json', import.meta.url), 'utf8'));
const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const get = (id: number) => ix.circuits[`${C}:${id}`];

describe('prebuilt index', () => {
  it('has the census counts from the research pass', () => {
    expect(ix.meta.circuitsIndexed).toBe(2387);
    expect(ix.meta.refEdges).toBe(1511);
    expect(ix.meta.twinGroups).toBe(67);
  });
  it('Cerebr #5 cites #2, #3, #1 and is a wrapper with a verified tx', () => {
    expect(get(5).p.map(p => p[1])).toEqual([2, 3, 1]);
    expect(get(5).k).toBe('wrapper');
    expect(get(5).x?.tx).toBe('0xc3e10087944a57070a3f4acf618992085d06d6af5e381b4675d9fd482976b66e');
  });
  it('Cerebr #3 has 109 REF uses from #5 and #37', () => {
    expect(get(3).c.reduce((a, c) => a + c[2], 0)).toBe(109);
    expect(get(3).k).toBe('library');
  });
  it('Cerebr #4 and #34 are silent twins with #4 as the likely original', () => {
    expect(get(4).h).toBe(get(34).h);
    expect(get(4).t).toBe(get(34).t);
    const g = ix.twins[get(4).t];
    expect(g.ref).toBe(0);
    expect(g.original).toEqual([C, 4]);
    expect(get(4).o).not.toBe(get(34).o);
  });
});
