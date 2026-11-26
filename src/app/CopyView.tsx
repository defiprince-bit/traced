import { useEffect, useRef } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitModel } from './useCircuit';
import { Badge } from '../ui/Badge';
import { VerdictTag } from '../ui/VerdictTag';
import { HonestNote } from '../ui/HonestNote';
import { FindingsEmpty } from './States';
import { startSphere } from '../cubes';
import { short, num } from '../lib/format';
import { circuitName } from '../lib/names';
import { explorerAddr, explorerTx } from '../lib/xlayer';
import { toHash } from '../route';
import { IconCopy } from '../ui/icons';

/** Other twin to name: `vs` when it is a different member of the group, else the first other member. */
export function namedTwin(
  cpu: string,
  id: number,
  vs: number | null,
  members: readonly (readonly [string, number, ...unknown[]])[],
): [string, number] | undefined {
  const others = members.filter((m) => !(m[0] === cpu && m[1] === id));
  const pick = vs != null
    ? (others.find((m) => m[0] === cpu && m[1] === vs) ?? others.find((m) => m[1] === vs) ?? others[0])
    : others[0];
  return pick ? [pick[0], pick[1]] : undefined;
}

export function copyFinding(opts: {
  id: number;
  silent: boolean;
  isOriginal: boolean;
  originalId: number | null | undefined;
  namedId: number | null | undefined;
}): { tag: 'orig' | 'copy' | 'ok'; headline: string } {
  const { id, silent, isOriginal, originalId, namedId } = opts;
  if (!silent) return { tag: 'ok', headline: `#${id} shares citations` };
  if (isOriginal) {
    return {
      tag: 'orig',
      headline: namedId != null ? `#${id} is the likely original of #${namedId}` : `#${id} is the likely original`,
    };
  }
  return {
    tag: 'copy',
    headline: originalId != null ? `#${id} is byte-for-byte #${originalId}` : `#${id} is a silent copy`,
  };
}

function Filters({ silent, isOriginal, hasGroup, byBlock, cpuName }: { silent: boolean; isOriginal: boolean; hasGroup: boolean; byBlock: boolean; cpuName: string }) {
  const r = (t: string, on = false, n?: number) => (
    <div className={`frow${on ? ' on' : ''}`}><span className="bx" />{t}{n != null ? <span className="n">{n}</span> : null}</div>
  );
  return (
    <aside className="card filters" aria-label="Filters">
      <div className="fin">Filter…<span className="kbd">F</span></div>
      <div className="fgrp"><span className="label" style={{ display: 'block', padding: '6px 8px' }}>Verdict</span>
        {r('Silent copy', silent && hasGroup && !isOriginal, silent && hasGroup ? 1 : 0)}
        {r('Likely original', silent && isOriginal, hasGroup ? 1 : 0)}
        {r('Identical citations', false, 0)}
      </div>
      <div className="fgrp"><span className="label" style={{ display: 'block', padding: '6px 8px' }}>Class</span>
        {r('Toy')}{r('Wrapper', !hasGroup)}{r('Library')}{r('Miner-sized')}{r('Flat', hasGroup)}
      </div>
      <div className="fgrp"><span className="label" style={{ display: 'block', padding: '6px 8px' }}>Original picked by</span>
        {r('Tape-out block', byBlock)}{r('ID on same processor', hasGroup && !byBlock)}
      </div>
      <div className="fgrp"><span className="label" style={{ display: 'block', padding: '6px 8px' }}>Processor</span>{r(cpuName, true)}</div>
      <div className="fgrp mob">{r('Silent copy', silent && hasGroup && !isOriginal)}{r('Likely original', silent && isOriginal)}{r(cpuName, true)}{r('Flat', hasGroup)}</div>
    </aside>
  );
}

export function CopyView({ ix, model, vs = null }: { ix: LoadedIndex; model: CircuitModel; vs?: number | null }) {
  const { cpu, id, group, silent, rec, isOriginal } = model;
  const cpuName = ix.cpuName(cpu);
  const has = !!(group && group.members.length > 1);
  const byBlock = group?.basis === 'block';
  const advanced = false;

  if (id == null) return null;

  if (!has || !group) {
    return (
      <div className="fd">
        <Filters silent={false} isOriginal={false} hasGroup={false} byBlock={false} cpuName={cpuName} />
        <section className="card results">
          <EmptySphere cpuName={cpuName} id={id} refs={model.parents.length} />
        </section>
      </div>
    );
  }

  const orig = group.original;
  const thisRec = rec;
  const hash = group.hash;
  const other = group.members.filter((m) => !(m[0] === cpu && m[1] === id));
  const named = namedTwin(cpu, id, vs, group.members);
  const compared = isOriginal ? named : orig;
  const finding = copyFinding({
    id,
    silent: !!silent,
    isOriginal,
    originalId: orig?.[1],
    namedId: named?.[1],
  });

  // Twin compare: original on the left, this (or the named other) on the right
  const left = orig ?? [cpu, id] as [string, number];
  const right = (cpu === left[0] && id === left[1]) ? (named ?? other[0]) : [cpu, id] as [string, number];
  const leftRec = ix.circuits[`${left[0]}:${left[1]}`];
  const rightRec = ix.circuits[`${right[0]}:${right[1]}`] ?? thisRec;
  const leftIsOrig = !!(orig && orig[0] === left[0] && orig[1] === left[1]);

  const missingBlock = group.members.find((m) => !ix.circuits[`${m[0]}:${m[1]}`]?.x?.block);
  const basisFoot = group.basis === 'block'
    ? 'How we picked the original: earliest tape-out block.'
    : group.basis === 'id-same-cpu'
      ? (missingBlock
        ? `How we picked the original: lowest ID on the same processor, because #${missingBlock[1]}'s tape-out block isn’t indexed yet.`
        : 'How we picked the original: lowest ID on the same processor.')
      : 'How we picked the original: tape-out blocks are not resolved for every processor.';

  const card = (c: string, i: number, recC: typeof leftRec, origSide: boolean) => {
    const name = circuitName(c, i);
    return (
      <div className={`tw ${origSide ? 'orig' : 'copy'}`}>
        <div className="id"><b>#{i}</b>{origSide ? <VerdictTag kind="orig" /> : <VerdictTag kind="copy">Copy</VerdictTag>}</div>
        <span className="foot">{name || (c === cpu && i === id ? 'this lookup' : '')}{recC ? <> · <Badge cls={recC.k} /></> : null}</span>
        <dl className="kv">
          <dt>Owner</dt><dd title={recC?.o ?? ''}>{recC?.o ? <a href={explorerAddr(recC.o)} target="_blank" rel="noreferrer">{short(recC.o)}</a> : '—'}</dd>
          <dt>Tape-out</dt>{recC?.x?.tx ? <dd><a href={explorerTx(recC.x.tx)} target="_blank" rel="noreferrer">{short(recC.x.tx, 10)} ↗</a></dd> : <dd className="none">Not indexed yet</dd>}
          <dt>Block</dt>{recC?.x?.block ? <dd>{num(recC.x.block)}</dd> : <dd className="none">Unknown</dd>}
        </dl>
      </div>
    );
  };

  return (
    <div className="fd">
      <Filters silent={!!silent} isOriginal={isOriginal} hasGroup={true} byBlock={byBlock} cpuName={cpuName} />
      <div className="results">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="label">{num(group.members.length - 1)} other{group.members.length - 1 === 1 ? "" : "s"} · {cpuName}</span>
        </div>
        <section className="card finding" aria-label="Finding" data-testid="twins">
          <div className="card-h">
            <VerdictTag kind={finding.tag} />
            <h2>{finding.headline}</h2>
            <span className="label">twin group · {group.members.length}</span>
          </div>
          {silent ? (
            <div className={`verdict ${isOriginal ? 'orig' : 'copy'}`}>
              <div className="vt"><IconCopy />Same netlist, no REF back</div>
              <p data-testid="original">#{id}’s bytes match {compared ? <a href={toHash({ cpu: compared[0], id: compared[1], vs: null, view: 'lookup' })}>#{compared[1]}</a> : 'another circuit'} exactly. Reusing it with credit would have changed the bytes.{isOriginal ? ' This one is the likely original.' : ''}</p>
            </div>
          ) : (
            <div className="verdict clean">
              <div className="vt">Identical citations, not a silent copy</div>
              <p>The shared bytes contain REFs, so every member cites the same parents.</p>
            </div>
          )}
          {right && (
            <div className="twin2">
              {card(left[0], left[1], leftRec, leftIsOrig)}
              <div className="eq"><b>=</b><span>same<br />bytes</span></div>
              {card(right[0], right[1], rightRec, !!(orig && orig[0] === right[0] && orig[1] === right[1]))}
            </div>
          )}
          <div className="hashline">
            <span className="label">Netlist hash, both</span>
            <b title={hash}>{short(hash, 10)}</b>
            <span>{group.nand} NAND · {group.latch} LATCH · {group.ref} REF</span>
            <span>{num(group.members.length)} indexed circuits on {new Set(group.members.map(m => m[0])).size} processors</span>
          </div>
          <div className="f-actions">
            <a className="btn btn-lume btn-sm" href={toHash({ cpu, id, vs: orig && orig[1] !== id ? orig[1] : other[0]?.[1] ?? null, view: 'replay' })}>Replay both</a>
            <a className="btn btn-sm" href={toHash({ cpu, id, vs: null, view: 'lineage' })}>Open lineage</a>
            <span className="foot" style={{ marginLeft: 'auto', maxWidth: 360 }}>{basisFoot} Matched on keccak256 of the netlist bytes. REF reuse is never a copy.</span>
          </div>
        </section>
        <HonestNote />
        {advanced && <p className="foot">Advanced filters are a visual grouping only in this version; every indexed twin is already shown.</p>}
      </div>
    </div>
  );
}

function EmptySphere({ cpuName, id, refs }: { cpuName: string; id: number; refs: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    return startSphere(c);
  }, [id]);
  const reason = refs
    ? `No other indexed circuit shares #${id}’s netlist bytes. Its REFs are reuse with credit, not copies.`
    : `No other indexed circuit shares #${id}’s netlist bytes.`;
  return (
    <div className="empty">
      <canvas id="sphere" ref={cv} aria-hidden="true" />
      <FindingsEmpty cpuName={cpuName} id={id} reason={reason} />
    </div>
  );
}
