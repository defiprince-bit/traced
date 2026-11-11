import { useEffect, useState } from 'react';
import { packBits, unpackBits } from '../lib/bits';
import { CATALOG_MAX, catalogPairs, defaultInputSequence, stepLocal, type SimCircuit } from '../lib/sim';
import { loadSimForest, type SimForest } from '../lib/simForest';
import { stepCircuit } from '../lib/xlayer';
import { IconCheck, IconX } from '../ui/icons';
import type { ReplayTarget } from './ReplayTable';

function Bit({ v }: { v: number }) {
  return <span className={`bit${v ? ' on' : ''}`}>{v}</span>;
}

function Bits({ bits }: { bits: number[] }) {
  if (!bits.length) return <span className="foot">∅</span>;
  return <span className="bitrow">{bits.map((b, i) => <Bit key={i} v={b} />)}</span>;
}

function eq(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

type StepRow = {
  state: number[];
  inputs: number[];
  chainNew: number[];
  chainOut: number[];
  localNew: number[] | null;
  localOut: number[] | null;
  vsNew: number[] | null;
  vsOut: number[] | null;
  localOk: boolean | null;
  vsOk: boolean | null;
};

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'shortMessage' in e) return String((e as { shortMessage?: string }).shortMessage);
  return String((e as Error)?.message ?? e);
}

const RPC_BATCH = 10;

async function mapPool<T, R>(items: T[], n: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
  return out;
}

async function runRows(
  subject: ReplayTarget,
  against: ReplayTarget | null,
  comparable: boolean,
  pairs: { state: number[]; inputs: number[] }[],
  forest: SimForest | null,
  chained: boolean,
): Promise<StepRow[]> {
  // Chained rows must run in order (each new state feeds the next). Independent
  // catalog rows can be issued in parallel, staying under the RPC batch cap.
  if (!chained) {
    return mapPool(pairs, RPC_BATCH, async (pair) => {
      const state = pair.state;
      const inputs = pair.inputs;
      const onP = stepCircuit(subject.cpu as `0x${string}`, subject.id, packBits(state), packBits(inputs));
      const vsP = comparable && against
        ? stepCircuit(against.cpu as `0x${string}`, against.id, packBits(state), packBits(inputs))
        : null;
      const on = await onP;
      const chainNew = unpackBits(on.newState, subject.nState);
      const chainOut = unpackBits(on.outputs, subject.nOut);
      let localNew: number[] | null = null;
      let localOut: number[] | null = null;
      let localOk: boolean | null = null;
      if (forest) {
        try {
          const r = stepLocal(forest.root, state, inputs, forest.resolve);
          localNew = r.newState;
          localOut = r.outputs;
          localOk = eq(localNew, chainNew) && eq(localOut, chainOut);
        } catch { /* leave local empty */ }
      }
      let vsNew: number[] | null = null;
      let vsOut: number[] | null = null;
      let vsOk: boolean | null = null;
      if (vsP) {
        const vs = await vsP;
        vsNew = unpackBits(vs.newState, against!.nState);
        vsOut = unpackBits(vs.outputs, against!.nOut);
        vsOk = eq(vsNew, chainNew) && eq(vsOut, chainOut);
      }
      return { state, inputs, chainNew, chainOut, localNew, localOut, vsNew, vsOut, localOk, vsOk };
    });
  }

  const out: StepRow[] = [];
  let chainState = pairs[0] ? pairs[0].state.slice() : [];
  let localState = chainState.slice();
  for (const pair of pairs) {
    const state = chainState;
    const inputs = pair.inputs;
    const on = await stepCircuit(subject.cpu as `0x${string}`, subject.id, packBits(state), packBits(inputs));
    const chainNew = unpackBits(on.newState, subject.nState);
    const chainOut = unpackBits(on.outputs, subject.nOut);
    let localNew: number[] | null = null;
    let localOut: number[] | null = null;
    let localOk: boolean | null = null;
    if (forest) {
      try {
        const r = stepLocal(forest.root, localState, inputs, forest.resolve);
        localNew = r.newState;
        localOut = r.outputs;
        localOk = eq(localNew, chainNew) && eq(localOut, chainOut);
        localState = localNew;
      } catch { /* leave local empty */ }
    }
    let vsNew: number[] | null = null;
    let vsOut: number[] | null = null;
    let vsOk: boolean | null = null;
    if (comparable && against) {
      const vs = await stepCircuit(against.cpu as `0x${string}`, against.id, packBits(state), packBits(inputs));
      vsNew = unpackBits(vs.newState, against.nState);
      vsOut = unpackBits(vs.outputs, against.nOut);
      vsOk = eq(vsNew, chainNew) && eq(vsOut, chainOut);
    }
    out.push({ state, inputs, chainNew, chainOut, localNew, localOut, vsNew, vsOut, localOk, vsOk });
    chainState = chainNew;
  }
  return out;
}

export function LatchReplay({
  subject, against, againstNote, auto = true, big, netlist,
}: {
  subject: ReplayTarget;
  against: ReplayTarget | null;
  againstNote?: string;
  auto?: boolean;
  big?: boolean;
  netlist: `0x${string}` | string | null;
}) {
  const comparable = !!(against && against.nIn === subject.nIn && against.nOut === subject.nOut && against.nState === subject.nState);
  const canCatalog = (1 << (subject.nIn + subject.nState)) <= CATALOG_MAX;
  const [forest, setForest] = useState<SimForest | null>(null);
  const [forestErr, setForestErr] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<StepRow[] | null>(null);
  const [chain, setChain] = useState<StepRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setForest(null);
    setForestErr(null);
    if (!netlist) return;
    loadSimForest(netlist, subject.nIn, subject.nOut, subject.nState).then(
      f => {
        if (cancel) return;
        setForest(f.missing.length ? null : f);
        if (f.missing.length) {
          setForestErr(`Local simulator couldn’t load ${f.missing.length} REF target${f.missing.length === 1 ? '' : 's'} (${f.missing.map(m => `#${m.id}`).join(', ')}). On-chain step() still runs.`);
        }
      },
      e => { if (!cancel) setForestErr(errMsg(e)); },
    );
    return () => { cancel = true; };
  }, [netlist, subject.cpu, subject.id, subject.nIn, subject.nOut, subject.nState]);

  const run = async (f = forest) => {
    setBusy(true); setErr(null);
    try {
      const zero = Array.from({ length: subject.nState }, () => 0);
      const seq = defaultInputSequence(subject.nIn, Math.max(8, 1 << Math.min(subject.nIn, 4))).map(inputs => ({ state: zero, inputs }));
      const chained = await runRows(subject, against, comparable, seq, f, true);
      setChain(chained);
      if (canCatalog) {
        setCatalog(await runRows(subject, against, comparable, catalogPairs(subject.nIn, subject.nState), f, false));
      } else {
        setCatalog(null);
      }
    } catch (e: unknown) {
      setErr(errMsg(e));
    } finally { setBusy(false); }
  };

  useEffect(() => {
    setCatalog(null);
    setChain(null);
    if (auto && subject.nState) void run(forest);
    // forest may arrive after first auto-run; re-run once it loads so local columns fill in.
  }, [subject.cpu, subject.id, against?.cpu, against?.id, auto, forest, canCatalog]);

  const localRows = (catalog ?? []).concat(chain ?? []);
  const localChecked = localRows.filter(r => r.localOk != null);
  const localAgree = localChecked.filter(r => r.localOk).length;
  const vsChecked = localRows.filter(r => r.vsOk != null);
  const vsAgree = vsChecked.filter(r => r.vsOk).length;
  const hasRefs = !!(forest?.root.elements.some(e => e.tag === 'ref') || forestErr);

  return (
    <div className={big ? 'rp-big' : undefined} data-testid="latch-replay">
      {big && (
        <div className="rtiles">
          <div className="tile hi">
            <b>{localChecked.length ? `${localAgree}/${localChecked.length}` : busy ? '…' : '—'}</b>
            <span>on-chain vs local</span>
          </div>
          {comparable && against && (
            <div className="tile">
              <b>{vsChecked.length ? `${vsAgree}/${vsChecked.length}` : '—'}</b>
              <span>vs {against.label} (on-chain)</span>
            </div>
          )}
          <div className="tile"><b>{subject.nState} + {subject.nIn}</b><span>state + inputs</span></div>
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
        {!auto && <button className="btn btn-lume btn-sm" onClick={() => void run()} disabled={busy} data-testid="replay">{busy ? 'Stepping…' : 'Replay (free step)'}</button>}
        {localChecked.length > 0 && (
          <span className="sum" data-testid="verdict">
            {localAgree === localChecked.length
              ? <><IconCheck />{localAgree} of {localChecked.length} match (on-chain vs local)</>
              : <><IconX />{localChecked.length - localAgree} of {localChecked.length} differ (on-chain vs local)</>}
          </span>
        )}
      </div>
      <p className="foot">
        Compared: on-chain <span className="mono">step()</span> (free view call) vs this browser’s simulator, row by row.
        Each LATCH outputs its current state, then samples <span className="mono">d</span> into the next state. Empty state is all zeros.
        0 transactions sent.
      </p>
      {hasRefs && (
        <p className="foot">
          This netlist has REF elements. Child state is concatenated into the parent in visit order, as TAPEOUT.md describes.
          Leaf latches were checked against live <span className="mono">step()</span>; a sequential REF parent is simulated the same way, but we didn’t record a live golden table for one.
        </p>
      )}
      {against && !comparable && (
        <p className="foot">Pins or state width differ ({subject.nIn}→{subject.nOut}, {subject.nState} state vs {against.nIn}→{against.nOut}, {against.nState} state), so rows can’t be compared.</p>
      )}
      {forestErr && <p className="foot" style={{ color: 'var(--copy)' }}>{forestErr}</p>}
      {err && <p className="foot" style={{ color: 'var(--copy)' }}>{err}</p>}
      {busy && !chain && !catalog && <p className="foot">Running free <span className="mono">step()</span> view calls…</p>}

      {catalog && (
        <TableBlock
          title="Every state × input (one step each)"
          label={`${catalog.length} independent steps`}
          rows={catalog}
          subject={subject}
          against={comparable ? against : null}
          testid="latch-catalog"
        />
      )}
      {chain && (
        <TableBlock
          title="Chained sequence, starting at state 0"
          label={`${chain.length} steps · each new state feeds the next`}
          rows={chain}
          subject={subject}
          against={comparable ? against : null}
          testid="latch-chain"
        />
      )}
      {!canCatalog && !busy && (
        <p className="foot">{subject.nIn}+{subject.nState} pins make a full catalog {1 << (subject.nIn + subject.nState)} rows, so only a chained sequence is shown.</p>
      )}
    </div>
  );
}

function TableBlock({
  title, label, rows, subject, against, testid,
}: {
  title: string;
  label: string;
  rows: StepRow[];
  subject: ReplayTarget;
  against: ReplayTarget | null;
  testid: string;
}) {
  return (
    <div className="latch-block">
      <div className="card-h" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <h2>{title}</h2>
        <span className="label">{label}</span>
      </div>
      <div className="scroll">
        <table className="tt" data-testid={testid}>
          <thead>
            <tr>
              <th>State</th>
              <th>In</th>
              <th className="g2">On-chain new</th>
              <th>On-chain out</th>
              <th className="g2">Local new</th>
              <th>Local out</th>
              <th className="g2">Match</th>
              {against && <><th>vs {against.label} new</th><th>vs out</th><th className="g2">vs match</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const ok = r.localOk;
              return (
                <tr key={i} style={{ animationDelay: `${80 + i * 40}ms`, background: ok === false ? 'var(--copy-veil)' : undefined }}>
                  <td><Bits bits={r.state} /></td>
                  <td><Bits bits={r.inputs} /></td>
                  <td className="g2"><Bits bits={r.chainNew} /></td>
                  <td><Bits bits={r.chainOut} /></td>
                  <td className="g2">{r.localNew ? <Bits bits={r.localNew} /> : '—'}</td>
                  <td>{r.localOut ? <Bits bits={r.localOut} /> : '—'}</td>
                  <td className="g2">
                    {ok == null ? <span className="foot">—</span> : ok ? <span className="mk pass"><IconCheck />match</span> : <span className="mk fail"><IconX />differs</span>}
                  </td>
                  {against && <>
                    <td>{r.vsNew ? <Bits bits={r.vsNew} /> : '—'}</td>
                    <td>{r.vsOut ? <Bits bits={r.vsOut} /> : '—'}</td>
                    <td className="g2">
                      {r.vsOk == null ? <span className="foot">—</span> : r.vsOk ? <span className="mk pass"><IconCheck />match</span> : <span className="mk fail"><IconX />differs</span>}
                    </td>
                  </>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Keep SimCircuit referenced so the file type-checks if forest typing shifts.
export type { SimCircuit };
