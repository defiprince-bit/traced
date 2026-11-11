// Read-only enrichment: for each (cpu, id) we care about, find the block where
// the circuit was taped out by binary-searching nextId() with historical eth_call,
// then read the TapedOut log in that single block to get the tx hash.
// Nothing is signed or sent. Output: data-cache/tapeouts.json (resumable).
import fs from 'node:fs';
const RPCS = ['https://rpc.xlayer.tech', 'https://xlayerrpc.okx.com'];
const TOPIC0 = '0xc11215e417669c143c8a07aeb778034c0a0a85ebdf305d64a629b19a7a9ce031';
const R = '/workspace/tapelineage/research/data';
const OUT = new URL('../data-cache/tapeouts.json', import.meta.url).pathname;
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let rr = 0;
async function rpc(method, params, tries = 6) {
  for (let t = 0; t < tries; t++) {
    const url = RPCS[rr++ % RPCS.length];
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const j = await res.json();
      if (j.error) throw new Error(JSON.stringify(j.error));
      return j.result;
    } catch (e) { await new Promise(r => setTimeout(r, 400 * (t + 1))); if (t === tries - 1) throw e; }
  }
}
async function batchCall(cpu, blocks, tries = 6) {
  for (let t = 0; t < tries; t++) {
    const url = RPCS[rr++ % RPCS.length];
    try {
      const body = blocks.map((b, i) => ({ jsonrpc: '2.0', id: i, method: 'eth_call', params: [{ to: cpu, data: '0x61b8ce8c' }, '0x' + b.toString(16)] }));
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!Array.isArray(j)) throw new Error(JSON.stringify(j));
      j.sort((a, b) => a.id - b.id);
      return j.map(x => { if (x.error) throw new Error(JSON.stringify(x.error)); return !x.result || x.result === '0x' ? 0 : Number(BigInt(x.result)); });
    } catch (e) { await new Promise(r => setTimeout(r, 500 * (t + 1))); if (t === tries - 1) throw e; }
  }
}
const nextIdAt = async (cpu, b) => {
  const r = await rpc('eth_call', [{ to: cpu, data: '0x61b8ce8c' }, '0x' + b.toString(16)]);
  return !r || r === '0x' ? 0 : Number(BigInt(r));
};
const latest = Number(BigInt(await rpc('eth_blockNumber', [])));
const twins = JSON.parse(fs.readFileSync(`${R}/twins.json`, 'utf8')).groups;
const want = new Map(); // cpu -> Set(ids)
const add = (cpu, id) => { cpu = cpu.toLowerCase(); if (!want.has(cpu)) want.set(cpu, new Set()); want.get(cpu).add(id); };
for (const g of twins) { const m = {}; for (const x of g.members) m[x.cpu] = Math.min(m[x.cpu] ?? 1e9, x.id); for (const [c, i] of Object.entries(m)) add(c, i); }
for (let i = 1; i <= 38; i++) add('0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff', i);
const total = [...want.values()].reduce((a, s) => a + s.size, 0);
console.log('targets', total, 'cpus', want.size, 'latest', latest);
let done = 0;
async function doCpu(cpu, ids) {
  let lo0 = 0;
  for (const id of [...ids].sort((a, b) => a - b)) {
    const key = `${cpu}:${id}`;
    if (cache[key]) { lo0 = cache[key].block ?? lo0; done++; continue; }
    let lo = lo0, hi = latest;
    if ((await nextIdAt(cpu, hi)) < id) { cache[key] = { error: 'not found' }; continue; }
    // k-ary search: 9 probes per batched request (public RPC caps batches at 10)
    while (hi - lo > 0) {
      const pts = []; for (let k = 1; k <= 9; k++) { const p = lo + Math.floor(((hi - lo) * k) / 10); if (p >= lo && p < hi && !pts.includes(p)) pts.push(p); }
      if (!pts.length) pts.push(lo);
      const vals = await batchCall(cpu, pts);
      let nlo = lo, nhi = hi;
      for (let k = 0; k < pts.length; k++) { if (vals[k] >= id) { nhi = Math.min(nhi, pts[k]); } else { nlo = Math.max(nlo, pts[k] + 1); } }
      lo = nlo; hi = nhi;
    }
    const logs = await rpc('eth_getLogs', [{ address: cpu, fromBlock: '0x' + lo.toString(16), toBlock: '0x' + lo.toString(16),
      topics: [TOPIC0, '0x' + id.toString(16).padStart(64, '0')] }]);
    const blk = await rpc('eth_getBlockByNumber', ['0x' + lo.toString(16), false]);
    cache[key] = { block: lo, timestamp: Number(BigInt(blk.timestamp)), tx: logs[0]?.transactionHash ?? null,
      author: logs[0] ? '0x' + logs[0].topics[2].slice(26) : null };
    lo0 = lo; done++;
    if (done % 20 === 0) { fs.writeFileSync(OUT, JSON.stringify(cache)); console.log('done', done, '/', total); }
  }
}
const queue = [...want.entries()];
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) { const [c, s] = queue.shift(); try { await doCpu(c, s); } catch (e) { console.error('cpu fail', c, e.message); } } }));
fs.writeFileSync(OUT, JSON.stringify(cache));
console.log('finished', Object.keys(cache).length);
