// Local step() / eval() for a decoded TapeOut netlist.
// Verified against on-chain step() (Cerebr TAPEOUT.md and live calls):
//   each LATCH outputs its current state bit; outputs are computed from that
//   state; then every latch samples d into newState. Empty state is all zeros.
//   LATCH d may point at a later signal (feedback). REF state is concatenated
//   into the parent in visit order. NAND / REF inputs only point backward.
import type { NetlistElement } from './netlist';

export interface SimCircuit {
  nIn: number;
  nOut: number;
  nState: number;
  elements: NetlistElement[];
}

export type ResolveCircuit = (cpu: string, id: number) => SimCircuit | null;

export interface StepResult {
  newState: number[];
  outputs: number[];
}

function bit(signals: number[], i: number): number {
  const v = signals[i];
  return v ? 1 : 0;
}

/** One synchronous step. `state` and `inputs` are LSB-first bit arrays. */
export function stepLocal(
  circ: SimCircuit,
  state: number[],
  inputs: number[],
  resolve: ResolveCircuit = () => null,
): StepResult {
  const signals: number[] = [0, 1];
  for (let i = 0; i < circ.nIn; i++) signals.push(inputs[i] ? 1 : 0);

  const newState = Array.from({ length: circ.nState }, () => 0);
  let si = 0;
  const pending: { slot: number; d: number }[] = [];

  for (const el of circ.elements) {
    if (el.tag === 'nand') {
      signals.push((~(bit(signals, el.a) & bit(signals, el.b))) & 1);
    } else if (el.tag === 'latch') {
      const q = state[si] ? 1 : 0;
      pending.push({ slot: si, d: el.d });
      si += 1;
      signals.push(q);
    } else {
      const sub = resolve(el.cpu, el.id);
      if (!sub) {
        throw new Error(`Cannot simulate REF ${el.cpu} #${el.id}: netlist not loaded.`);
      }
      const subState = Array.from({ length: sub.nState }, (_, k) => (state[si + k] ? 1 : 0));
      const subIn = el.ins.map(s => bit(signals, s));
      const r = stepLocal(sub, subState, subIn, resolve);
      for (let k = 0; k < sub.nState; k++) newState[si + k] = r.newState[k] ? 1 : 0;
      si += sub.nState;
      for (const o of r.outputs) signals.push(o ? 1 : 0);
    }
  }

  for (const p of pending) newState[p.slot] = bit(signals, p.d);

  const outputs = signals.slice(Math.max(0, signals.length - circ.nOut)).map(v => (v ? 1 : 0));
  while (outputs.length < circ.nOut) outputs.unshift(0);
  return { newState, outputs };
}

/** Combinational eval: the same walk with an empty state (nState must be 0). */
export function evalLocal(circ: SimCircuit, inputs: number[], resolve?: ResolveCircuit): number[] {
  if (circ.nState) throw new Error('has latch: use step');
  return stepLocal(circ, [], inputs, resolve).outputs;
}

/** A short chained input sequence starting from an all-zero state. */
export function defaultInputSequence(nIn: number, steps = 8): number[][] {
  if (nIn <= 0) return Array.from({ length: steps }, () => []);
  const out: number[][] = [];
  const max = 1 << Math.min(nIn, 8);
  // Cycle through every input vector at least once, then repeat a few mixed rows.
  for (let r = 0; r < Math.max(steps, max); r++) {
    const v = r % max;
    out.push(Array.from({ length: nIn }, (_, i) => (v >> i) & 1));
    if (out.length >= steps && r + 1 >= max) break;
  }
  return out.slice(0, Math.max(steps, max));
}

/** Every (state, inputs) pair, for small pin counts. */
export function catalogPairs(nIn: number, nState: number): { state: number[]; inputs: number[] }[] {
  const nS = 1 << nState, nI = 1 << Math.max(nIn, 0);
  const out: { state: number[]; inputs: number[] }[] = [];
  for (let s = 0; s < nS; s++) {
    for (let i = 0; i < nI; i++) {
      out.push({
        state: Array.from({ length: nState }, (_, b) => (s >> b) & 1),
        inputs: nIn ? Array.from({ length: nIn }, (_, b) => (i >> b) & 1) : [],
      });
    }
  }
  return out;
}

export const CATALOG_MAX = 32; // 2^(nIn+nState) cap for the exhaustive one-step table
