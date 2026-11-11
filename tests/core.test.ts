import { describe, expect, it } from 'vitest';
import { keccak256 } from 'viem';
import { decodeNetlist, refParents } from '../src/lib/netlist';
import { classify } from '../src/lib/classify';
import { groupByHash, pickOriginal } from '../src/lib/twins';
import { packBits, unpackBits } from '../src/lib/bits';

const CEREBR = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
// Real on-chain netlists from Cerebr (X Layer block 75,628,053)
const NL5 = '0x02b04eb79d1a5eecaabaaff7b77d7c27578ee693ff0000000000000002020100000200000302b04eb79d1a5eecaabaaff7b77d7c27578ee693ff0000000000000003020100000200000302b04eb79d1a5eecaabaaff7b77d7c27578ee693ff00000000000000010201000004000005';
const NL4 = '0x000000020000020000000300000400000005000004000000030000020000000700000600000008000008';

describe('decodeNetlist', () => {
  it('decodes the 3 REFs of Cerebr #5 (XOR)', () => {
    const d = decodeNetlist(NL5);
    expect(d.error).toBeNull();
    expect(d.nand).toBe(0);
    expect(d.bytes).toBe(111);
    expect(d.refs.map(r => r.id)).toEqual([2, 3, 1]);
    expect(d.refs.every(r => r.cpu === CEREBR && r.nIn === 2 && r.nOut === 1)).toBe(true);
    expect(d.refs[0].ins).toEqual([2, 3]);
    expect(d.refs[2].ins).toEqual([4, 5]);
  });
  it('decodes flat XOR #4 as 6 NAND, no REF', () => {
    const d = decodeNetlist(NL4);
    expect(d).toMatchObject({ nand: 6, latch: 0, refs: [], error: null, bytes: 42 });
  });
  it('decodes LATCH and reports truncation instead of throwing', () => {
    expect(decodeNetlist('0x01000002').latch).toBe(1);
    expect(decodeNetlist('0x000000').error).toMatch(/truncated NAND/);
    expect(decodeNetlist('0x07').error).toMatch(/unknown tag/);
  });
  it('merges repeated parents with a use count', () => {
    const one = NL5.slice(2, 2 + 74); // first REF element (37 bytes)
    const ps = refParents(decodeNetlist('0x' + one + one).refs);
    expect(ps).toEqual([{ cpu: CEREBR, id: 2, uses: 2 }]);
  });
});

describe('classify', () => {
  const base = { nand: 0, latch: 0, ref: 0, children: 0, gateCount: 0 };
  it('applies rules in order', () => {
    expect(classify({ ...base, nand: 1, gateCount: 1, children: 109 })).toBe('library'); // Cerebr #3
    expect(classify({ ...base, ref: 3, gateCount: 6 })).toBe('wrapper'); // Cerebr #5
    expect(classify({ ...base, nand: 3, gateCount: 3 })).toBe('toy');
    expect(classify({ ...base, nand: 1204, gateCount: 1204 })).toBe('miner-sized');
    expect(classify({ ...base, nand: 60, ref: 2, gateCount: 272 })).toBe('composed');
    expect(classify({ ...base, nand: 6, gateCount: 6 })).toBe('flat'); // Cerebr #4
    expect(classify({ ...base, nand: 2000, ref: 1, gateCount: 2100 })).toBe('composed');
  });
});

describe('twin grouping', () => {
  const h4 = keccak256(NL4);
  it('groups identical netlists and marks the earliest as the likely original', () => {
    const gs = groupByHash([
      { cpu: CEREBR, id: 34, owner: '0x9ffe', hash: h4, block: 900 },
      { cpu: CEREBR, id: 4, owner: '0xc742', hash: h4, block: 100 },
      { cpu: CEREBR, id: 5, owner: '0xc742', hash: keccak256(NL5), block: 120 },
    ]);
    expect(gs).toHaveLength(1);
    expect(gs[0].members.map(m => m.id).sort()).toEqual([34, 4].sort());
    expect(gs[0].members[gs[0].originalIndex].id).toBe(4);
    expect(gs[0].basis).toBe('block');
  });
  it('falls back to lowest id on a single CPU, and to unknown across CPUs', () => {
    expect(pickOriginal([{ cpu: 'a', id: 9, owner: null }, { cpu: 'a', id: 3, owner: null }])).toEqual({ index: 1, basis: 'id-same-cpu' });
    expect(pickOriginal([{ cpu: 'a', id: 1, owner: null }, { cpu: 'b', id: 1, owner: null }]).basis).toBe('unknown');
  });
});

describe('bit packing (LSB-first)', () => {
  it('matches the research eval vectors', () => {
    expect(packBits([1, 0])).toBe('0x01');
    expect(packBits([0, 1])).toBe('0x02');
    expect(packBits([1, 1, 0, 0, 0, 0, 0, 0, 1])).toBe('0x0301');
    expect(unpackBits('0x01', 1)).toEqual([1]);
    expect(unpackBits('0x', 2)).toEqual([0, 0]);
  });
});
