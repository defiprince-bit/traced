import { describe, expect, it } from 'vitest';
import { decodeNetlist } from '../src/lib/netlist';
import { packBits, unpackBits } from '../src/lib/bits';
import { catalogPairs, evalLocal, stepLocal, type SimCircuit } from '../src/lib/sim';

const FAB49 = '0x01000002'; // LATCH d=input0; nIn=1 nOut=1 nState=1
// Live step() on FAB-Genisis #49, 11 Nov 2026, read-only eth_call at head.
const FAB49_TABLE: [string, string, string, string][] = [
  ['0x00', '0x00', '0x00', '0x00'],
  ['0x00', '0x01', '0x01', '0x00'],
  ['0x01', '0x00', '0x00', '0x01'],
  ['0x01', '0x01', '0x01', '0x01'],
];

// Cerebr #14 (and silent twin #35): 2 LATCH + 17 NAND, nIn=2 nOut=1 nState=2.
const NL14 = '0x010000110100001500000003000003000000020000060000000700000700000008000005000000060000090000000a00000a000000040000020000000400000c0000000200000c0000000d00000e0000000b00000f00000010000010000000050000050000001200000c0000000b0000130000001400001400000009000009';
const C14_TABLE: [string, string, string, string][] = [
  ['0x00', '0x00', '0x00', '0x00'],
  ['0x00', '0x01', '0x01', '0x00'],
  ['0x00', '0x02', '0x00', '0x00'],
  ['0x00', '0x03', '0x00', '0x00'],
  ['0x01', '0x00', '0x01', '0x00'],
  ['0x01', '0x01', '0x02', '0x00'],
  ['0x01', '0x02', '0x00', '0x00'],
  ['0x01', '0x03', '0x00', '0x00'],
  ['0x02', '0x00', '0x02', '0x00'],
  ['0x02', '0x01', '0x00', '0x01'],
  ['0x02', '0x02', '0x00', '0x00'],
  ['0x02', '0x03', '0x00', '0x00'],
  ['0x03', '0x00', '0x03', '0x00'],
  ['0x03', '0x01', '0x00', '0x01'],
  ['0x03', '0x02', '0x00', '0x00'],
  ['0x03', '0x03', '0x00', '0x00'],
];

function circ(hex: string, nIn: number, nOut: number, nState: number): SimCircuit {
  const d = decodeNetlist(hex);
  expect(d.error).toBeNull();
  return { nIn, nOut, nState, elements: d.elements };
}

function run(c: SimCircuit, stateHex: string, inHex: string) {
  const state = unpackBits(stateHex, c.nState);
  const inputs = unpackBits(inHex, c.nIn);
  const r = stepLocal(c, state, inputs);
  return { newState: packBits(r.newState), outputs: packBits(r.outputs) };
}

describe('stepLocal, 1-LATCH delay (FAB-Genisis #49)', () => {
  const c = circ(FAB49, 1, 1, 1);
  it('decodes as a single latch on input 0', () => {
    expect(c.elements).toEqual([{ tag: 'latch', d: 2 }]);
  });
  it('matches every on-chain step() row: Q is current state, D is sampled after', () => {
    for (const [s, i, ns, o] of FAB49_TABLE) {
      expect(run(c, s, i), `state ${s} in ${i}`).toEqual({ newState: ns, outputs: o });
    }
  });
  it('treats an empty state as all zeros', () => {
    const r = stepLocal(c, [], [1]);
    expect(r.outputs).toEqual([0]);
    expect(r.newState).toEqual([1]);
  });
});

describe('stepLocal, Cerebr #14 (17 NAND + 2 LATCH)', () => {
  const c = circ(NL14, 2, 1, 2);
  it('decodes 17 NAND and 2 LATCH, first two elements latches', () => {
    expect(c.elements.filter(e => e.tag === 'nand')).toHaveLength(17);
    expect(c.elements.filter(e => e.tag === 'latch')).toHaveLength(2);
    expect(c.elements[0]).toEqual({ tag: 'latch', d: 0x11 });
    expect(c.elements[1]).toEqual({ tag: 'latch', d: 0x15 });
  });
  it('matches every on-chain step() row recorded for Cerebr #14', () => {
    for (const [s, i, ns, o] of C14_TABLE) {
      expect(run(c, s, i), `state ${s} in ${i}`).toEqual({ newState: ns, outputs: o });
    }
  });
  it('chained sequence starting at 0 agrees with composing one-shot rows', () => {
    const seq = [[0, 0], [1, 0], [1, 0], [0, 1], [1, 1], [1, 0]];
    let state = [0, 0];
    for (const inputs of seq) {
      const one = stepLocal(c, state, inputs);
      const packed = packBits(state);
      const row = C14_TABLE.find(([s, i]) => s === packed && i === packBits(inputs));
      expect(row, `missing golden row for ${packed} ${packBits(inputs)}`).toBeTruthy();
      expect(packBits(one.newState)).toBe(row![2]);
      expect(packBits(one.outputs)).toBe(row![3]);
      state = one.newState;
    }
  });
});

describe('stepLocal, REF to a sequential child', () => {
  const child = circ(FAB49, 1, 1, 1);
  // Wrapper: one REF to the child with its single input wired to circuit input 0.
  // cpu 20 bytes of 0x11, id 1, nIn 1, nOut 1, ins=[2]
  const cpu = '0x' + '11'.repeat(20);
  const id = 1n;
  const refHex = '0x02' + cpu.slice(2) + id.toString(16).padStart(16, '0') + '0101' + '000002';
  const wrapper = circ(refHex, 1, 1, 1);
  const resolve = (c: string, i: number) => (c === cpu && i === 1 ? child : null);

  it('concatenates the child’s state and matches the child table', () => {
    expect(wrapper.elements).toHaveLength(1);
    for (const [s, i, ns, o] of FAB49_TABLE) {
      const r = stepLocal(wrapper, unpackBits(s, 1), unpackBits(i, 1), resolve);
      expect(packBits(r.newState)).toBe(ns);
      expect(packBits(r.outputs)).toBe(o);
    }
  });
});

describe('evalLocal (combinational)', () => {
  // 1-NAND inverter: nIn=1 nOut=1, NAND(in, in)
  const inv = circ('0x00000002000002', 1, 1, 0);
  it('inverts and refuses to eval a latch', () => {
    expect(evalLocal(inv, [0])).toEqual([1]);
    expect(evalLocal(inv, [1])).toEqual([0]);
    expect(() => evalLocal(circ(FAB49, 1, 1, 1), [0])).toThrow(/latch/);
  });
});

describe('catalogPairs', () => {
  it('covers every state × input for the 1-latch toy', () => {
    expect(catalogPairs(1, 1)).toHaveLength(4);
    expect(catalogPairs(2, 2)).toHaveLength(16);
  });
});
