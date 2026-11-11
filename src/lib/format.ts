import type { CircuitClass } from './classify';
import type { IndexCircuit, IndexTwinGroup } from './indexTypes';
import { circuitName } from './names';

export const CLASS_LABEL: Record<CircuitClass, string> = {
  library: 'Library',
  wrapper: 'Wrapper',
  toy: 'Toy',
  'miner-sized': 'Miner-sized',
  composed: 'Composed',
  flat: 'Flat',
};

/** CSS modifier on .badge — miner-sized maps to .miner */
export const CLASS_MOD: Record<CircuitClass, string> = {
  library: 'library',
  wrapper: 'wrapper',
  toy: 'toy',
  'miner-sized': 'miner',
  composed: 'composed',
  flat: 'flat',
};

export const short = (a: string, n = 6) => (a ? `${a.slice(0, n)}…${a.slice(-4)}` : '');
export const num = (n: number) => n.toLocaleString('en-US');

export function basisLabel(basis: IndexTwinGroup['basis']): string {
  if (basis === 'block') return 'by block';
  if (basis === 'id-same-cpu') return 'by ID on the same processor';
  return 'unknown';
}

export function basisSentence(group: IndexTwinGroup): string {
  if (group.basis === 'block') return 'How we picked the original: earliest tape-out block.';
  if (group.basis === 'id-same-cpu') {
    const missing = group.members.filter(() => false);
    void missing;
    return 'How we picked the original: lowest ID on the same processor, because not every tape-out block is indexed.';
  }
  return 'How we picked the original: tape-out blocks are not resolved for every processor.';
}

/** One-sentence summary from index facts. No invented titles. */
export function summarize(cpu: string, id: number, rec: Pick<IndexCircuit, 'k' | 'g' | 'n' | 'l' | 'r' | 'p' | 'c'>, liveClass?: CircuitClass): string {
  const cls = liveClass ?? rec.k;
  const name = circuitName(cpu, id);
  const parents = rec.p.length;
  const childUses = rec.c.reduce((a, x) => a + x[2], 0);
  const lead = name ? `${name}. ` : '';
  if (cls === 'wrapper') {
    if (rec.r > parents && rec.g) return `${lead}A wrapper. ${rec.r} REFs to ${parents} circuit${parents === 1 ? '' : 's'} make up all ${num(rec.g)} gates.`;
    return `${lead}A wrapper. All ${num(rec.g)} gates come from ${parents} circuit${parents === 1 ? '' : 's'} it credits by REF.`;
  }
  if (cls === 'library') {
    if (childUses) return `${lead}A library cell cited ${num(childUses)} time${childUses === 1 ? '' : 's'}.`;
    return `${lead}A library cell other circuits reuse with credit.`;
  }
  if (cls === 'toy') return `${lead}A toy gate: ${rec.n + rec.l} NAND/LATCH and no REF.`;
  if (cls === 'miner-sized') return `${lead}A miner-sized flat netlist: ${num(rec.g)} flattened gates and no REF. Size only, not proof of mining.`;
  if (cls === 'composed') return `${lead}Composed: ${rec.n} NAND, ${rec.l} LATCH, and ${rec.r} REF${rec.r === 1 ? '' : 's'}.`;
  return `${lead}A flat netlist: ${rec.n} NAND, ${rec.l} LATCH, no REF.`;
}

export function keyOf(cpu: string, id: number) { return `${cpu.toLowerCase()}:${id}`; }
