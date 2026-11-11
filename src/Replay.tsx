import { useState } from 'react';
import { evalCircuit } from './lib/xlayer';
import { packBits, rowBits, unpackBits } from './lib/bits';

interface Target { cpu: string; id: number; label: string; nIn: number; nOut: number; nState: number }
interface Row { inputs: number[]; a: number[] | string; b: number[] | string | null }

const MAX_EXHAUSTIVE_INPUTS = 6; // 64 rows, 7 batched requests of 10

function vectors(nIn: number): number[][] {
  if (nIn === 0) return [[]];
  if (nIn <= MAX_EXHAUSTIVE_INPUTS) return Array.from({ length: 1 << nIn }, (_, r) => rowBits(r, nIn));
  // Deterministic sample: all-0, all-1, then a fixed pseudo-random sequence.
  const out: number[][] = [Array(nIn).fill(0), Array(nIn).fill(1)];
  let s = 0x2545f491;
  for (let k = 0; k < 14; k++) out.push(Array.from({ length: nIn }, () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) & 1; }));
  return out;
}

async function run(t: Target, ins: number[]): Promise<number[] | string> {
  try { return unpackBits(await evalCircuit(t.cpu as `0x${string}`, t.id, packBits(ins)), t.nOut); }
  catch (e) { const m = String((e as Error).message ?? e); return m.includes('latch') ? 'has latch: needs step()' : 'reverted'; }
}

const same = (a: Row['a'], b: Row['b']) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);
const fmt = (v: number[] | string | null) => (v == null ? '—' : Array.isArray(v) ? v.join('') || '∅' : v);

export function Replay({ subject, options }: { subject: Target; options: Target[] }) {
  const [vsKey, setVsKey] = useState(options[0] ? `${options[0].cpu}:${options[0].id}` : '');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const vs = options.find(o => `${o.cpu}:${o.id}` === vsKey) ?? null;
  const comparable = vs && vs.nIn === subject.nIn && vs.nOut === subject.nOut;

  if (subject.nState > 0) {
    return <p className="muted">This circuit has {subject.nState} latch bit(s), so it is sequential: the contract's <code>eval()</code> reverts with “has latch: use step”. Replaying <code>step()</code> needs a state trace and is not in this MVP.</p>;
  }

  async function go() {
    setBusy(true); setErr(null); setRows(null);
    try {
      const vecs = vectors(subject.nIn);
      const out = await Promise.all(vecs.map(async ins => ({
        inputs: ins, a: await run(subject, ins), b: comparable && vs ? await run(vs, ins) : null,
      })));
      setRows(out);
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }

  const agree = rows && comparable ? rows.filter(r => same(r.a, r.b)).length : null;
  return (
    <div>
      <div className="row gap">
        <button className="btn primary" onClick={go} disabled={busy} data-testid="replay">{busy ? 'Replaying…' : 'Replay (free eval)'}</button>
        <label className="muted">compare with&nbsp;
          <select value={vsKey} onChange={e => { setVsKey(e.target.value); setRows(null); }}>
            <option value="">nothing</option>
            {options.map(o => <option key={`${o.cpu}:${o.id}`} value={`${o.cpu}:${o.id}`}>{o.label}{o.nIn !== subject.nIn || o.nOut !== subject.nOut ? ' (different pins)' : ''}</option>)}
          </select>
        </label>
      </div>
      <p className="muted small">
        {subject.nIn <= MAX_EXHAUSTIVE_INPUTS ? `Full truth table: ${1 << subject.nIn} input rows.` : `${subject.nIn} inputs is too many for a full table; running 16 fixed sample vectors.`}{' '}
        Inputs are packed LSB-first (bit i = input i). Each row is one <code>eth_call</code> to <code>eval()</code>: free, read-only, and invisible on-chain.
      </p>
      {err && <p className="bad">{err}</p>}
      {agree != null && rows && (
        <p className={agree === rows.length ? 'verdict good' : 'verdict bad'} data-testid="verdict">
          {agree === rows.length ? `✓ Same behaviour on all ${rows.length} inputs` : `✗ Outputs differ on ${rows.length - agree} of ${rows.length} inputs`} — {subject.label} vs {vs!.label}
        </p>
      )}
      {vs && !comparable && <p className="muted small">Pins differ ({subject.nIn}→{subject.nOut} vs {vs.nIn}→{vs.nOut}), so outputs can’t be compared row by row.</p>}
      {rows && (
        <div className="scroll">
          <table className="tt mono" data-testid="truth-table">
            <thead><tr><th>in ({subject.nIn === 0 ? 'none' : subject.nIn === 1 ? 'x0' : `x0…x${subject.nIn - 1}`})</th><th>{subject.label}</th>{comparable && <><th>{vs!.label}</th><th></th></>}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i}><td>{r.inputs.join('') || '∅'}</td><td>{fmt(r.a)}</td>{comparable && <><td>{fmt(r.b)}</td><td className={same(r.a, r.b) ? 'good' : 'bad'}>{same(r.a, r.b) ? '=' : '≠'}</td></>}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
