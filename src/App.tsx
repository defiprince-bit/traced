import { useEffect, useMemo, useState } from 'react';
import { useIndex, type LoadedIndex } from './useIndex';
import { CEREBR, toHash, useRoute, type Route } from './route';
import { readCircuit, explorerAddr, explorerTx, type LiveCircuit } from './lib/xlayer';
import { decodeNetlist, refParents } from './lib/netlist';
import { CLASS_RULES, classify } from './lib/classify';
import { Replay } from './Replay';

const short = (a: string, n = 6) => `${a.slice(0, n)}…${a.slice(-4)}`;
const DEMOS = [
  { id: 5, vs: 4, label: '#5 XOR built from REFs' },
  { id: 12, vs: null, label: '#12 line detector (11 REFs)' },
  { id: 4, vs: 34, label: '#4 XOR, the original' },
  { id: 34, vs: 4, label: '#34 silent copy of #4' },
];

export default function App() {
  const { ix, err } = useIndex();
  const [route, go] = useRoute();
  return (
    <div className="page">
      <header className="top">
        <a className="brand" href={toHash({ cpu: CEREBR, id: null, vs: null })}>
          <span className="logo">⌁</span> Traced <span className="for">for TapeOut</span>
        </a>
        <span className="tag">Every circuit, traced back to its source.</span>
      </header>
      {err && <p className="bad">Could not load index: {err}</p>}
      {!ix ? <p className="muted">Loading index…</p> : (
        <>
          <Lookup ix={ix} route={route} go={go} />
          {route.id != null ? <CircuitView key={`${route.cpu}:${route.id}:${route.vs}`} ix={ix} route={route} go={go} /> : <Landing ix={ix} go={go} />}
          <Footer ix={ix} />
        </>
      )}
    </div>
  );
}

function Lookup({ ix, route, go }: { ix: LoadedIndex; route: Route; go: (r: Route) => void }) {
  const [cpu, setCpu] = useState(route.cpu);
  const [id, setId] = useState(route.id?.toString() ?? '');
  useEffect(() => { setCpu(route.cpu); setId(route.id?.toString() ?? ''); }, [route.cpu, route.id]);
  const cpus = useMemo(() => [...ix.cpus].sort((a, b) => (a.a === CEREBR ? -1 : b.a === CEREBR ? 1 : a.n.localeCompare(b.n))), [ix]);
  const custom = !cpus.some(c => c.a === cpu);
  return (
    <form className="card lookup" onSubmit={e => { e.preventDefault(); const n = parseInt(id, 10); if (n > 0) go({ cpu, id: n, vs: null }); }}>
      <label>Processor
        <select value={custom ? '' : cpu} onChange={e => setCpu(e.target.value)} data-testid="cpu">
          {custom && <option value="">{short(cpu)}</option>}
          {cpus.map(c => <option key={c.a} value={c.a}>{c.n} ({c.c} circuits{c.st !== 'scanned' ? `, ${c.st === 'skipped' ? 'not indexed' : 'empty'}` : ''})</option>)}
        </select>
      </label>
      <label>Circuit ID
        <input inputMode="numeric" value={id} onChange={e => setId(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 5" data-testid="id" />
      </label>
      <button className="btn primary" type="submit">Trace</button>
      <div className="demos">
        <span className="muted small">Try on Cerebr:</span>
        {DEMOS.map(d => <a key={d.id} className="chip" href={toHash({ cpu: CEREBR, id: d.id, vs: d.vs })}>{d.label}</a>)}
      </div>
    </form>
  );
}

function Landing({ ix, go }: { ix: LoadedIndex; go: (r: Route) => void }) {
  const m = ix.meta;
  return (
    <section className="card">
      <h2>Who built it first, and who built on it?</h2>
      <p>Every TapeOut circuit on X Layer stores its netlist on-chain. When a designer reuses a circuit properly, the netlist carries a <b>REF</b> — a citation pointing at the original. Traced reads those citations to draw the family tree, hashes every netlist to catch <b>byte-identical copies with no citation</b>, and lets you <b>replay</b> any two circuits for free to prove they behave the same.</p>
      <div className="stats">
        <Stat n={m.circuitsIndexed.toLocaleString()} l={`circuits indexed (of ${m.totalOnFactory.toLocaleString()} on the factory)`} />
        <Stat n={m.refEdges.toLocaleString()} l="REF citations" />
        <Stat n={m.twinGroups.toString()} l="groups of identical netlists" />
        <Stat n={m.block.toLocaleString()} l="index block (X Layer)" />
      </div>
      <button className="btn" onClick={() => go({ cpu: CEREBR, id: 5, vs: 4 })}>Start with Cerebr #5 →</button>
    </section>
  );
}

const Stat = ({ n, l }: { n: string; l: string }) => <div className="stat"><div className="n mono">{n}</div><div className="l">{l}</div></div>;

function Ref({ ix, cpu, id, uses, here }: { ix: LoadedIndex; cpu: string; id: number; uses?: number; here: string }) {
  const rec = ix.circuits[`${cpu}:${id}`];
  return (
    <a className="ref" href={toHash({ cpu, id, vs: null })}>
      <span className="mono">{cpu !== here ? `${ix.cpuName(cpu)} ` : ''}#{id}</span>
      {rec && <span className={`cls cls-${rec.k}`}>{rec.k}</span>}
      {rec && <span className="muted small">{rec.i}→{rec.u} · {rec.g} gates</span>}
      {uses && uses > 1 ? <span className="muted small">×{uses}</span> : null}
    </a>
  );
}

function CircuitView({ ix, route, go }: { ix: LoadedIndex; route: Route; go: (r: Route) => void }) {
  const cpu = route.cpu as `0x${string}`;
  const id = route.id!;
  const [live, setLive] = useState<LiveCircuit | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { readCircuit(cpu, id).then(setLive, e => setErr(String(e?.shortMessage ?? e?.message ?? e))); }, [cpu, id]);

  const k = `${cpu}:${id}`;
  const rec = ix.circuits[k];
  const decoded = useMemo(() => (live ? decodeNetlist(live.netlist) : null), [live]);
  const parents = decoded ? refParents(decoded.refs) : (rec?.p.map(([c, i, u]) => ({ cpu: c, id: i, uses: u })) ?? []);
  const children = rec?.c ?? ix.externalChildren[k] ?? [];
  const hash = live?.hash ?? rec?.h;
  const gi = hash ? ix.byHash.get(hash) : undefined;
  const group = gi != null ? ix.twins[gi] : null;
  const indexed = !!rec;
  const cls = decoded && live ? classify({ nand: decoded.nand, latch: decoded.latch, ref: decoded.refs.length, children: children.length, gateCount: live.gateCount }) : rec?.k;
  const tx = rec?.x;
  const owner = live?.owner ?? rec?.o ?? null;
  const pins = live ?? (rec ? { nIn: rec.i, nOut: rec.u, nState: rec.s, gateCount: rec.g } : null);
  const cpuLabel = ix.cpuName(cpu);
  const isOriginal = group?.original && group.original[0] === cpu && group.original[1] === id;
  const silent = group && group.ref === 0;

  const target = (c: string, i: number) => {
    const r = ix.circuits[`${c}:${i}`];
    return { cpu: c, id: i, label: `${c !== cpu ? ix.cpuName(c) + ' ' : ''}#${i}`, nIn: r?.i ?? pins?.nIn ?? 0, nOut: r?.u ?? pins?.nOut ?? 0, nState: r?.s ?? 0 };
  };
  const options = useMemo(() => {
    const out: ReturnType<typeof target>[] = [];
    const seen = new Set<string>([k]);
    const push = (c: string, i: number) => { const kk = `${c}:${i}`; if (!seen.has(kk)) { seen.add(kk); out.push(target(c, i)); } };
    if (route.vs != null) push(cpu, route.vs);
    if (group) { if (group.original) push(group.original[0], group.original[1]); for (const [c, i] of group.members.slice(0, 40)) push(c, i); }
    for (const p of parents) push(p.cpu, p.id);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, group, parents.length, route.vs, pins?.nIn]);
  const [vsInput, setVsInput] = useState('');

  return (
    <>
      <section className="card">
        <div className="row between wrap">
          <h2 className="mono" data-testid="title">{cpuLabel} #{id}</h2>
          <div className="row gap">
            {group && silent && group.original && (isOriginal
              ? <span className="badge good" data-testid="badge">earliest of {group.members.length} identical copies</span>
              : <span className={`badge ${indexed && cls !== 'toy' ? 'bad' : 'warn'}`} data-testid="badge" title={cls === 'toy' ? 'Tiny gates are often written independently.' : undefined}>
                  {indexed && cls !== 'toy' ? 'silent copy of' : 'same bytes as'} {group.original[0] !== cpu ? ix.cpuName(group.original[0]) + ' ' : ''}#{group.original[1]}{cls === 'toy' ? ' (toy gate)' : !indexed ? ' (order unchecked)' : ''}
                </span>)}
            {cls && <span className={`cls big cls-${cls}`} data-testid="class">{cls}</span>}
          </div>
        </div>
        {err && <p className="bad">Live read failed: {err}</p>}
        {!live && !err && <p className="muted">Reading netlist from X Layer…</p>}
        <dl className="facts">
          <dt>Processor</dt><dd><a className="mono" href={explorerAddr(cpu)} target="_blank" rel="noreferrer">{cpu}</a></dd>
          <dt>Owner</dt><dd className="mono" data-testid="owner" data-live={live ? '1' : '0'}>{owner ? <a href={explorerAddr(owner)} target="_blank" rel="noreferrer">{owner}</a> : '—'}</dd>
          <dt>Pins</dt><dd>{pins ? `${pins.nIn} in → ${pins.nOut} out${pins.nState ? `, ${pins.nState} state bits` : ''}` : '—'}</dd>
          <dt>Gates</dt><dd data-testid="gates">{pins ? <><b>{pins.gateCount.toLocaleString()}</b> flattened through REFs</> : '—'}{decoded && <> · own netlist: {decoded.nand} NAND, {decoded.latch} LATCH, {decoded.refs.length} REF ({decoded.bytes} bytes)</>}</dd>
          <dt>Netlist keccak256</dt><dd className="mono hash" data-testid="hash">{hash ?? '—'}</dd>
          <dt>Tape-out tx</dt><dd className="mono">{tx?.tx ? <a href={explorerTx(tx.tx)} target="_blank" rel="noreferrer" data-testid="tx">{short(tx.tx, 10)}</a> : <span className="muted">not known (public RPC log limits)</span>}
            {tx && <span className="muted small"> · block {tx.block.toLocaleString()}{tx.timestamp ? ` · ${new Date(tx.timestamp * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC` : ''}</span>}</dd>
        </dl>
        {decoded?.error && <p className="bad small">Netlist decode stopped: {decoded.error}</p>}
        {!indexed && <p className="warn small">This circuit isn’t in the prebuilt index (block {ix.meta.block.toLocaleString()}), so children may be missing. Parents and the twin check still work from the live netlist.</p>}
      </section>

      <div className="grid2">
        <section className="card">
          <h3>Built on <span className="muted small">REF parents · {parents.length}</span></h3>
          {parents.length === 0 ? <p className="muted">No REF in the netlist: this circuit cites nobody.</p> :
            <div className="refs" data-testid="parents">{parents.map(p => <Ref key={`${p.cpu}:${p.id}`} ix={ix} here={cpu} cpu={p.cpu} id={p.id} uses={p.uses} />)}</div>}
        </section>
        <section className="card">
          <h3>Cited by <span className="muted small">REF children · {children.length}</span></h3>
          {children.length === 0 ? <p className="muted">No indexed circuit cites this one.</p> :
            <div className="refs" data-testid="children">{children.slice(0, 60).map(([c, i, u]) => <Ref key={`${c}:${i}`} ix={ix} here={cpu} cpu={c} id={i} uses={u} />)}
              {children.length > 60 && <span className="muted small">+{children.length - 60} more</span>}</div>}
        </section>
      </div>

      <section className="card" data-testid="twins">
        <h3>Copy-twins <span className="muted small">same netlist bytes, no REF between them</span></h3>
        {!group ? <p className="muted">No other indexed circuit has this exact netlist.</p> : (
          <>
            <p>
              <b>{group.members.length}</b> indexed circuits{!indexed && ' (plus this one, which is newer than the index or on an unindexed processor)'} share these exact bytes across <b>{new Set(group.members.map(m => m[0])).size}</b> processor(s) and <b>{new Set(group.members.map(m => m[2])).size}</b> owner(s).{' '}
              {silent ? <span className="bad">None of them cites another: these are silent copies.</span>
                : <span className="muted">The shared bytes contain REFs, so every copy cites {group.cites.map(([c, i]) => `${ix.cpuName(c)} #${i}`).join(', ')} — identical citations, not silent copies.</span>}
            </p>
            <p data-testid="original">
              {group.original
                ? <>Likely original: <a className="mono" href={toHash({ cpu: group.original[0], id: group.original[1], vs: null })}>{ix.cpuName(group.original[0])} #{group.original[1]}</a>{isOriginal && <span className="good"> ← this one</span>}{' '}
                  <span className="muted small">({group.basis === 'block' ? 'earliest tape-out block' : 'lowest id on its only processor, so taped out first'})</span></>
                : <span className="muted">Likely original: unknown (tape-out blocks not resolved for every processor).</span>}
            </p>
            <div className="refs">{group.members.slice(0, 80).map(([c, i, o]) => (
              <a key={`${c}:${i}`} className={`ref ${c === cpu && i === id ? 'self' : ''}`} href={toHash({ cpu: c, id: i, vs: null })}>
                <span className="mono">{c !== cpu ? `${ix.cpuName(c)} ` : ''}#{i}</span>
                <span className="muted small mono">{o ? short(o) : ''}{o && owner && o !== owner ? ' · other owner' : ''}</span>
              </a>))}
              {group.members.length > 80 && <span className="muted small">+{group.members.length - 80} more</span>}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h3>Replay <span className="muted small">prove behaviour with free eval()</span></h3>
        {pins ? <Replay key={options[0]?.id} subject={{ cpu, id, label: `#${id}`, nIn: pins.nIn, nOut: pins.nOut, nState: pins.nState }} options={options} /> : <p className="muted">Waiting for pins…</p>}
        <form className="row gap small" onSubmit={e => { e.preventDefault(); const n = parseInt(vsInput, 10); if (n > 0) go({ ...route, vs: n }); }}>
          <span className="muted">Compare with another {cpuLabel} circuit:</span>
          <input className="narrow" inputMode="numeric" value={vsInput} onChange={e => setVsInput(e.target.value.replace(/\D/g, ''))} placeholder="id" />
          <button className="btn" type="submit">Set</button>
        </form>
      </section>

      <section className="card note">
        <h3>What this page can and can’t tell you</h3>
        <ul>
          <li><b>Usage isn’t counted.</b> <code>eval()</code> and <code>step()</code> are free view calls. They leave no trace on-chain, so nobody — Traced included — can count how often a circuit is run. Reuse here means REF citations only.</li>
          <li><b>“Likely original” is a timing fact, not a verdict.</b> The earliest tape-out of identical bytes is shown; two people can write the same 1-NAND inverter independently.</li>
          <li><b>Classes are Traced heuristics</b>, not TapeOut protocol labels. Rules below.</li>
          <li>Children and twins come from an index of {ix.meta.circuitsIndexed.toLocaleString()} circuits at block {ix.meta.block.toLocaleString()}; {ix.meta.skipped.map(s => s.name).join(', ')} were too large to index yet.</li>
        </ul>
      </section>

      <section className="card">
        <h3>Class rules <span className="muted small">first match wins</span></h3>
        <table className="rules">
          <tbody>{CLASS_RULES.map(r => (
            <tr key={r.cls} className={r.cls === cls ? 'active' : ''}><td><span className={`cls cls-${r.cls}`}>{r.cls}</span></td><td>{r.rule}</td><td className="muted">{r.meaning}</td></tr>
          ))}</tbody>
        </table>
      </section>
    </>
  );
}

function Footer({ ix }: { ix: LoadedIndex }) {
  return (
    <footer className="foot muted small">
      Read-only. Traced never asks for a wallet and never sends a transaction. Data: X Layer mainnet (chain {ix.meta.chainId}) via public RPC, TapeOut factory <span className="mono">{short(ix.meta.factory)}</span>. Index built {ix.meta.builtAt.slice(0, 10)}. MIT licensed.
    </footer>
  );
}
