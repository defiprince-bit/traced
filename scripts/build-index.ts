// Builds public/data/index.json from the research dumps (read-only data, no RPC).
// Children (who cites me) and twin groups (same keccak256 netlist) need the whole
// census, so they come from this prebuilt index. The selected circuit itself is
// re-read live in the browser.
import fs from 'node:fs';
import path from 'node:path';
import { keccak256 } from 'viem';
import { decodeNetlist, refParents } from '../src/lib/netlist';
import { classify } from '../src/lib/classify';
import { groupByHash } from '../src/lib/twins';
import type { TracedIndex, IndexCircuit, IndexTwinGroup } from '../src/lib/indexTypes';

const R = process.env.RESEARCH_DIR ?? '/workspace/tapelineage/research/data';
const root = path.resolve(import.meta.dirname, '..');
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf8'));

const circuitsDump = read('circuits.json');
const procs = read('processors.json');
const summary = read('summary.json');
const receipts = read('receipts.json').receipts as { id: number; tx: string; blockNumber: number; to: string; verified?: boolean }[];
const tapeoutsPath = path.join(root, 'data-cache/tapeouts.json');
const tapeouts: Record<string, { block?: number; timestamp?: number; tx?: string | null; error?: string }> =
  fs.existsSync(tapeoutsPath) ? JSON.parse(fs.readFileSync(tapeoutsPath, 'utf8')) : {};

const CEREBR = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const key = (cpu: string, id: number) => `${cpu.toLowerCase()}:${id}`;

// tape-out info: Cerebr receipts verified in research take priority, then the block search cache
const tx: Record<string, { block: number; timestamp: number | null; tx: string | null; source: string }> = {};
for (const [k, v] of Object.entries(tapeouts)) if (v.block != null) tx[k] = { block: v.block, timestamp: v.timestamp ?? null, tx: v.tx ?? null, source: 'nextId-search+TapedOut-log' };
for (const r of receipts) tx[key(CEREBR, r.id)] = { block: r.blockNumber, timestamp: tx[key(CEREBR, r.id)]?.timestamp ?? null, tx: r.tx, source: 'verified-receipt' };

type Raw = { cpu: string; id: number; nIn: number; nOut: number; nState: number; gateCount: number; owner: string | null; netlist_hex: string };
const raws: Raw[] = circuitsDump.circuits;

const parentsOf = new Map<string, { cpu: string; id: number; uses: number }[]>();
const childrenOf = new Map<string, { cpu: string; id: number; uses: number }[]>();
const decoded = new Map<string, ReturnType<typeof decodeNetlist>>();
const hashes = new Map<string, string>();
for (const c of raws) {
  const k = key(c.cpu, c.id);
  const d = decodeNetlist(c.netlist_hex);
  decoded.set(k, d);
  hashes.set(k, keccak256(c.netlist_hex as `0x${string}`));
  const ps = refParents(d.refs);
  parentsOf.set(k, ps);
  for (const p of ps) {
    const pk = key(p.cpu, p.id);
    if (!childrenOf.has(pk)) childrenOf.set(pk, []);
    childrenOf.get(pk)!.push({ cpu: c.cpu.toLowerCase(), id: c.id, uses: p.uses });
  }
}

const groups = groupByHash(raws.map(c => ({
  cpu: c.cpu.toLowerCase(), id: c.id, owner: c.owner, hash: hashes.get(key(c.cpu, c.id))!,
  block: tx[key(c.cpu, c.id)]?.block ?? null,
})));
// Block search only covers the lowest id per CPU in each group; ids on one CPU are
// monotonic in time, so fill the rest with an "at or after" lower bound.
const twinOf = new Map<string, number>();
const twinGroups: IndexTwinGroup[] = groups.map((g, gi) => {
  const minBlockByCpu = new Map<string, number>();
  for (const m of g.members) if (m.block != null) minBlockByCpu.set(m.cpu, Math.min(minBlockByCpu.get(m.cpu) ?? Infinity, m.block));
  // earliest per CPU = its lowest id; compare those across CPUs by block
  const byCpu = new Map<string, typeof g.members[number]>();
  for (const m of g.members) { const b = byCpu.get(m.cpu); if (!b || m.id < b.id) byCpu.set(m.cpu, m); }
  const reps = [...byCpu.values()];
  let original: { cpu: string; id: number } | null = null;
  let basis: IndexTwinGroup['basis'] = 'unknown';
  if (reps.length === 1) { original = reps[0]; basis = 'id-same-cpu'; }
  else if (reps.every(r => r.block != null)) {
    reps.sort((a, b) => a.block! - b.block!);
    original = reps[0]; basis = reps[0].block === reps[1].block ? 'unknown' : 'block';
    if (basis === 'unknown') original = null;
  }
  for (const m of g.members) twinOf.set(key(m.cpu, m.id), gi);
  const d = decoded.get(key(g.members[0].cpu, g.members[0].id))!;
  return {
    hash: g.hash,
    nand: d.nand, latch: d.latch, ref: d.refs.length,
    cites: refParents(d.refs).map(p => [p.cpu, p.id] as [string, number]),
    members: g.members.map(m => [m.cpu, m.id, m.owner ?? null] as [string, number, string | null]),
    original: original ? [original.cpu, original.id] : null,
    basis,
  };
});

const circuits: Record<string, IndexCircuit> = {};
for (const c of raws) {
  const k = key(c.cpu, c.id);
  const d = decoded.get(k)!;
  const children = childrenOf.get(k) ?? [];
  circuits[k] = {
    o: c.owner, i: c.nIn, u: c.nOut, s: c.nState, g: c.gateCount,
    n: d.nand, l: d.latch, r: d.refs.length, h: hashes.get(k)!,
    p: (parentsOf.get(k) ?? []).map(p => [p.cpu, p.id, p.uses]),
    c: children.map(x => [x.cpu, x.id, x.uses]),
    t: twinOf.has(k) ? twinOf.get(k)! : -1,
    k: classify({ nand: d.nand, latch: d.latch, ref: d.refs.length, children: children.length, gateCount: c.gateCount }),
    x: tx[k] ?? null,
  };
}
// children of parents outside the scanned set (e.g. cross-CPU libraries) still need a home
const externalChildren: Record<string, [string, number, number][]> = {};
for (const [pk, ch] of childrenOf) if (!circuits[pk]) externalChildren[pk] = ch.map(x => [x.cpu, x.id, x.uses]);

const scanned = new Set(raws.map(c => c.cpu.toLowerCase()));
const skipped = new Set((summary.factory.skipped as { cpu: string }[]).map(s => s.cpu.toLowerCase()));
const index: TracedIndex = {
  meta: {
    chainId: 196, block: circuitsDump.block, factory: summary.factory.address,
    builtAt: new Date().toISOString(),
    circuitsIndexed: raws.length, cpuCount: procs.cpuCount,
    totalOnFactory: (procs.processors as { nextId: number }[]).reduce((a, p) => a + (p.nextId || 0), 0),
    refEdges: [...parentsOf.values()].reduce((a, ps) => a + ps.reduce((b, p) => b + p.uses, 0), 0),
    twinGroups: twinGroups.length,
    skipped: summary.factory.skipped,
  },
  cpus: (procs.processors as { index: number; circuits: string; name: string; symbol: string; nextId: number }[])
    .filter(p => p.nextId > 0)
    .map(p => ({ a: p.circuits.toLowerCase(), n: p.name, y: p.symbol, x: p.index, c: p.nextId,
      st: scanned.has(p.circuits.toLowerCase()) ? 'scanned' : skipped.has(p.circuits.toLowerCase()) ? 'skipped' : 'empty' })),
  circuits, twins: twinGroups, externalChildren,
};
fs.mkdirSync(path.join(root, 'public/data'), { recursive: true });
const out = path.join(root, 'public/data/index.json');
fs.writeFileSync(out, JSON.stringify(index));
console.log(`wrote ${out}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB, ${raws.length} circuits, ${twinGroups.length} twin groups, ${index.meta.refEdges} REF uses, tx known for ${Object.values(circuits).filter(c => c.x).length}`);
