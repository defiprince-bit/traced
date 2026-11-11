import { useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitClass } from '../lib/classify';
import { CLASS_LABEL, CLASS_MOD, keyOf } from '../lib/format';
import { circuitName } from '../lib/names';
import { toHash, type AppView } from '../route';
import { Badge } from '../ui/Badge';
import { TraceScene } from '../cubes';
import {
  accessFromIndex, buildFamilyTree, expandKeyOf,
  FANOUT_LIMIT, type FamilyNode,
} from '../lib/lineage';

export function LineageList({
  ix, cpu, id, cls, group, upDepth, downDepth, view = 'lookup', onExpandCpu,
}: {
  ix: LoadedIndex; cpu: string; id: number; cls?: CircuitClass;
  group: LoadedIndex['twins'][number] | null;
  upDepth: number; downDepth: number;
  view?: AppView;
  onExpandCpu?: (addr: string) => void;
}) {
  const name = circuitName(cpu, id);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState({ up: true, down: true, twins: true });
  useEffect(() => { setExpanded(new Set()); }, [cpu, id]);
  const access = useMemo(() => accessFromIndex(ix.circuits, ix.externalChildren), [ix.circuits, ix.externalChildren]);
  const tree = useMemo(
    () => buildFamilyTree(access, cpu, id, { upDepth, downDepth, fanLimit: FANOUT_LIMIT, expanded }),
    [access, cpu, id, upDepth, downDepth, expanded],
  );
  useEffect(() => {
    if (!onExpandCpu) return;
    const addrs = new Set<string>([cpu.toLowerCase()]);
    for (const l of [...tree.up, ...tree.down]) for (const n of l.nodes) if (!n.more) addrs.add(n.cpu.toLowerCase());
    for (const a of addrs) onExpandCpu(a);
  }, [tree, cpu, onExpandCpu]);

  const twinN = group ? Math.max(0, group.members.length - 1) : 0;
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const s = new TraceScene(c, { cubes: [{ x: .5, y: .5, size: .3 }], n: 8, trace: false, tilt: false, auto: .4, ambient: 4 });
    return () => s.destroy();
  }, [id]);

  const toggle = (n: FamilyNode, dir: 'up' | 'down') => {
    const k = expandKeyOf(n.cpu, n.id, dir);
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  return (
    <div className="mlist family-list" data-testid="family-list">
      <div className="mhead">
        <canvas ref={cv} aria-hidden="true" />
        <div>
          <b>#{id}</b>
          <span className="on">{name ? `${name} · ` : ''}{ix.cpuName(cpu)}</span>
          {cls && <Badge cls={cls} />}
        </div>
      </div>
      <Section title="Ancestors" n={tree.up.reduce((a, l) => a + l.nodes.filter(x => !x.more).length, 0)} open={open.up} onToggle={() => setOpen(o => ({ ...o, up: !o.up }))}>
        {open.up && <LevelList ix={ix} cpu={cpu} levels={tree.up} dir="up" view={view} onMore={n => toggle(n, 'up')} />}
        {open.up && !tree.up.length && <div className="leaf more" style={{ color: 'var(--fg-3)' }}>No indexed parents</div>}
      </Section>
      <Section title="Descendants" n={tree.down.reduce((a, l) => a + l.nodes.filter(x => !x.more).length, 0)} open={open.down} onToggle={() => setOpen(o => ({ ...o, down: !o.down }))}>
        {open.down && <LevelList ix={ix} cpu={cpu} levels={tree.down} dir="down" view={view} onMore={n => toggle(n, 'down')} />}
        {open.down && !tree.down.length && <div className="leaf more" style={{ color: 'var(--fg-3)' }}>No indexed circuit cites this one</div>}
      </Section>
      <Section title="Identical twins" n={twinN} open={open.twins} onToggle={() => setOpen(o => ({ ...o, twins: !o.twins }))}>
        {open.twins && group && group.members.filter(([c, i]) => !(c === cpu && i === id)).slice(0, 24).map(([c, i]) => {
          const rec = ix.circuits[keyOf(c, i)];
          return (
            <a key={`${c}:${i}`} className="leaf" href={toHash({ cpu: c, id: i, vs: null, view })}
              style={{ ['--c' as string]: `var(--cls-${rec?.k ? CLASS_MOD[rec.k] : 'library'})` }}>
              <span className="sq" />
              <b>#{i}</b>
              <span>{circuitName(c, i) || (rec?.k ? CLASS_LABEL[rec.k] : (c !== cpu ? ix.cpuName(c) : 'identical'))}</span>
              <span className="u">identical</span>
            </a>
          );
        })}
        {open.twins && twinN > 24 && <div className="leaf more">+{twinN - 24} more</div>}
        {open.twins && !twinN && <div className="leaf more" style={{ color: 'var(--fg-3)' }}>No silent copies in the index</div>}
      </Section>
    </div>
  );
}

function Section({ title, n, open, onToggle, children }: { title: string; n: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="lsec">
      <button type="button" className="lsec-h" onClick={onToggle} aria-expanded={open}>
        <span className="chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span>{title}</span>
        <span className="n">{n}</span>
      </button>
      {open && <div className="mleaves">{children}</div>}
    </div>
  );
}

function LevelList({ ix, cpu, levels, dir, view, onMore }: {
  ix: LoadedIndex; cpu: string;
  levels: { nodes: FamilyNode[] }[];
  dir: 'up' | 'down'; view: AppView;
  onMore: (n: FamilyNode) => void;
}) {
  // Render as an indented tree following first-seen order at each depth,
  // grouping each level's nodes under a depth label when there is more than one level.
  return (
    <>
      {levels.map((level, d) => (
        <div key={`${dir}:${d}`} className="ldepth" style={{ marginLeft: d * 16 }}>
          {levels.length > 1 && <div className="gl">{dir === 'up' ? '↑' : '↓'}{d + 1}</div>}
          {level.nodes.map(n => {
            if (n.more) {
              return (
                <button type="button" key={`more:${n.via}:${n.more}`} className="leaf more" onClick={() => onMore(n)}>
                  +{n.more} more
                </button>
              );
            }
            const rec = ix.circuits[keyOf(n.cpu, n.id)];
            const nodeName = circuitName(n.cpu, n.id);
            const label = nodeName || (rec?.k ? CLASS_LABEL[rec.k] : (n.cpu.toLowerCase() !== cpu.toLowerCase() ? ix.cpuName(n.cpu) : ''));
            return (
              <a key={`${n.cpu}:${n.id}`} className="leaf" data-testid="family-node" data-id={n.id}
                href={toHash({ cpu: n.cpu, id: n.id, vs: null, view })}
                style={{ ['--c' as string]: `var(--cls-${rec?.k ? CLASS_MOD[rec.k] : 'library'})` }}>
                <span className="sq" />
                <b>#{n.id}</b>
                <span>{label}</span>
                {n.uses > 1 && <span className="u">×{n.uses}</span>}
              </a>
            );
          })}
        </div>
      ))}
    </>
  );
}
