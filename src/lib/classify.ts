// Structural classes. These are Traced heuristics, not TapeOut protocol labels.
// First matching rule wins, in this order.

export type CircuitClass = 'library' | 'wrapper' | 'toy' | 'miner-sized' | 'composed' | 'flat';

export interface ClassInput {
  nand: number;
  latch: number;
  ref: number;
  /** circuits that cite this one with a REF (from the index) */
  children: number;
  /** flattened gate count from circuitInfo() */
  gateCount: number;
}

export const CLASS_RULES: { cls: CircuitClass; rule: string; meaning: string }[] = [
  { cls: 'library', rule: 'Cited by at least one other circuit through a REF', meaning: 'A building block other designers reuse with credit.' },
  { cls: 'wrapper', rule: 'Only REF elements, zero NAND/LATCH of its own', meaning: 'Pure composition of other circuits; burns no transistors itself.' },
  { cls: 'toy', rule: '1–3 NAND/LATCH gates and no REF', meaning: 'Trivial gate (NOT, NAND, AND…). Often copied many times.' },
  { cls: 'miner-sized', rule: 'Flattened gateCount ≥ 1,000 and no REF', meaning: 'A big flat netlist, the size typical of gate-count farming. Size only — not proof of mining.' },
  { cls: 'composed', rule: 'Own NAND/LATCH gates plus at least one REF', meaning: 'New logic that also builds on cited circuits.' },
  { cls: 'flat', rule: 'Anything else: own gates, no REF', meaning: 'An original-looking flat netlist (check its twin group).' },
];

export function classify(c: ClassInput): CircuitClass {
  const burned = c.nand + c.latch;
  if (c.children > 0) return 'library';
  if (c.ref > 0 && burned === 0) return 'wrapper';
  if (c.ref === 0 && burned >= 1 && burned <= 3) return 'toy';
  if (c.ref === 0 && c.gateCount >= 1000) return 'miner-sized';
  if (c.ref > 0) return 'composed';
  return 'flat';
}
