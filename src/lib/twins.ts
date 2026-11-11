// Copy-twin grouping: circuits whose netlist bytes hash to the same keccak256.
// Identical bytes cannot REF each other (a REF to a sibling would change the bytes),
// so a group has no REF between its members. If the shared bytes themselves contain
// REFs, the members all cite the same parent: "identical citations", not silent copies.

export interface TwinMember {
  cpu: string;
  id: number;
  owner: string | null;
  /** tape-out block, if known */
  block?: number | null;
}

export interface TwinGroup<M extends TwinMember = TwinMember> {
  hash: string;
  members: M[];
  /** index into members of the likely original */
  originalIndex: number;
  /** how the original was picked */
  basis: 'block' | 'id-same-cpu' | 'unknown';
}

/** Earliest member: lowest known tape-out block; else, if all on one CPU, lowest id. */
export function pickOriginal(members: TwinMember[]): { index: number; basis: TwinGroup['basis'] } {
  const known = members.map((m, i) => ({ m, i })).filter(x => typeof x.m.block === 'number');
  if (known.length === members.length && known.length > 0) {
    known.sort((a, b) => (a.m.block! - b.m.block!) || (a.m.cpu === b.m.cpu ? a.m.id - b.m.id : 0));
    return { index: known[0].i, basis: 'block' };
  }
  const cpus = new Set(members.map(m => m.cpu.toLowerCase()));
  if (cpus.size === 1) {
    let best = 0;
    members.forEach((m, i) => { if (m.id < members[best].id) best = i; });
    return { index: best, basis: 'id-same-cpu' };
  }
  return { index: -1, basis: 'unknown' };
}

export function groupByHash<M extends TwinMember & { hash: string }>(items: M[]): TwinGroup<M>[] {
  const by = new Map<string, M[]>();
  for (const it of items) {
    const arr = by.get(it.hash);
    if (arr) arr.push(it);
    else by.set(it.hash, [it]);
  }
  const groups: TwinGroup<M>[] = [];
  for (const [hash, members] of by) {
    if (members.length < 2) continue;
    const { index, basis } = pickOriginal(members);
    groups.push({ hash, members, originalIndex: index, basis });
  }
  return groups.sort((a, b) => b.members.length - a.members.length);
}
