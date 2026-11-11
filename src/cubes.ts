/* TraceScene: voxel dot-cubes + dust on right-angle PCB traces (Canvas2D, no deps).
   Decorative. Honors prefers-reduced-motion (one static frame). */
export type CubeState = 'lume' | 'orig' | 'copy' | 'dim';

export interface CubeOpt {
  x: number; y: number; size: number;
  state?: CubeState; dissolve?: number;
  yaw?: number; pitch?: number; scale?: number; dy?: number;
  rgb?: [number, number, number];
}

export interface Flow { from: number; to: number; rate: number }

export interface TraceOpt {
  n?: number; maxDust?: number; ambient?: number; auto?: number;
  tilt?: boolean; trace?: boolean; lanes?: number; float?: number;
  pedestal?: boolean; hoverFlow?: boolean; static?: boolean;
  host?: HTMLElement;
  cubes?: CubeOpt[];
  flow?: Partial<Flow>;
  onHover?: (i: number, scene: TraceScene) => void;
  onFrame?: (scene: TraceScene) => void;
}

type Pt = { p: number[]; f: number; s: number; b: number };
export type Proj = [number, number, number, Pt, number[]];

export interface Cube {
  x: number; y: number; size: number;
  state: CubeState; dissolve: number;
  yaw: number; pitch: number; scale: number; dy: number;
  rgb?: [number, number, number];
  hl: number; glow: number;
  pts: Pt[]; proj: Proj[];
  sx: number; sy: number; Sp: number;
  vis: boolean[];
  rot?: (p: number[]) => number[];
}

const COL: Record<string, [number, number, number]> = {
  lume: [200, 255, 106], orig: [255, 194, 102], copy: [255, 107, 139],
  dim: [120, 132, 110], trace: [62, 82, 34],
};

function rng(seed: number) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}
const NORM = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

function reducedMotion() {
  return typeof matchMedia === 'function' && (matchMedia('(prefers-reduced-motion: reduce)').matches
    || (typeof document !== 'undefined' && document.documentElement.classList.contains('static')));
}
function isSmall() {
  return typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches;
}

function makeCube(n: number, seed: number, dissolve: number) {
  const r = rng(seed), pts: Pt[] = [];
  for (let f = 0; f < 6; f++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = (i + .5) / n * 2 - 1, v = (j + .5) / n * 2 - 1;
    const p = f < 2 ? [f ? -1 : 1, u, v] : f < 4 ? [u, f === 2 ? 1 : -1, v] : [u, v, f === 4 ? 1 : -1];
    const d = (p[0] + p[1] - p[2] + 3) / 6;
    if (r() < Math.pow(d, 3) * dissolve) continue;
    pts.push({ p, f, s: .55 + r() * .55, b: .75 + r() * .25 });
  }
  return pts;
}

type Dust = { from: number; to: number; lane: number; t: number; v: number; sz: number; ox: number; oy: number; tx: number; ty: number; st: CubeState };
type Amb = { i: number; x: number; y: number; vx: number; vy: number; life: number; sz: number };

export class TraceScene {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  o: Required<Pick<TraceOpt, 'n' | 'maxDust' | 'ambient' | 'auto' | 'tilt' | 'trace' | 'lanes' | 'float' | 'pedestal' | 'hoverFlow' | 'static'>> & TraceOpt;
  cubes: Cube[];
  flow: Flow;
  dust: Dust[] = [];
  amb: Amb[] = [];
  mx = 0; my = 0; tx = 0; ty = 0;
  hover = -1; touchUntil = 0; t = 0; visible = true;
  w = 0; h = 0;
  rand = rng(99);
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private raf = 0;
  private host?: HTMLElement;
  private onPointerMove?: (e: PointerEvent) => void;
  private onPointerLeave?: () => void;
  private onPointerDown?: (e: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement, opt: TraceOpt = {}) {
    const small = isSmall();
    const RM = opt.static ?? reducedMotion();
    this.c = canvas;
    this.g = canvas.getContext('2d')!;
    this.o = {
      n: opt.n ?? (small ? 11 : 17),
      maxDust: opt.maxDust ?? (small ? 220 : 700),
      ambient: opt.ambient ?? (small ? 20 : 46),
      auto: opt.auto ?? .12,
      tilt: opt.tilt ?? true,
      trace: opt.trace ?? true,
      lanes: opt.lanes ?? 5,
      float: opt.float ?? 0,
      pedestal: opt.pedestal ?? false,
      hoverFlow: opt.hoverFlow ?? true,
      static: RM,
      ...opt,
    };
    this.cubes = (opt.cubes || []).map((cb, i) => ({
      x: cb.x, y: cb.y, size: cb.size,
      state: cb.state ?? 'lume',
      dissolve: cb.dissolve ?? (i ? 1.1 : .7),
      yaw: cb.yaw ?? (.65 + i * .5),
      pitch: cb.pitch ?? -.5,
      scale: cb.scale ?? 1,
      dy: cb.dy ?? 0,
      rgb: cb.rgb,
      hl: 0, glow: 0, sx: 0, sy: 0, Sp: 0, vis: [],
      pts: makeCube(this.o.n, 11 + i * 29, cb.dissolve ?? (i ? 1.1 : .7)),
      proj: [],
    }));
    this.flow = { from: 0, to: 1, rate: 1, ...(opt.flow || {}) };
    this.resize();
    this.ro = new ResizeObserver(() => { this.resize(); if (this.o.static) this.frame(0); });
    this.ro.observe(canvas);
    if (this.o.tilt) {
      this.host = opt.host || canvas;
      this.onPointerMove = e => this.point(e);
      this.onPointerLeave = () => { this.tx = 0; this.ty = 0; if (performance.now() > this.touchUntil) this.setHover(-1); };
      this.onPointerDown = e => { this.point(e); if (this.hover >= 0) this.touchUntil = performance.now() + 2600; };
      this.host.addEventListener('pointermove', this.onPointerMove);
      this.host.addEventListener('pointerleave', this.onPointerLeave);
      this.host.addEventListener('pointerdown', this.onPointerDown);
    }
    this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }, { rootMargin: '100px' });
    this.io.observe(canvas);
    if (this.o.static) { this.seedStatic(); this.frame(0); }
    else {
      this.project();
      if (this.cubes.length > 1) for (let i = 0; i < this.o.maxDust * .35; i++) this.spawn(this.rand() * .95);
      let last = performance.now();
      const loop = (now: number) => {
        const dt = Math.min(50, now - last); last = now;
        if (this.visible) this.frame(dt);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.io?.disconnect();
    if (this.host && this.onPointerMove) {
      this.host.removeEventListener('pointermove', this.onPointerMove);
      this.host.removeEventListener('pointerleave', this.onPointerLeave!);
      this.host.removeEventListener('pointerdown', this.onPointerDown!);
    }
  }

  resize() {
    const r = this.c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    this.c.width = Math.max(1, r.width * d);
    this.c.height = Math.max(1, r.height * d);
    this.g.setTransform(d, 0, 0, d, 0, 0);
  }

  point(e: PointerEvent) {
    const r = this.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    this.tx = x / r.width - .5; this.ty = y / r.height - .5;
    let h = -1;
    this.cubes.forEach((cb, i) => { const S = this.S(cb); if (Math.hypot(x - cb.sx, y - cb.sy) < S * 1.35) h = i; });
    if (h !== this.hover && (h >= 0 || performance.now() > this.touchUntil)) this.setHover(h);
  }

  setHover(i: number) {
    this.hover = i;
    if (this.o.onHover) this.o.onHover(i, this);
    else if (this.o.hoverFlow && i >= 0 && this.cubes.length > 1) { this.flow.from = i; this.flow.to = 1 - i; }
  }

  S(cb: Cube) { return cb.size * Math.min(this.w, this.h); }

  setFlow(from: number, to: number, rate?: number) {
    this.flow.from = from; this.flow.to = to;
    if (rate != null) this.flow.rate = rate;
  }

  route(a: number, b: number, lane: number) {
    const A = this.cubes[a], B = this.cubes[b], SA = this.S(A), SB = this.S(B), o = (lane - (this.o.lanes - 1) / 2) * 7;
    const dx = B.sx - A.sx, dy = B.sy - A.sy;
    if (Math.abs(dx) >= Math.abs(dy) * .8) {
      const sx = A.sx + Math.sign(dx) * SA * 1.05, ex = B.sx - Math.sign(dx) * SB * 1.05, mx = (sx + ex) / 2 + o * Math.sign(dx) * Math.sign(dy || 1);
      return [[sx, A.sy + o], [mx, A.sy + o], [mx, B.sy + o], [ex, B.sy + o]];
    }
    const sy = A.sy + Math.sign(dy) * SA * 1.05, ey = B.sy - Math.sign(dy) * SB * 1.05, my = (sy + ey) / 2 + o;
    return [[A.sx + o, sy], [A.sx + o, my], [B.sx + o, my], [B.sx + o, ey]];
  }

  along(pts: number[][], t: number) {
    let L = 0; const seg: number[] = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let d = t * L;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? Math.min(1, d / seg[i]) : 0;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  }

  spawn(t0?: number) {
    const f = this.flow, A = this.cubes[f.from];
    if (!A || !A.proj.length || !this.cubes[f.to]) return;
    const r = this.rand;
    const q = A.proj[(r() * A.proj.length) | 0];
    this.dust.push({ from: f.from, to: f.to, lane: (r() * this.o.lanes) | 0, t: t0 ?? 0, v: .00022 + r() * .00022, sz: 1.6 + r() * 1.8, ox: q[0] - A.sx, oy: q[1] - A.sy, tx: (r() - .5), ty: (r() - .5), st: A.state });
  }

  seedStatic() { this.project(); for (let i = 0; i < (isSmall() ? 60 : 140); i++) this.spawn(this.rand()); }

  project() {
    const t = this.t;
    this.cubes.forEach((cb, i) => {
      cb.sx = cb.x * this.w;
      cb.sy = cb.y * this.h + (this.o.float ? Math.sin(t * .0012 + i) * this.o.float : 0) + (cb.dy || 0);
      const yaw = cb.yaw + (this.o.static ? 0 : t * .001 * this.o.auto * (i ? -1 : 1)) + this.mx * .9;
      const pit = cb.pitch + this.my * .6;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit), S = this.S(cb) * (cb.scale || 1);
      const rot = (p: number[]) => { const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy; return [x, p[1] * cp - z * sp, p[1] * sp + z * cp]; };
      const nrm = NORM.map(rot); cb.proj = []; cb.vis = nrm.map(n => n[2] < -.04); cb.rot = rot; cb.Sp = S;
      for (const q of cb.pts) {
        if (!cb.vis[q.f]) continue;
        const r = rot(q.p), k = 900 / (900 + r[2] * S);
        cb.proj.push([cb.sx + r[0] * S * k, cb.sy + r[1] * S * k, k, q, nrm[q.f]]);
      }
    });
  }

  frame(dt: number) {
    this.t += dt; const g = this.g, o = this.o;
    this.mx += (this.tx - this.mx) * .06; this.my += (this.ty - this.my) * .06;
    this.project(); g.clearRect(0, 0, this.w, this.h);
    if (o.pedestal) this.cubes.forEach(cb => {
      const S = this.S(cb); g.fillStyle = 'rgba(200,255,106,.22)';
      for (let r = 0; r < 4; r++) for (let a = 0; a < 64; a++) {
        const th = a / 64 * 6.283 + this.t * .0002 * (r % 2 ? 1 : -1), R = S * (1.25 + r * .22);
        g.fillRect(cb.sx + Math.cos(th) * R - 1, cb.sy + S * 1.75 + Math.sin(th) * R * .22 - 1, 2, 2);
      }
    });
    if (o.trace && this.cubes.length > 1) {
      const f = this.flow; g.lineWidth = 1;
      for (let l = 0; l < o.lanes; l++) {
        const pts = this.route(f.from, f.to, l);
        g.strokeStyle = `rgba(${COL.trace},${l === 2 ? .9 : .55})`;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke();
        if (l === 2) {
          g.strokeStyle = 'rgba(200,255,106,.6)';
          for (const p of [pts[1], pts[2]]) { g.beginPath(); g.arc(p[0], p[1], 3.5, 0, 6.283); g.stroke(); }
        }
      }
    }
    const light = [-.35, -.55, -.76];
    this.cubes.forEach((cb, i) => {
      cb.hl += ((this.hover === i ? 1 : 0) - cb.hl) * .1; cb.glow *= .96;
      const c = cb.rgb || COL[cb.state] || COL.lume;
      const S = cb.Sp, n = o.n, base = S * 2 / n * .62;
      for (const [x, y, k, q, nr] of cb.proj) {
        const lum = .28 + .72 * Math.max(0, -(nr[0] * light[0] + nr[1] * light[1] + nr[2] * light[2]));
        const a = Math.min(1, (.35 + lum * .75) * q.b + cb.hl * .15 + cb.glow * .3), s = base * k * q.s * (1 + cb.hl * .12);
        g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`; g.fillRect(x - s / 2, y - s / 2, s, s);
      }
      if (!o.static && cb.proj.length) {
        for (let k = 0; k < 2; k++) if (this.amb.length < o.ambient * this.cubes.length) {
          const q = cb.proj[(this.rand() * cb.proj.length) | 0];
          this.amb.push({ i, x: q[0] - cb.sx, y: q[1] - cb.sy, vx: (this.rand() - .3) * .03, vy: (this.rand() - .7) * .03, life: 1, sz: 1 + this.rand() * 2 });
        }
      }
    });
    if (!o.static) this.amb = this.amb.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .0006;
      const cb = this.cubes[p.i], c = cb.rgb || COL[cb.state] || COL.lume;
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, p.life) * .6})`;
      g.fillRect(cb.sx + p.x, cb.sy + p.y, p.sz, p.sz);
      return p.life > 0;
    });
    if (!o.static && this.cubes.length > 1) {
      const want = this.flow.rate * dt * .09; let k = want;
      while (k > 0 && this.dust.length < o.maxDust) { if (k >= 1 || this.rand() < k) this.spawn(); k -= 1; }
    }
    this.dust = this.dust.filter(p => {
      p.t += p.v * dt * (o.static ? 0 : 1);
      if (p.t >= 1) { const T = this.cubes[p.to]; if (T) T.glow = Math.min(1, T.glow + .04); return false; }
      const A = this.cubes[p.from], B = this.cubes[p.to]; if (!A || !B) return false;
      const pts = this.route(p.from, p.to, p.lane); let x: number, y: number;
      if (p.t < .15) { const e = p.t / .15, s = pts[0]; x = A.sx + p.ox + (s[0] - A.sx - p.ox) * e; y = A.sy + p.oy + (s[1] - A.sy - p.oy) * e; }
      else if (p.t > .85) { const e = (p.t - .85) / .15, s = pts[pts.length - 1]; x = s[0] + (B.sx - s[0]) * e + p.tx * B.Sp * e; y = s[1] + (B.sy - s[1]) * e + p.ty * B.Sp * e; }
      else [x, y] = this.along(pts, (p.t - .15) / .7);
      const c = COL[p.st] || COL.lume, a = p.t > .9 ? (1 - p.t) * 10 : 1;
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * .95})`; g.fillRect(x - p.sz / 2, y - p.sz / 2, p.sz, p.sz);
      return true;
    });
    if (o.onFrame) o.onFrame(this);
  }
}

/** Wireframe rotating sphere for the empty copy-check state. */
export function startSphere(cv: HTMLCanvasElement, opts?: { static?: boolean }): () => void {
  const g = cv.getContext('2d')!, d = Math.min(2, devicePixelRatio || 1);
  const STATIC = opts?.static ?? reducedMotion();
  let raf = 0, stopped = false;
  const resize = () => {
    const r = cv.getBoundingClientRect();
    cv.width = r.width * d; cv.height = r.height * d; g.setTransform(d, 0, 0, d, 0, 0);
    return r;
  };
  const r0 = resize();
  const pts: number[][] = [];
  const lat = 14, lon = 26;
  for (let i = 1; i < lat; i++) for (let j = 0; j < lon; j++) {
    const th = i / lat * Math.PI, ph = j / lon * 2 * Math.PI;
    pts.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph), i, j]);
  }
  void r0;
  const draw = (t: number) => {
    if (stopped) return;
    const r = cv.getBoundingClientRect();
    if (cv.width !== r.width * d) resize();
    const w = r.width, h = r.height, R = w * .38;
    g.clearRect(0, 0, w, h);
    const a = t * .00015, ca = Math.cos(a), sa = Math.sin(a), tl = .35, ct = Math.cos(tl), st = Math.sin(tl);
    const P = pts.map(p => {
      const x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca, y = p[1] * ct - z * st, z2 = p[1] * st + z * ct;
      return [w / 2 + x * R, h / 2 + y * R, z2, p[3], p[4]];
    });
    const idx = (i: number, j: number) => (i - 1) * lon + ((j + lon) % lon);
    for (const p of P) {
      const q = P[idx(p[3], p[4] + 1)], u = p[3] < lat - 1 ? P[idx(p[3] + 1, p[4])] : null;
      const al = p[2] < 0 ? .55 : .14;
      g.strokeStyle = `rgba(200,255,106,${al})`; g.lineWidth = .8;
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]);
      if (u) { g.moveTo(p[0], p[1]); g.lineTo(u[0], u[1]); }
      g.stroke();
      g.fillStyle = `rgba(200,255,106,${p[2] < 0 ? .95 : .25})`;
      g.fillRect(p[0] - 1.2, p[1] - 1.2, 2.4, 2.4);
    }
    if (!STATIC) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  if (STATIC) draw(0);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
