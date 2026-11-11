import { useEffect, useRef, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import type { CircuitClass } from '../lib/classify';
import { CLASS_LABEL, CLASS_MOD, keyOf } from '../lib/format';
import { circuitName } from '../lib/names';
import { toHash, type AppView } from '../route';
import { TraceScene } from '../cubes';

export type LineageMode = 'parents' | 'uses' | 'children' | 'twins';

export interface LineageLeaf {
  cpu: string; id: number; label: string; cls?: CircuitClass; name?: string; uses?: number; bare?: boolean;
}

export function lineageLeaves(
  ix: LoadedIndex, cpu: string, id: number,
  parents: { cpu: string; id: number; uses: number }[],
  children: [string, number, number][],
  group: LoadedIndex['twins'][number] | null,
  mode: LineageMode,
): LineageLeaf[] {
  const recOf = (c: string, i: number) => ix.circuits[keyOf(c, i)];
  if (mode === 'children') return children.map(([c, i, u]) => ({ cpu: c, id: i, label: u > 1 ? `×${u} uses` : '', cls: recOf(c, i)?.k, name: circuitName(c, i) }));
  if (mode === 'parents') return parents.map(p => ({ cpu: p.cpu, id: p.id, label: p.uses > 1 ? `×${p.uses} uses` : '', cls: recOf(p.cpu, p.id)?.k, name: circuitName(p.cpu, p.id), uses: p.uses }));
  if (mode === 'twins') {
    if (!group) return [];
    return group.members.filter(([c, i]) => !(c === cpu && i === id)).map(([c, i]) => ({ cpu: c, id: i, label: 'identical', cls: recOf(c, i)?.k, name: circuitName(c, i) }));
  }
  const out: LineageLeaf[] = [];
  for (const p of parents) for (let k = 1; k <= p.uses; k++) {
    out.push({ cpu: p.cpu, id: p.id, label: `use ${k}/${p.uses}`, cls: recOf(p.cpu, p.id)?.k, name: circuitName(p.cpu, p.id), uses: p.uses, bare: true });
  }
  return out;
}

export function RadialLineage({
  ix, cpu, id, cls, name, parents, children, group, mode, onMode, small, selected,
}: {
  ix: LoadedIndex; cpu: string; id: number; cls?: CircuitClass; name?: string;
  parents: { cpu: string; id: number; uses: number }[];
  children: [string, number, number][];
  group: LoadedIndex['twins'][number] | null;
  mode: LineageMode; onMode: (m: LineageMode) => void;
  small?: boolean; selected?: { cpu: string; id: number };
}) {
  const wrap = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
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

  const W = size.w, H = size.h;
  const all = W ? lineageLeaves(ix, cpu, id, parents, children, group, mode) : [];
  const MAXL = small || (typeof window !== "undefined" && window.innerWidth < 1100) ? 8 : 12;
  let L = all, more = 0;
  if (L.length > MAXL) { more = L.length - (MAXL - 1); L = L.slice(0, MAXL - 1); }
  const twinN = group ? group.members.length - 1 : 0;
  const cats: { k: LineageMode; n: number; t: string }[] = [
    { k: 'parents', n: parents.length, t: 'REF parents' },
    { k: 'uses', n: parents.reduce((a, p) => a + p.uses, 0), t: 'REF uses' },
    { k: 'children', n: children.length, t: 'REF children' },
    { k: 'twins', n: Math.max(0, twinN), t: 'Identical twins' },
  ];
  const orbR = small ? 78 : 92, ox = small ? 110 : 128, oy = H / 2 || 200;
  const catX = ox + orbR + 50, catW = 164, catGap = small ? 62 : 70, cy0 = oy - (cats.length - 1) * catGap / 2;
  const leafW = small ? 190 : 176, leafH = 40, bulge = small ? 30 : 44;
  const lx0 = Math.max(catX + catW + 24, W - leafW - bulge - (small ? 20 : 64));
  const n = L.length + (more ? 1 : 0), span = Math.min(H - 140, n * (small ? 44 : 52)), y0 = oy - span / 2;
  const sel = cats.findIndex(c => c.k === mode), sy = cy0 + sel * catGap, sx = catX + catW;
  const STATIC = typeof document !== 'undefined' && (document.documentElement.classList.contains('static') || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const paths: [number, number, number, number][] = [];
  const leafYs: { y: number; x: number }[] = [];
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? oy : y0 + i * (span / (n - 1 || 1));
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const x = lx0 + bulge * (1 - u * u);
    paths.push([sx, sy, x, y]);
    leafYs.push({ y, x });
  }

  const pulseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = pulseRef.current; if (!host || STATIC || !paths.length) return;
    host.innerHTML = '';
    const dots: HTMLElement[] = [];
    paths.slice(0, L.length).forEach((p, i) => {
      const d = document.createElement('i'); d.className = 'pulse-dot'; host.appendChild(d); dots.push(d);
      const [ax, ay, bx, by] = p; const t0 = performance.now() + i * 120;
      const step = (now: number) => {
        if (!d.isConnected) return;
        let t = ((now - t0) / 1400) % 1; if (t < 0) { requestAnimationFrame(step); return; }
        const mt = 1 - t, c1x = ax + (bx - ax) * .55, c2x = ax + (bx - ax) * .45;
        const x = mt * mt * mt * ax + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * bx;
        const y = mt * mt * mt * ay + 3 * mt * mt * t * ay + 3 * mt * t * t * by + t * t * t * by;
        d.style.transform = `translate(${x}px,${y}px)`;
        d.style.opacity = String(t < .1 ? t * 10 : t > .9 ? (1 - t) * 10 : 1);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    return () => { dots.forEach(d => d.remove()); };
  }, [STATIC, paths.map(p => p.join(',')).join('|'), L.length]);

  if (!W) return <section ref={wrap} className={`card radial${small ? ' small' : ''}`} aria-label={`Lineage of #${id}`} />;

  return (
    <section ref={wrap} className={`card radial${small ? ' small' : ''}`} aria-label={`Lineage of #${id}`}>
      <svg className="wires" viewBox={`0 0 ${W} ${H}`}>
        {cats.map((c, i) => {
          const y = cy0 + i * catGap;
          return <path key={c.k} className={c.k === mode ? 'hot' : 'dim'} d={`M${ox + orbR} ${oy} C${ox + orbR + 40} ${oy},${catX - 40} ${y},${catX} ${y}`} />;
        })}
        {leafYs.map((l, i) => {
          const [ax, ay, bx, by] = paths[i];
          return <path key={i} className={i < L.length ? '' : 'dim'} d={`M${ax} ${ay} C${ax + (bx - ax) * .55} ${ay},${ax + (bx - ax) * .45} ${by},${bx} ${by}`} />;
        })}
        {mode === 'uses' && !small && (() => {
          const els: React.ReactNode[] = [];
          let i = 0;
          parents.forEach(p => {
            const a = i, b = Math.min(i + p.uses - 1, L.length - 1);
            if (a < L.length && n > 1) {
              const ya = y0 + a * (span / (n - 1)), yb = y0 + b * (span / (n - 1));
              const xr = lx0 + bulge + leafW + 6;
              els.push(<path key={`g${p.id}`} className="hot" d={`M${xr} ${ya - 12} H${xr + 6} V${yb + 12} H${xr}`} style={{ strokeWidth: 1 }} />);
            }
            i += p.uses;
          });
          return els;
        })()}
      </svg>
      <div className="orb" style={{ left: ox - orbR, top: oy - orbR, width: orbR * 2, height: orbR * 2 }}>
        <canvas ref={orbCv} />
        <b>#{id}</b>
        <span className="on">{name ? `${name} · ` : ''}{ix.cpuName(cpu)}</span>
      </div>
      {cats.map((c, i) => {
        const y = cy0 + i * catGap;
        return (
          <button type="button" key={c.k} className={`cat${c.k === mode ? ' on' : ''}${c.n ? '' : ' zero'}`} style={{ left: catX, top: y - 28 }} onClick={() => onMode(c.k)}>
            <b>{c.n}</b><span>{c.t}</span>
          </button>
        );
      })}
      {L.map((f, i) => {
        const { x, y } = leafYs[i];
        const selN = selected && selected.cpu === f.cpu && selected.id === f.id;
        return (
          <a key={`${f.cpu}:${f.id}:${i}`} className={`leaf${selN ? ' sel' : ''}`} href={toHash({ cpu: f.cpu, id: f.id, vs: null, view: 'lookup' as AppView })}
            style={{ width: leafW, left: x, top: y - leafH / 2, ['--c' as string]: `var(--cls-${f.cls ? CLASS_MOD[f.cls] : 'library'})`, animationDelay: `${200 + i * 35}ms` }}>
            <span className="sq" /><b>#{f.id}</b><span>{f.bare ? (f.name || '') : (f.name || (f.cls ? CLASS_LABEL[f.cls] : ''))}</span><span className="u">{f.label}</span>
          </a>
        );
      })}
      {more > 0 && leafYs[L.length] && (
        <div className="leaf more" style={{ left: leafYs[L.length].x, top: leafYs[L.length].y - leafH / 2 }}>+{more} more</div>
      )}
      {!n && <div className="grp-label" style={{ left: sx + 40, top: sy - 6 }}>Nothing here yet</div>}
      {mode === 'uses' && !small && (() => {
        const els: React.ReactNode[] = [];
        let i = 0;
        parents.forEach(p => {
          const a = i, b = Math.min(i + p.uses - 1, L.length - 1);
          if (a < L.length && n > 1) {
            const ya = y0 + a * (span / (n - 1)), yb = y0 + b * (span / (n - 1));
            const xr = lx0 + bulge + leafW + 6;
            els.push(<div key={`gl${p.id}`} className="grp-label" style={{ left: xr + 12, top: (ya + yb) / 2 - 5 }}><b>#{p.id}</b> ×{p.uses}</div>);
          }
          i += p.uses;
        });
        return els;
      })()}
      <div className="rlegend"><span><i />REF</span></div>
      <div ref={pulseRef} />
    </section>
  );
}
