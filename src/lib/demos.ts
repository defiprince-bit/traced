// First-run demo cards. Every number is read from the live index at runtime;
// a card is omitted if the expected fact is missing or no longer holds.
import { CEREBR, type AppView } from '../route';
import { keyOf, num } from './format';
import { circuitName } from './names';
import type { TracedIndex } from './indexTypes';

export const N9898 = '0x60918c204f3c94630d3d793738fc36293c8405d6';

export interface DemoCard {
  key: string;
  cpu: string;
  id: number;
  vs: number | null;
  view: AppView;
  kicker: string;
  title: string;
  fact: string;
  go: string;
}

function parentList(parents: [string, number, number][]): string {
  const parts = parents.map(([_, id, uses]) => (uses > 1 ? `#${id} ×${uses}` : `#${id}`));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function startDemos(ix: TracedIndex): DemoCard[] {
  const out: DemoCard[] = [];
  const get = (cpu: string, id: number) => ix.circuits[keyOf(cpu, id)];
  const cpuName = (addr: string) => ix.cpus.find(c => c.a === addr)?.n ?? `${addr.slice(0, 6)}…`;

  const five = get(CEREBR, 5);
  if (five && five.p.map(p => p[1]).join(',') === '2,3,1') {
    const name = circuitName(CEREBR, 5) || 'XOR';
    out.push({
      key: 'cerebr-5',
      cpu: CEREBR, id: 5, vs: null, view: 'lookup',
      kicker: `${cpuName(CEREBR)} #5`,
      title: `${name} wrapper, built from #1, #2, and #3`,
      fact: `Cites ${parentList(five.p)} as REF parents. Classed as a ${five.k}.`,
      go: 'Open lookup',
    });
  }

  const thirtyFour = get(CEREBR, 34);
  const four = get(CEREBR, 4);
  const g34 = thirtyFour && thirtyFour.t >= 0 ? ix.twins[thirtyFour.t] : null;
  if (
    thirtyFour && four && g34 && g34.ref === 0
    && g34.original?.[0] === CEREBR && g34.original[1] === 4
    && g34.basis === 'block'
    && four.h === thirtyFour.h
  ) {
    out.push({
      key: 'cerebr-34',
      cpu: CEREBR, id: 34, vs: 4, view: 'copy',
      kicker: `${cpuName(CEREBR)} #34`,
      title: 'Silent copy of #4, proven by block',
      fact: `Same netlist bytes as #4, no REF back. #4 is the earlier tape-out of ${num(g34.members.length)} identical copies.`,
      go: 'Open copy check',
    });
  }

  const twelve = get(CEREBR, 12);
  if (twelve && twelve.p.length === 3) {
    const uses = twelve.p.reduce((a, p) => a + p[2], 0);
    const name = circuitName(CEREBR, 12);
    out.push({
      key: 'cerebr-12',
      cpu: CEREBR, id: 12, vs: null, view: 'lineage',
      kicker: `${cpuName(CEREBR)} #12`,
      title: name ? `${name}, ${num(uses)} REF uses` : `${num(uses)} REF uses across ${twelve.p.length} parents`,
      fact: `${num(uses)} REF uses across ${twelve.p.length} parents: ${parentList(twelve.p)}.`,
      go: 'Open lineage',
    });
  }

  // 9898 circuits live in a shard, but the twin group is in the core index.
  const gToy = ix.twins.find(g => g.ref === 0 && g.nand === 3 && g.members.some(m => m[0] === N9898));
  const onCpu = gToy?.members.filter(m => m[0] === N9898) ?? [];
  const toyMember = onCpu.find(m => m[1] === 1) ?? onCpu.slice().sort((a, b) => a[1] - b[1])[0];
  if (gToy && toyMember && gToy.members.length >= 2) {
    const on9898 = gToy.members.filter(m => m[0] === N9898).length;
    out.push({
      key: 'n9898-group',
      cpu: N9898, id: toyMember[1], vs: null, view: 'copy',
      kicker: `${cpuName(N9898)} #${toyMember[1]}`,
      title: `${num(gToy.members.length)}-member identical-toy copy group`,
      fact: `${num(gToy.members.length)} circuits share these 3-NAND bytes (${num(on9898)} of them on ${cpuName(N9898)}). The earliest original isn’t proven by block for every member.`,
      go: 'Open copy check',
    });
  }

  return out;
}
