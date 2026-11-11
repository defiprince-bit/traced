import type { LoadedIndex } from '../useIndex';
import type { CircuitModel } from './useCircuit';
import { Badge } from '../ui/Badge';
import { VerdictTag } from '../ui/VerdictTag';
import { HonestNote } from '../ui/HonestNote';
import { short, num, summarize } from '../lib/format';
import { circuitName } from '../lib/names';
import { explorerAddr, explorerTx } from '../lib/xlayer';
import { toHash } from '../route';

export function DetailPanel({ ix, model }: { ix: LoadedIndex; model: CircuitModel }) {
  const { cpu, id, rec, cls, parents, children, group, silent, isOriginal, owner, pins, tx, hash } = model;
  if (id == null) return null;
  const name = circuitName(cpu, id);
  const summary = rec ? summarize(cpu, id, rec, cls) : (cls ? `${name ? name + '. ' : ''}A ${cls} circuit.` : 'Reading this circuit…');
  const twinN = group ? group.members.length - 1 : 0;
  return (
    <aside className="card detail" aria-label="Circuit detail">
      <div className="k">
        {cls && <Badge cls={cls} />}
        <span className="label" style={{ marginLeft: 'auto' }}>{ix.cpuName(cpu)}</span>
      </div>
      <h2 data-testid="title">#{id}</h2>
      <h3>{summary}</h3>
      <div className="tiles">
        <div className="tile"><b>{pins ? num(pins.gateCount) : '—'}</b><span>gates, flattened</span></div>
        <div className="tile hi"><b>{parents.reduce((a, p) => a + p.uses, 0)}</b><span>REF uses</span></div>
        <div className="tile"><b>{parents.length}</b><span>REF parents</span></div>
        <div className="tile"><b>{children.length}</b><span>REF children</span></div>
      </div>
      <dl className="kv">
        <dt>Owner</dt>
        <dd data-testid="owner" data-live={model.live ? '1' : '0'} title={owner ?? ''}>
          {owner ? <a href={explorerAddr(owner)} target="_blank" rel="noreferrer">{short(owner)}</a> : '—'}
        </dd>
        <dt>Tape-out tx</dt>
        {tx?.tx ? <dd><a href={explorerTx(tx.tx)} target="_blank" rel="noreferrer" data-testid="tx">{short(tx.tx, 10)} ↗</a></dd> : <dd className="none">Not indexed yet</dd>}
        <dt>Block</dt>
        {tx?.block ? <dd>{num(tx.block)}</dd> : <dd className="none">Unknown</dd>}
        <dt>I/O</dt>
        <dd>{pins ? `${pins.nIn} in → ${pins.nOut} out` : '—'}</dd>
        <dt>Netlist</dt>
        <dd data-testid="hash" title={hash}>{hash ? short(hash) : '—'}</dd>
      </dl>
      <div className="mini">
        {twinN === 0 || !group
          ? <><VerdictTag kind="ok" /><span className="t"><b>Copy check clean</b>No other indexed circuit has these bytes.</span></>
          : silent && !isOriginal && group.original
            ? <><VerdictTag kind="copy" /><span className="t"><b>Silent copy of #{group.original[1]}</b>Same netlist bytes, no REF back.</span></>
            : silent && isOriginal
              ? <><VerdictTag kind="orig" /><span className="t"><b>Likely original</b>{twinN} identical cop{twinN === 1 ? 'y' : 'ies'} share these bytes.</span></>
              : <><span className="t"><b>{twinN} identical citation{twinN === 1 ? '' : 's'}</b>Shared bytes contain REFs, so these are not silent copies.</span></>}
      </div>
      {pins && (
        <div className="mini">
          <span className="t"><b>Replay</b>{pins.nState ? 'Has latches, so eval() can’t replay it in this MVP.' : `${pins.nIn} inputs → ${pins.nIn <= 8 ? 1 << pins.nIn : 'sampled'} rows. Free, in your browser.`}</span>
          {!pins.nState && <a className="btn btn-lume btn-sm" href={toHash({ cpu, id, vs: model.group?.original && !isOriginal ? model.group.original[1] : null, view: 'replay' })}>Replay</a>}
        </div>
      )}
      <HonestNote />
    </aside>
  );
}
