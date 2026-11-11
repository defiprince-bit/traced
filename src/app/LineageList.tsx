import { useEffect, useRef } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitClass } from '../lib/classify';
import { CLASS_LABEL, CLASS_MOD } from '../lib/format';
import { circuitName } from '../lib/names';
import { toHash, type AppView } from '../route';
import { Badge } from '../ui/Badge';
import { TraceScene } from '../cubes';
import { lineageLeaves, type LineageMode } from './RadialLineage';

export function LineageList({
  ix, cpu, id, cls, parents, children, group, mode, onMode,
}: {
  ix: LoadedIndex; cpu: string; id: number; cls?: CircuitClass;
  parents: { cpu: string; id: number; uses: number }[];
  children: [string, number, number][];
  group: LoadedIndex['twins'][number] | null;
  mode: LineageMode; onMode: (m: LineageMode) => void;
}) {
  const name = circuitName(cpu, id);
  const listMode: LineageMode = mode === 'uses' ? 'uses' : mode;
  const leaves = lineageLeaves(ix, cpu, id, parents, children, group, listMode === 'uses' ? 'parents' : listMode);
  const MAXM = 12;
  const shown = leaves.slice(0, MAXM);
  const usesTotal = parents.reduce((a, p) => a + p.uses, 0);
  const twinN = group ? Math.max(0, group.members.length - 1) : 0;
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const s = new TraceScene(c, { cubes: [{ x: .5, y: .5, size: .3 }], n: 8, trace: false, tilt: false, auto: .4, ambient: 4 });
    return () => s.destroy();
  }, [id]);
  return (
    <div className="mlist">
      <div className="mhead">
        <canvas ref={cv} aria-hidden="true" />
        <div>
          <b>#{id}</b>
          <span className="on">{name ? `${name} · ` : ''}{ix.cpuName(cpu)}</span>
          {cls && <Badge cls={cls} />}
        </div>
      </div>
      <div className="mcats">
        {([
          ['parents', parents.length, 'REF parents'],
          ['uses', usesTotal, 'REF uses'],
          ['children', children.length, 'REF children'],
          ['twins', twinN, 'Identical twins'],
        ] as [LineageMode, number, string][]).map(([k, n, t]) => (
          <button type="button" key={k} className={`cat${k === mode ? ' on' : ''}${n ? '' : ' zero'}`} onClick={() => onMode(k)}>
            <b>{n}</b><span>{t}</span>
          </button>
        ))}
      </div>
      <div className="mleaves">
        {mode === 'uses' && <div className="gl">{usesTotal} REFs, grouped by parent</div>}
        {shown.map(f => (
          <a key={`${f.cpu}:${f.id}`} className="leaf" href={toHash({ cpu: f.cpu, id: f.id, vs: null, view: 'lookup' as AppView })}
            style={{ ['--c' as string]: `var(--cls-${f.cls ? CLASS_MOD[f.cls] : 'library'})` }}>
            <span className="sq" />
            <b>#{f.id}</b>
            <span>{f.name || (f.cls ? CLASS_LABEL[f.cls] : '')}</span>
            <span className="u">{f.label}</span>
            {mode === 'uses' && f.uses ? <span className="pins">{Array.from({ length: Math.min(12, f.uses) }, (_, i) => <i key={i} />)}</span> : null}
          </a>
        ))}
        {leaves.length > MAXM && <div className="leaf more">+{leaves.length - MAXM} more</div>}
        {!leaves.length && <div className="leaf more" style={{ color: 'var(--fg-3)' }}>Nobody yet</div>}
      </div>
    </div>
  );
}
