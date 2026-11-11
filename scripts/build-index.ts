// Builds public/data/index.json (and per-processor shards) from the research
// dumps plus any data-cache/skipped/*.jsonl produced by index-skipped.ts.
// Children and twin groups need the whole census, so they come from this
// prebuilt index. The selected circuit itself is re-read live in the browser.
import fs from 'node:fs';
import path from 'node:path';
import { keccak256 } from 'viem';
import { decodeNetlist, refParents } from '../src/lib/netlist';
import { classify } from '../src/lib/classify';
import { groupByHash } from '../src/lib/twins';
import type { TracedIndex, IndexCircuit, IndexCpu, IndexTwinGroup } from '../src/lib/indexTypes';

const R = process.env.RESEARCH_DIR ?? '/workspace/tapelineage/research/data';
const root = path.resolve(import.meta.dirname, '..');
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(R, f), 'utf8'));
const SHARD_MIN = 400;
const SKIPPED_DIR = path.join(root, 'data-cache/skipped');

const circuitsDump = read('circuits.json');
const procs = read('processors.json');
const summary = read('summary.json');
const receipts = read('receipts.json').receipts as { id: number; tx: string; blockNumber: number; to: string; verified?: boolean }[];
const tapeoutsPath = path.join(root, 'data-cache/tapeouts.json');
const tapeouts: Record<string, { block?: number; timestamp?: number; tx?: string | null; error?: string }> =
  fs.existsSync(tapeoutsPath) ? JSON.parse(fs.readFileSync(tapeoutsPath, 'utf8')) : {};

const CEREBR = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const key = (cpu: string, id: number) => `${cpu.toLowerCase()}:${id}`;

const tx: Record<string, { block: number; timestamp: number | null; tx: string | null; source: string }> = {};
for (const [k, v] of Object.entries(tapeouts)) if (v.block != null) tx[k] = { block: v.block, timestamp: v.timestamp ?? null, tx: v.tx ?? null, source: 'nextId-search+TapedOut-log' };
for (const r of receipts) tx[key(CEREBR, r.id)] = { block: r.blockNumber, timestamp: tx[key(CEREBR, r.id)]?.timestamp ?? null, tx: r.tx, source: 'verified-receipt' };

type Raw = {
  cpu: string; id: number;
  nIn: number; nOut: number; nState: number; gateCount: number;
  owner: string | null;
  netlist_hex?: string;
  // pre-decoded (from skipped cache)
  n?: number; l?: number; r?: number; h?: string;
  p?: [string, number, number][];
};

const raws: Raw[] = (circuitsDump.circuits as Raw[]).map(c => ({ ...c, cpu: c.cpu.toLowerCase() }));
const fromResearch = new Set(raws.map(c => key(c.cpu, c.id)));

// Merge compact records produced by scripts/index-skipped.ts
const skippedLatest = new Map<string, { name: string; nextIdAtBlock: number; nextIdLatest: number; indexed: number }>();
if (fs.existsSync(SKIPPED_DIR)) {
  for (const f of fs.readdirSync(SKIPPED_DIR)) {
    if (f.endsWith('.meta.json')) {
      const meta = JSON.parse(fs.readFileSync(path.join(SKIPPED_DIR, f), 'utf8'));
      if (meta.cpu) skippedLatest.set(String(meta.cpu).toLowerCase(), meta);
      continue;
    }
    if (!f.endsWith('.jsonl')) continue;
    const cpu = f.replace(/\.jsonl$/, '').toLowerCase();
    let added = 0;
    for (const line of fs.readFileSync(path.join(SKIPPED_DIR, f), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as {
        id: number; o: string | null; i: number; u: number; s: number; g: number;
        n: number; l: number; r: number; h: string; p: [string, number, number][];
        bytes?: number; err?: string | null;
      };
      if (!r.h) continue; // empty / failed fetch
      const k = key(cpu, r.id);
      if (fromResearch.has(k)) continue;
      raws.push({
        cpu, id: r.id, nIn: r.i, nOut: r.u, nState: r.s, gateCount: r.g,
        owner: r.o, n: r.n, l: r.l, r: r.r, h: r.h, p: r.p,
      });
      added++;
    }
    console.log(`merged ${added} circuits from ${f}`);
  }
}

const parentsOf = new Map<string, { cpu: string; id: number; uses: number }[]>();
const childrenOf = new Map<string, { cpu: string; id: number; uses: number }[]>();
const decodedN = new Map<string, { nand: number; latch: number; ref: number }>();
const hashes = new Map<string, string>();
for (const c of raws) {
  const k = key(c.cpu, c.id);
  if (c.netlist_hex) {
    const d = decodeNetlist(c.netlist_hex);
    decodedN.set(k, { nand: d.nand, latch: d.latch, ref: d.refs.length });
    hashes.set(k, keccak256(c.netlist_hex as `0x${string}`));
    parentsOf.set(k, refParents(d.refs));
  } else {
    decodedN.set(k, { nand: c.n ?? 0, latch: c.l ?? 0, ref: c.r ?? 0 });
    hashes.set(k, c.h!);
    parentsOf.set(k, (c.p ?? []).map(([cpu, id, uses]) => ({ cpu: cpu.toLowerCase(), id, uses })));
  }
  for (const p of parentsOf.get(k)!) {
    const pk = key(p.cpu, p.id);
    if (!childrenOf.has(pk)) childrenOf.set(pk, []);
    childrenOf.get(pk)!.push({ cpu: c.cpu.toLowerCase(), id: c.id, uses: p.uses });
  }
}

const groups = groupByHash(raws.map(c => ({
  cpu: c.cpu.toLowerCase(), id: c.id, owner: c.owner, hash: hashes.get(key(c.cpu, c.id))!,
  block: tx[key(c.cpu, c.id)]?.block ?? null,
})));
const twinOf = new Map<string, number>();
const twinGroups: IndexTwinGroup[] = groups.map((g, gi) => {
  const byCpu = new Map<string, typeof g.members[number]>();
  for (const m of g.members) { const b = byCpu.get(m.cpu); if (!b || m.id < b.id) byCpu.set(m.cpu, m); }
  const reps = [...byCpu.values()];
  let original: { cpu: string; id: number } | null = null;
  let basis: IndexTwinGroup['basis'] = 'unknown';
  if (reps.every(r => r.block != null) && reps.length > 0) {
    const sorted = [...reps].sort((a, b) => a.block! - b.block! || a.id - b.id);
    if (sorted.length === 1 || sorted[0].block !== sorted[1].block) {
      original = sorted[0]; basis = 'block';
    } else {
      original = null; basis = 'unknown';
    }
  } else if (reps.length === 1) { original = reps[0]; basis = 'id-same-cpu'; }
  for (const m of g.members) twinOf.set(key(m.cpu, m.id), gi);
  const d = decodedN.get(key(g.members[0].cpu, g.members[0].id))!;
  const ps = parentsOf.get(key(g.members[0].cpu, g.members[0].id)) ?? [];
  return {
    hash: g.hash,
    nand: d.nand, latch: d.latch, ref: d.ref,
    cites: ps.map(p => [p.cpu, p.id] as [string, number]),
    members: g.members.map(m => [m.cpu, m.id, m.owner ?? null] as [string, number, string | null]),
    original: original ? [original.cpu, original.id] : null,
    basis,
  };
});

const circuits: Record<string, IndexCircuit> = {};
for (const c of raws) {
  const k = key(c.cpu, c.id);
  const d = decodedN.get(k)!;
  const children = childrenOf.get(k) ?? [];
  circuits[k] = {
    o: c.owner, i: c.nIn, u: c.nOut, s: c.nState, g: c.gateCount,
    n: d.nand, l: d.latch, r: d.ref, h: hashes.get(k)!,
    p: (parentsOf.get(k) ?? []).map(p => [p.cpu, p.id, p.uses]),
    c: children.map(x => [x.cpu, x.id, x.uses]),
    t: twinOf.has(k) ? twinOf.get(k)! : -1,
    k: classify({ nand: d.nand, latch: d.latch, ref: d.ref, children: children.length, gateCount: c.gateCount }),
    x: tx[k] ?? null,
  };
}
const externalChildren: Record<string, [string, number, number][]> = {};
for (const [pk, ch] of childrenOf) if (!circuits[pk]) externalChildren[pk] = ch.map(x => [x.cpu, x.id, x.uses]);

const indexedByCpu = new Map<string, number>();
for (const c of raws) indexedByCpu.set(c.cpu.toLowerCase(), (indexedByCpu.get(c.cpu.toLowerCase()) ?? 0) + 1);

const cpus: IndexCpu[] = (procs.processors as { index: number; circuits: string; name: string; symbol: string; nextId: number }[])
  .filter(p => p.nextId > 0)
  .map(p => {
    const a = p.circuits.toLowerCase();
    const nextId = p.nextId;
    const i = indexedByCpu.get(a) ?? 0;
    const total = Math.max(0, nextId); // nextId is the last id / circuit count
    let st: IndexCpu['st'] = 'empty';
    if (nextId <= 0) st = 'empty';
    else if (i === 0) st = 'skipped';
    else if (i >= total) st = 'scanned';
    else st = 'partial';
    const latest = skippedLatest.get(a)?.nextIdLatest;
    const rec: IndexCpu = { a, n: p.name, y: p.symbol, x: p.index, c: nextId, i, st };
    if (latest != null && latest !== nextId) rec.latest = latest;
    return rec;
  });

const skipped = cpus.filter(c => c.st === 'skipped' || c.st === 'partial').map(c => ({
  cpu: c.a, name: c.n, nextId: c.c, indexed: c.i,
}));

// Split large processors into lazily loaded shards so index.json stays lean.
const shardDir = path.join(root, 'public/data/c');
fs.mkdirSync(shardDir, { recursive: true });
for (const f of fs.readdirSync(shardDir)) if (f.endsWith('.json')) fs.unlinkSync(path.join(shardDir, f));

const byCpu = new Map<string, Record<string, IndexCircuit>>();
for (const [k, rec] of Object.entries(circuits)) {
  const i = k.lastIndexOf(':');
  const cpu = k.slice(0, i);
  const id = k.slice(i + 1);
  if (!byCpu.has(cpu)) byCpu.set(cpu, {});
  byCpu.get(cpu)![id] = rec;
}
const shards: string[] = [];
const core: Record<string, IndexCircuit> = {};
let shardBytes = 0;
for (const [cpu, recs] of [...byCpu.entries()].sort()) {
  const n = Object.keys(recs).length;
  if (n >= SHARD_MIN) {
    const payload = JSON.stringify({ cpu, circuits: recs });
    fs.writeFileSync(path.join(shardDir, `${cpu}.json`), payload);
    shardBytes += payload.length;
    shards.push(cpu);
  } else {
    for (const [id, rec] of Object.entries(recs)) core[`${cpu}:${id}`] = rec;
  }
}

const refEdges = [...parentsOf.values()].reduce((a, ps) => a + ps.reduce((b, p) => b + p.uses, 0), 0);
const index: TracedIndex = {
  meta: {
    chainId: 196, block: circuitsDump.block, factory: summary.factory.address,
    builtAt: new Date().toISOString(),
    circuitsIndexed: raws.length, cpuCount: procs.cpuCount,
    totalOnFactory: (procs.processors as { nextId: number }[]).reduce((a, p) => a + (p.nextId || 0), 0),
    refEdges, twinGroups: twinGroups.length,
    skipped, shards,
  },
  cpus, circuits: core, twins: twinGroups, externalChildren,
};
fs.mkdirSync(path.join(root, 'public/data'), { recursive: true });
const out = path.join(root, 'public/data/index.json');
const json = JSON.stringify(index);
fs.writeFileSync(out, json);
const coreKb = (json.length / 1024).toFixed(0);
const shardKb = (shardBytes / 1024).toFixed(0);
console.log(`wrote ${out}: ${coreKb} KB core, ${shards.length} shards (${shardKb} KB), ${raws.length} circuits, ${twinGroups.length} twin groups, ${refEdges} REF uses, tx known for ${Object.values(circuits).filter(c => c.x).length}`);
for (const c of cpus.filter(c => c.st !== 'empty' && (c.st !== 'scanned' || c.c > 500 || c.latest))) {
  console.log(`  coverage ${c.n}: ${c.i}/${c.c} ${c.st}${c.latest ? ` latest nextId ${c.latest}` : ''}`);
}
