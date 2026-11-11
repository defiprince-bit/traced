import { useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitClass } from '../lib/classify';
import { CLASS_LABEL, CLASS_MOD, keyOf } from '../lib/format';
import { circuitName } from '../lib/names';
import {
  accessFromIndex, buildFamilyTree, expandKeyOf, treeNodeCount,
  FANOUT_LIMIT, FANOUT_LIMIT_SMALL, type FamilyNode, type FamilyTree as Tree,
} from '../lib/lineage';
import { toHash, type AppView } from '../route';
import { TraceScene } from '../cubes';

export function FamilyTree({
  ix, cpu, id, name, small, selected, view = 'lookup',
  upDepth, downDepth, onExpandCpu,
}: {
  ix: LoadedIndex;
  cpu: string; id: number;
  cls?: CircuitClass; name?: string;
  small?: boolean;
  selected?: { cpu: string; id: number };
  view?: AppView;
  upDepth: number;
  downDepth: number;
  onExpandCpu?: (addr: string) => void;
}) {
  const wrap = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  useEffect(() => { setExpanded(new Set()); }, [cpu, id]);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  const orbCv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = orbCv.current; if (!cv) return;
    const s = new TraceScene(cv, { cubes: [{ x: .5, y: .5, size: .3, state: 'lume' }], n: 9, trace: false, tilt: false, auto: .4, ambient: 6 });
    return () => s.destroy();
  }, [id, size.w]);

  const fanLimit = small || (typeof window !== 'undefined' && window.innerWidth < 1100) ? FANOUT_LIMIT_SMALL : FANOUT_LIMIT;
  const access = useMemo(() => accessFromIndex(ix.circuits, ix.externalChildren), [ix.circuits, ix.externalChildren]);
  const tree = useMemo(
    () => buildFamilyTree(access, cpu, id, { upDepth, downDepth, fanLimit, expanded }),
    [access, cpu, id, upDepth, downDepth, fanLimit, expanded],
  );
  const counts = treeNodeCount(tree);

  useEffect(() => {
    if (!onExpandCpu) return;
    const addrs = new Set<string>([cpu.toLowerCase()]);
    for (const l of [...tree.up, ...tree.down]) for (const n of l.nodes) if (!n.more) addrs.add(n.cpu.toLowerCase());
    for (const a of addrs) onExpandCpu(a);
  }, [tree, cpu, onExpandCpu]);

  const W = size.w, H = size.h;
  const layout = W ? layoutTree(tree, W, H, !!small) : null;

  const toggleExpand = (n: FamilyNode, dir: 'up' | 'down') => {
    // Placeholder nodes store the source circuit in cpu/id.
    const k = expandKeyOf(n.cpu, n.id, dir);
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  if (!W) return <section ref={wrap} className={`card radial family${small ? ' small' : ''}`} aria-label={`Family tree of #${id}`} data-testid="family-tree" />;

  const STATIC = typeof document !== 'undefined' && (document.documentElement.classList.contains('static') || matchMedia('(prefers-reduced-motion: reduce)').matches);

  return (
    <section ref={wrap} className={`card radial family${small ? ' small' : ''}`} aria-label={`Family tree of #${id}`} data-testid="family-tree">
      <svg className="wires" viewBox={`0 0 ${W} ${H}`}>
        {layout && layout.wires.map((w, i) => (
          <path key={i} className={w.dim ? 'dim' : 'hot'} d={`M${w.x1} ${w.y1} C${w.cx1} ${w.y1},${w.cx2} ${w.y2},${w.x2} ${w.y2}`} />
        ))}
      </svg>
      {layout && (
        <div className="orb" style={{ left: layout.ox - layout.orbR, top: layout.oy - layout.orbR, width: layout.orbR * 2, height: layout.orbR * 2 }}>
          <canvas ref={orbCv} />
          <b>#{id}</b>
          <span className="on">{name ? `${name} · ` : ''}{ix.cpuName(cpu)}</span>
        </div>
      )}
      {layout && layout.placed.map(p => {
        if (p.node.more) {
          return (
            <button
              type="button"
              key={`more:${p.node.via}:${p.dir}:${p.node.more}`}
              className="leaf more"
              data-testid="family-more"
              style={{ width: layout.leafW, left: p.x, top: p.y - layout.leafH / 2, animationDelay: STATIC ? '0ms' : `${180 + p.i * 30}ms` }}
              onClick={() => toggleExpand(p.node, p.dir)}
            >
              +{p.node.more} more
            </button>
          );
        }
        const rec = ix.circuits[keyOf(p.node.cpu, p.node.id)];
        const nodeCls = rec?.k;
        const nodeName = circuitName(p.node.cpu, p.node.id);
        const selN = selected && selected.cpu === p.node.cpu && selected.id === p.node.id;
        const label = nodeName || (nodeCls ? CLASS_LABEL[nodeCls] : (p.node.cpu.toLowerCase() !== cpu.toLowerCase() ? ix.cpuName(p.node.cpu) : ''));
        return (
          <a
            key={`${p.dir}:${p.node.cpu}:${p.node.id}`}
            className={`leaf${selN ? ' sel' : ''}${p.dir === 'up' ? ' anc' : ' desc'}`}
            data-testid="family-node"
            data-id={p.node.id}
            href={toHash({ cpu: p.node.cpu, id: p.node.id, vs: null, view })}
            style={{
              width: layout.leafW, left: p.x, top: p.y - layout.leafH / 2,
              ['--c' as string]: `var(--cls-${nodeCls ? CLASS_MOD[nodeCls] : 'library'})`,
              animationDelay: STATIC ? '0ms' : `${180 + p.i * 30}ms`,
            }}
          >
            <span className="sq" />
            <b>#{p.node.id}</b>
            <span>{label}</span>
            {p.node.uses > 1 && <span className="u">×{p.node.uses}</span>}
          </a>
        );
      })}
      <div className="rlegend">
        <span><i />REF</span>
        <span className="foot" data-testid="family-counts">
          {counts.up} ancestor{counts.up === 1 ? '' : 's'} · {counts.down} descendant{counts.down === 1 ? '' : 's'}
          {upDepth !== 3 || downDepth !== 3 ? ` · depth ↑${upDepth} ↓${downDepth}` : ''}
        </span>
      </div>
    </section>
  );
}

interface Placed {
  node: FamilyNode;
  dir: 'up' | 'down';
  x: number; y: number;
  cx: number; cy: number; // connection point (inner edge toward the orb)
  i: number;
}

function layoutTree(tree: Tree, W: number, H: number, small: boolean) {
  const orbR = small ? 70 : 88;
  const leafW = small ? 168 : 176;
  const leafH = 40;
  const gap = small ? 22 : 28;
  const pad = small ? 12 : 20;
  const upN = tree.up.length;
  const downN = tree.down.length;
  const colW = leafW + gap;

  // Shift the orb toward the empty side so the populated side has more room.
  const leftNeed = upN * colW + orbR + pad;
  const rightNeed = downN * colW + orbR + pad;
  let ox = W / 2;
  if (upN && !downN) ox = Math.min(W - pad - orbR - 8, Math.max(leftNeed, W * 0.62));
  else if (downN && !upN) ox = Math.max(pad + orbR + 8, Math.min(W - rightNeed, W * 0.38));
  else ox = Math.min(Math.max(leftNeed, W / 2), W - Math.max(rightNeed, orbR + pad));
  const oy = H / 2;

  const placed: Placed[] = [];
  const at = new Map<string, Placed>();
  let i = 0;

  const placeCol = (nodes: FamilyNode[], x: number, dir: 'up' | 'down') => {
    const n = nodes.length;
    const span = Math.min(H - 120, Math.max(n * 48, n > 1 ? 80 : 0));
    const y0 = oy - span / 2;
    const toward = dir === 'up' ? x + leafW : x; // inner edge
    nodes.forEach((node, k) => {
      const y = n === 1 ? oy : y0 + k * (span / Math.max(1, n - 1));
      const p: Placed = { node, dir, x, y, cx: toward, cy: y, i: i++ };
      placed.push(p);
      if (!node.more) at.set(`${dir}:${keyOf(node.cpu, node.id)}`, p);
    });
  };

  for (let d = 0; d < upN; d++) {
    // level 1 closest to orb
    const x = ox - orbR - gap - leafW - d * colW;
    placeCol(tree.up[d].nodes, Math.max(pad, x), 'up');
  }
  for (let d = 0; d < downN; d++) {
    const x = ox + orbR + gap + d * colW;
    placeCol(tree.down[d].nodes, Math.min(W - pad - leafW, x), 'down');
  }

  const rootPt = { x: ox, y: oy };
  const wires: { x1: number; y1: number; x2: number; y2: number; cx1: number; cx2: number; dim: boolean }[] = [];
  const mid = (a: number, b: number, t: number) => a + (b - a) * t;

  // Wires from root to depth-1, then between consecutive levels following edges.
  const link = (x1: number, y1: number, x2: number, y2: number, dim = false) => {
    wires.push({ x1, y1, x2, y2, cx1: mid(x1, x2, 0.55), cx2: mid(x1, x2, 0.45), dim });
  };

  const rootKey = keyOf(tree.root.cpu, tree.root.id);
  if (tree.up[0]) {
    for (const n of tree.up[0].nodes) {
      if (n.more) {
        const p = placed.find(x => x.node === n);
        if (p) link(p.cx, p.cy, ox - orbR, oy, true);
        continue;
      }
      const p = at.get(`up:${keyOf(n.cpu, n.id)}`);
      if (p) link(p.cx, p.cy, ox - orbR, oy);
    }
  }
  if (tree.down[0]) {
    for (const n of tree.down[0].nodes) {
      if (n.more) {
        const p = placed.find(x => x.node === n);
        if (p) link(ox + orbR, oy, p.cx, p.cy, true);
        continue;
      }
      const p = at.get(`down:${keyOf(n.cpu, n.id)}`);
      if (p) link(ox + orbR, oy, p.cx, p.cy);
    }
  }
  // Deeper edges
  for (const e of tree.edges) {
    // ancestor side: parent is further (higher up index), child is closer to root
    const pUp = at.get(`up:${e.parent}`);
    const cUp = e.child === rootKey ? null : at.get(`up:${e.child}`);
    if (pUp && cUp) link(pUp.cx, pUp.cy, cUp.cx, cUp.cy);
    const pDown = at.get(`down:${e.parent}`);
    const cDown = at.get(`down:${e.child}`);
    if (pDown && cDown) link(pDown.cx, pDown.cy, cDown.cx, cDown.cy);
  }
  void rootPt;
  return { ox, oy, orbR, leafW, leafH, placed, wires };
}
