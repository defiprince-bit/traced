import { useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitModel } from './useCircuit';
import { Badge } from '../ui/Badge';
import { VerdictTag } from '../ui/VerdictTag';
import { HonestNote } from '../ui/HonestNote';
import { RadialLineage, type LineageMode } from './RadialLineage';
import { LineageList } from './LineageList';
import { ReplayTable, replayOptions } from './ReplayTable';
import { IconCheck } from '../ui/icons';
import { short, num, summarize } from '../lib/format';
import { circuitName } from '../lib/names';
import { explorerAddr, explorerTx } from '../lib/xlayer';
import { toHash } from '../route';

export function LookupView({ ix, model, vs }: { ix: LoadedIndex; model: CircuitModel; vs: number | null }) {
  const { cpu, id, rec, cls, parents, children, group, silent, isOriginal, owner, pins, tx, hash, decoded } = model;
  const [mode, setMode] = useState<LineageMode>('parents');
  if (id == null) return null;
  const name = circuitName(cpu, id);
  const summary = rec ? summarize(cpu, id, rec, cls) : '';
  const options = replayOptions(ix, cpu, id, vs, group, parents, pins);
  const against = options[0] ?? null;
  const againstIsPicked = vs != null && against && against.cpu === cpu && against.id === vs;
  const againstNote = againstIsPicked
    ? `you picked${circuitName(against.cpu, against.id) ? `: ${circuitName(against.cpu, against.id)}` : ''}`
    : (group?.original && against && against.cpu === group.original[0] && against.id === group.original[1] ? 'twin · likely original' : undefined);
  const twinN = group ? group.members.length - 1 : 0;

  return (
    <div className="ov">
      <section className="card span2">
        <div className="hdc">
          <div className="top">
            <span className="cidbig" data-testid="title"><span>#</span>{id}</span>
            {cls && <span data-testid="class"><Badge cls={cls} /></span>}
            <span className="on">on {ix.cpuName(cpu)}{name ? ` · ${name}` : ''}</span>
            {silent && group?.original && (
              isOriginal
                ? <span data-testid="badge"><VerdictTag kind="orig" /></span>
                : <span data-testid="badge"><VerdictTag kind="copy" /></span>
            )}
          </div>
          {summary && <h2>{summary}</h2>}
          {rec && parents.length > 0 && rec.p.length > 0 && (
            <p>
              {parents.map((p, i) => (
                <span key={`${p.cpu}:${p.id}`}>{i ? ', ' : ''}#{p.id}{circuitName(p.cpu, p.id) ? ` ${circuitName(p.cpu, p.id)}` : ''}{p.uses > 1 ? ` ×${p.uses}` : ''}</span>
              ))}
              {decoded && <> · own netlist: {decoded.nand} NAND, {decoded.latch} LATCH, {decoded.refs.length} REF ({decoded.bytes} bytes)</>}
            </p>
          )}
          <div className="facts">
            <div className="fact"><span className="label">Owner</span>
              <span className="v" data-testid="owner" data-live={model.live ? '1' : '0'} title={owner ?? ''}>
                {owner ? <a href={explorerAddr(owner)} target="_blank" rel="noreferrer">{short(owner)}</a> : '—'}
              </span>
              <span className="v2">{pins ? `${pins.nIn} in → ${pins.nOut} out` : ''}</span>
            </div>
            <div className="fact"><span className="label">Gates</span>
              <span className="v" data-testid="gates">{pins ? num(pins.gateCount) : '—'}</span>
              <span className="v2">flattened</span>
            </div>
            <div className="fact"><span className="label">Own parts</span>
              <span className="v">{rec ? `${rec.r} REF` : decoded ? `${decoded.refs.length} REF` : '—'}</span>
              <span className="v2">{rec ? `${rec.n} NAND · ${rec.l} LATCH` : decoded ? `${decoded.nand} NAND · ${decoded.latch} LATCH` : ''}</span>
            </div>
            <div className="fact"><span className="label">Tape-out</span>
              {tx?.tx ? <><span className="v"><a href={explorerTx(tx.tx)} target="_blank" rel="noreferrer" data-testid="tx">{short(tx.tx, 10)} ↗</a></span><span className="v2">block {num(tx.block)}</span></> : <><span className="v none">Not indexed yet</span><span className="v2">no tx in the index</span></>}
            </div>
            <div className="fact"><span className="label">Netlist hash</span>
              <span className="v" data-testid="hash" title={hash}>{hash ? short(hash) : '—'}</span>
              <span className="v2">keccak256</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card" aria-label="Lineage" data-testid="parents">
        <div className="card-h"><h2>Lineage</h2><span className="label">{parents.length} parents · {children.length} children</span></div>
        <RadialLineage ix={ix} cpu={cpu} id={id} cls={cls} name={name} parents={parents} children={children} group={group} mode={mode} onMode={setMode} small />
        <LineageList ix={ix} cpu={cpu} id={id} cls={cls} parents={parents} children={children} group={group} mode={mode} onMode={setMode} />
        <div data-testid="children" className="foot" style={{ padding: '0 20px 14px' }}>
          {children.length ? children.map(([c, i, u]) => `${c !== cpu ? ix.cpuName(c) + ' ' : ''}#${i}${u > 1 ? ' ×' + u : ''}`).join(' · ') : 'No indexed circuit cites this one.'}
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section className="card" data-testid="twins">
          <div className="card-h"><h2>Copy check</h2><span className="label">same bytes · no REF</span></div>
          {twinN === 0 || !group ? (
            <div className="verdict clean"><div className="vt"><IconCheck />No silent copies</div><p>No other indexed circuit has the same netlist bytes as #{id}.</p></div>
          ) : silent && isOriginal ? (
            <div className="verdict orig"><div className="vt">Likely original</div><p data-testid="original">Earliest of {group.members.length} identical copies, {group.basis === 'block' ? 'by block' : 'by ID on the same processor'}.</p></div>
          ) : silent && group.original ? (
            <div className="verdict copy"><div className="vt">Silent copy</div><p data-testid="original">Same bytes as <a href={toHash({ cpu: group.original[0], id: group.original[1], vs: null, view: 'lookup' })}>#{group.original[1]}</a>, {group.basis === 'block' ? 'by block' : 'by ID on the same processor'}. REF reuse is never a copy.</p></div>
          ) : (
            <div className="verdict clean"><div className="vt">Identical citations</div><p>Shared bytes contain REFs, so these are not silent copies.</p></div>
          )}
          <div className="card-b"><span className="foot">Matched on keccak256 of the netlist bytes. REF reuse is never a copy.</span></div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Replay</h2><span className="label">free · in your browser</span></div>
          <div className="card-b">
            {pins && !pins.nState
              ? <ReplayTable subject={{ cpu, id, label: `#${id}`, nIn: pins.nIn, nOut: pins.nOut, nState: pins.nState }} against={against} againstNote={againstNote} auto={!!against} />
              : <p className="foot">{pins?.nState ? 'Has latches, so eval() can’t replay it in this MVP.' : 'Waiting for pins…'}</p>}
          </div>
        </section>

        <section className="card"><div className="card-b" style={{ paddingTop: 16 }}><HonestNote /></div></section>
      </div>
    </div>
  );
}
