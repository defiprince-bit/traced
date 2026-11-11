import type { LoadedIndex } from "../useIndex";
import { useEffect, useState } from 'react';
import { packBits, unpackBits, rowBits } from '../lib/bits';
import { evalCircuit } from '../lib/xlayer';
import { IconCheck, IconX } from '../ui/icons';

export interface ReplayTarget { cpu: string; id: number; label: string; nIn: number; nOut: number; nState: number }

const MAX_EXHAUSTIVE = 8;
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function Bit({ v }: { v: number }) {
  return <span className={`bit${v ? ' on' : ''}`}>{v}</span>;
}

export function ReplayTable({
  subject, against, againstNote, auto = true, big,
}: {
  subject: ReplayTarget;
  against: ReplayTarget | null;
  againstNote?: string;
  auto?: boolean;
  big?: boolean;
}) {
  const comparable = !!(against && against.nIn === subject.nIn && against.nOut === subject.nOut && !subject.nState && !against.nState);
  const nRows = subject.nIn <= MAX_EXHAUSTIVE ? 1 << subject.nIn : 16;
  const [rows, setRows] = useState<{ inputs: number[]; a: number[]; b: number[] | null }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (subject.nState) { setErr('This circuit has latches, so eval() can’t replay it.'); return; }
    setBusy(true); setErr(null);
    try {
      const out: { inputs: number[]; a: number[]; b: number[] | null }[] = [];
      for (let r = 0; r < nRows; r++) {
        const bits = subject.nIn <= MAX_EXHAUSTIVE ? rowBits(r, subject.nIn) : rowBits((r * 0x9e3779b9) >>> 0, subject.nIn).map((b, i) => (r + i) & 1 ? 1 : b);
        // for sample vectors when nIn > 8, use a fixed set: first 8 rows are 0..7 in low bits, rest mixed
        const inputs = subject.nIn <= MAX_EXHAUSTIVE ? rowBits(r, subject.nIn) : bits;
        const packed = packBits(inputs);
        const aHex = await evalCircuit(subject.cpu as `0x${string}`, subject.id, packed);
        const a = unpackBits(aHex, subject.nOut);
        let b: number[] | null = null;
        if (comparable && against) {
          const bHex = await evalCircuit(against.cpu as `0x${string}`, against.id, packed);
          b = unpackBits(bHex, against.nOut);
        }
        out.push({ inputs, a, b });
      }
      setRows(out);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'shortMessage' in e ? String((e as { shortMessage?: string }).shortMessage) : String((e as Error)?.message ?? e);
      setErr(msg);
    } finally { setBusy(false); }
  };

  useEffect(() => { setRows(null); if (auto && !subject.nState) void run(); }, [subject.cpu, subject.id, against?.cpu, against?.id, auto]);

  const agree = rows && comparable ? rows.filter(r => r.b && r.a.every((v, i) => v === r.b![i])).length : null;
  const inCols = Math.min(subject.nIn, 8);

  return (
    <div className={big ? 'rp-big' : undefined}>
      {big && (
        <div className="rtiles">
          <div className="tile hi"><b>{agree != null && rows ? `${agree}/${rows.length}` : busy ? '…' : '—'}</b><span>rows match</span></div>
          <div className="tile"><b>{subject.nIn} → {subject.nOut}</b><span>inputs → output</span></div>
          <div className="tile"><b>0</b><span>transactions sent</span></div>
        </div>
      )}
      <div className="rp-meta">
        <span className="cmp">Run <span className="mono">{subject.label}</span></span>
        {against && (
          <span className="cmp">vs <span className="mono">{against.label}</span>
            {againstNote && <span className="foot">{againstNote}</span>}
          </span>
        )}
        {!auto && <button className="btn btn-lume btn-sm" onClick={() => void run()} disabled={busy} data-testid="replay">{busy ? 'Replaying…' : 'Replay (free eval)'}</button>}
        {agree != null && rows && (
          <span className="sum" data-testid="verdict">{agree === rows.length ? <><IconCheck />{agree} of {rows.length} match</> : <><IconX />{rows.length - agree} of {rows.length} differ</>}</span>
        )}
      </div>
      {!!subject.nState && <p className="foot">Sequential circuits (with latches) can’t be replayed with eval() in this MVP.</p>}
      {against && !comparable && !subject.nState && <p className="foot">Pins differ ({subject.nIn}→{subject.nOut} vs {against.nIn}→{against.nOut}), so outputs can’t be compared row by row.</p>}
      {err && <p className="foot" style={{ color: 'var(--copy)' }}>{err}</p>}
      {busy && !rows && <p className="foot">Running free eval() view calls…</p>}
      {rows && (
        <div className="scroll">
          <table className="tt" data-testid="truth-table">
            <thead>
              <tr>
                {Array.from({ length: inCols }, (_, i) => <th key={i}>{subject.nIn <= 8 ? letters[i] : `x${i}`}</th>)}
                {subject.nIn === 0 && <th>∅</th>}
                <th className="g2">{subject.label} out</th>
                {comparable && against && <><th>{against.label} out</th><th className="g2">Match</th></>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const ok = !comparable || (r.b != null && r.a.every((v, j) => v === r.b![j]));
                return (
                  <tr key={i} style={{ animationDelay: `${150 + i * 70}ms`, background: !ok ? 'var(--copy-veil)' : undefined }}>
                    {inCols ? r.inputs.slice(0, inCols).map((b, j) => <td key={j}><Bit v={b} /></td>) : <td>—</td>}
                    <td className="g2">{r.a.map((b, j) => <Bit key={j} v={b} />)}</td>
                    {comparable && <>
                      <td>{r.b && r.b.map((b, j) => <Bit key={j} v={b} />)}</td>
                      <td className="g2">{ok ? <span className="mk pass"><IconCheck />match</span> : <span className="mk fail"><IconX />differs</span>}</td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="foot" style={{ margin: '12px 0 0' }}>The app fills this table from live <span className="mono">eval()</span> view calls on X Layer. 0 transactions sent.</p>
    </div>
  );
}

export function replayOptions(
  ix: LoadedIndex,
  cpu: string, id: number,
  vs: number | null,
  group: LoadedIndex['twins'][number] | null,
  parents: { cpu: string; id: number; uses: number }[],
  pins: { nIn: number; nOut: number; nState: number } | null,
): ReplayTarget[] {
  const out: ReplayTarget[] = [];
  const seen = new Set<string>([`${cpu}:${id}`]);
  const push = (c: string, i: number, label?: string) => {
    const kk = `${c}:${i}`; if (seen.has(kk)) return; seen.add(kk);
    const r = ix.circuits[kk];
    out.push({ cpu: c, id: i, label: label ?? (c !== cpu ? `${ix.cpuName(c)} #${i}` : `#${i}`), nIn: r?.i ?? pins?.nIn ?? 0, nOut: r?.u ?? pins?.nOut ?? 0, nState: r?.s ?? 0 });
  };
  if (vs != null) push(cpu, vs);
  if (group) {
    if (group.original) push(group.original[0], group.original[1], group.original[0] === cpu ? `#${group.original[1]}` : `${ix.cpuName(group.original[0])} #${group.original[1]}`);
    for (const [c, i] of group.members.slice(0, 40)) push(c, i);
  }
  for (const p of parents) push(p.cpu, p.id);
  return out;
}
