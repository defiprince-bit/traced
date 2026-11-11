// Read-only census of processors the research pass skipped (nextId > 500).
// Historical eth_call only — never signs or sends a transaction.
// Resumable: compact records are appended to data-cache/skipped/<cpu>.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import {
  encodeFunctionData,
  decodeFunctionResult,
  keccak256,
  type Abi,
} from 'viem';
import { circuitsAbi } from '../src/lib/xlayer';
import { decodeNetlist, refParents } from '../src/lib/netlist';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data-cache/skipped');
const INDEX_BLOCK = 75_628_053n;
const BLOCK_HEX = '0x' + INDEX_BLOCK.toString(16);
const RPCS = ['https://rpc.xlayer.tech', 'https://xlayerrpc.okx.com'];
const BATCH = 10;
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 5);
const RETRIES = 4;

const SKIPPED: { name: string; cpu: `0x${string}` }[] = [
  { name: '9898', cpu: '0x60918c204f3c94630d3d793738fc36293c8405d6' },
  { name: 'TAPELIQUID', cpu: '0x69f663931209096037474d7c20402232e5c762ca' },
  { name: 'FAB-Genisis', cpu: '0x87bfca3494aa228ff589ab9b642143a5e8c8f9a6' },
];

export interface SkippedRecord {
  id: number;
  o: string | null;
  i: number; u: number; s: number; g: number;
  n: number; l: number; r: number;
  h: string;
  p: [string, number, number][];
  bytes: number;
  err: string | null;
}

type RpcCall = { method: string; params: unknown[] };

async function rpcBatch(calls: RpcCall[], attempt = 0): Promise<unknown[]> {
  if (calls.length === 0) return [];
  if (calls.length > BATCH) throw new Error(`batch ${calls.length} > ${BATCH}`);
  const body = calls.map((c, i) => ({ jsonrpc: '2.0', id: i + 1, method: c.method, params: c.params }));
  const url = RPCS[attempt % RPCS.length];
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt + 1 < RETRIES * RPCS.length) {
      await sleep(300 * (attempt + 1));
      return rpcBatch(calls, attempt + 1);
    }
    throw e;
  }
  if (!res.ok) {
    if (attempt + 1 < RETRIES * RPCS.length) {
      await sleep(400 * (attempt + 1));
      return rpcBatch(calls, attempt + 1);
    }
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  const json = await res.json() as { id: number; result?: unknown; error?: { message?: string } }[];
  if (!Array.isArray(json)) {
    // some nodes wrap a single-call response as an object
    if (attempt + 1 < RETRIES * RPCS.length) {
      await sleep(400 * (attempt + 1));
      return rpcBatch(calls, attempt + 1);
    }
    throw new Error(`non-array RPC response from ${url}`);
  }
  const byId = new Map(json.map(r => [r.id, r]));
  const out: unknown[] = [];
  for (let i = 0; i < calls.length; i++) {
    const r = byId.get(i + 1);
    if (!r) throw new Error(`missing result id ${i + 1}`);
    if (r.error) {
      // per-item errors (e.g. ownerOf revert) are returned as Error objects
      out.push(new Error(r.error.message ?? 'rpc error'));
    } else out.push(r.result);
  }
  return out;
}

function callData(fn: string, args: unknown[] = []): `0x${string}` {
  return encodeFunctionData({ abi: circuitsAbi as Abi, functionName: fn, args });
}

function ethCall(to: string, fn: string, args: unknown[] = []): RpcCall {
  return { method: 'eth_call', params: [{ to, data: callData(fn, args) }, BLOCK_HEX] };
}

function decode<T>(fn: string, data: unknown): T | null {
  if (typeof data !== 'string' || !data.startsWith('0x')) return null;
  if (data === '0x' && fn !== 'netlist') return null;
  try {
    return decodeFunctionResult({ abi: circuitsAbi as Abi, functionName: fn, data: data as `0x${string}` }) as T;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function loadDone(file: string): Map<number, SkippedRecord> {
  const m = new Map<number, SkippedRecord>();
  if (!fs.existsSync(file)) return m;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line) as SkippedRecord;
      if (r && typeof r.id === 'number') m.set(r.id, r);
    } catch { /* skip bad line */ }
  }
  return m;
}

async function readNextId(cpu: `0x${string}`): Promise<{ snap: number; latest: number }> {
  const [snapRes, latestRes] = await Promise.all([
    rpcBatch([{ method: 'eth_call', params: [{ to: cpu, data: callData('nextId') }, BLOCK_HEX] }]),
    rpcBatch([{ method: 'eth_call', params: [{ to: cpu, data: callData('nextId') }, 'latest'] }]),
  ]);
  const snap = decode<bigint>('nextId', snapRes[0]);
  const latest = decode<bigint>('nextId', latestRes[0]);
  if (snap == null || latest == null) throw new Error(`nextId failed for ${cpu}`);
  return { snap: Number(snap), latest: Number(latest) };
}

async function fetchBatch(cpu: `0x${string}`, ids: number[]): Promise<SkippedRecord[]> {
  // 3 batches of ≤10: circuitInfo, netlist, ownerOf
  const infos = await rpcBatch(ids.map(id => ethCall(cpu, 'circuitInfo', [BigInt(id)])));
  const nls = await rpcBatch(ids.map(id => ethCall(cpu, 'netlist', [BigInt(id)])));
  const owners = await rpcBatch(ids.map(id => ethCall(cpu, 'ownerOf', [BigInt(id)])));
  const out: SkippedRecord[] = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const raw = nls[i];
    const nl = decode<`0x${string}`>('netlist', raw);
    if (raw instanceof Error || !nl || nl === '0x') {
      out.push({ id, o: null, i: 0, u: 0, s: 0, g: 0, n: 0, l: 0, r: 0, h: '', p: [], bytes: 0, err: raw instanceof Error ? raw.message : 'empty netlist' });
      continue;
    }
    const info = decode<[number, number, number, number]>('circuitInfo', infos[i]);
    let owner: string | null = null;
    const ow = owners[i];
    if (!(ow instanceof Error)) {
      const a = decode<string>('ownerOf', ow);
      if (a) owner = a.toLowerCase();
    }
    const bytes = (nl.length - 2) / 2;
    const d = decodeNetlist(nl);
    const ps = refParents(d.refs);
    out.push({
      id,
      o: owner,
      i: info ? Number(info[0]) : 0,
      u: info ? Number(info[1]) : 0,
      s: info ? Number(info[2]) : 0,
      g: info ? Number(info[3]) : 0,
      n: d.nand, l: d.latch, r: d.refs.length,
      h: keccak256(nl),
      p: ps.map(p => [p.cpu, p.id, p.uses]),
      bytes,
      err: d.error,
    });
  }
  return out;
}

async function indexCpu(name: string, cpu: `0x${string}`): Promise<void> {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${cpu}.jsonl`);
  const metaFile = path.join(CACHE, `${cpu}.meta.json`);
  const { snap, latest } = await readNextId(cpu);
  const lastId = snap; // nextId is the highest existing id (ids run 1..nextId inclusive, as on Cerebr)
  const done = loadDone(file);
  const pending: number[] = [];
  for (let id = 1; id <= lastId; id++) if (!done.has(id)) pending.push(id);
  const meta = {
    name, cpu, block: Number(INDEX_BLOCK), nextIdAtBlock: snap, nextIdLatest: latest,
    target: lastId, done: done.size, pending: pending.length, startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  console.log(`${name}: ${done.size}/${lastId} cached, ${pending.length} to fetch, nextId@${INDEX_BLOCK}=${snap} latest=${latest}`);
  if (!pending.length) return;

  const batches: number[][] = [];
  for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH));

  let ok = 0, fail = 0, bytes = 0;
  const t0 = Date.now();
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= batches.length) return;
      const ids = batches[i];
      let recs: SkippedRecord[] | null = null;
      for (let attempt = 0; attempt < RETRIES; attempt++) {
        try {
          recs = await fetchBatch(cpu, ids);
          break;
        } catch (e) {
          console.warn(`  retry ${attempt + 1} ${name} #${ids[0]}–${ids[ids.length - 1]}: ${(e as Error).message}`);
          await sleep(500 * (attempt + 1));
        }
      }
      if (!recs) {
        fail += ids.length;
        console.error(`  FAILED ${name} #${ids[0]}–${ids[ids.length - 1]}`);
        continue;
      }
      const lines = recs.map(r => JSON.stringify(r)).join('\n') + '\n';
      fs.appendFileSync(file, lines);
      ok += recs.length;
      bytes += recs.reduce((a, r) => a + r.bytes, 0);
      const elapsed = (Date.now() - t0) / 1000;
      const left = pending.length - ok - fail;
      const rate = ok / Math.max(elapsed, 0.1);
      if (ok % 50 < BATCH || left === 0) {
        console.log(`  ${name} ${done.size + ok}/${lastId}  ${rate.toFixed(1)}/s  eta ${left > 0 ? Math.round(left / rate) + 's' : 'done'}  netlist ${(bytes / 1024).toFixed(0)}KB`);
      }
    }
  });
  await Promise.all(workers);
  const final = loadDone(file);
  const errors = [...final.values()].filter(r => r.err && !r.h).length;
  const summary = {
    name, cpu, block: Number(INDEX_BLOCK), nextIdAtBlock: snap, nextIdLatest: latest,
    target: lastId, indexed: final.size, missing: lastId - final.size, emptyOrError: errors,
    finishedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaFile, JSON.stringify(summary, null, 2));
  console.log(`done ${name}: indexed ${final.size}/${lastId}, empty/error ${errors}, latest nextId ${latest}`);
}

async function main() {
  console.log(`Read-only skipped-processor index at block ${INDEX_BLOCK}. RPCs: ${RPCS.join(', ')}. batch≤${BATCH}, concurrency=${CONCURRENCY}.`);
  const only = process.env.ONLY?.toLowerCase();
  for (const p of SKIPPED) {
    if (only && p.name.toLowerCase() !== only && p.cpu !== only) continue;
    await indexCpu(p.name, p.cpu);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
