import { useEffect, type RefObject } from 'react';
import { TraceScene, type Cube } from '../cubes';

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export interface LandingRefs {
  heroCv: RefObject<HTMLCanvasElement | null>;
  heroR: RefObject<HTMLElement | null>;
  rvCv: RefObject<HTMLCanvasElement | null>;
  revealPin: RefObject<HTMLElement | null>;
  ctaCv: RefObject<HTMLCanvasElement | null>;
  ctaR: RefObject<HTMLElement | null>;
  tbCv: RefObject<HTMLCanvasElement | null>;
  tbR: RefObject<HTMLElement | null>;
  badgeCvs: RefObject<(HTMLCanvasElement | null)[]>;
  tagA: RefObject<HTMLElement | null>;
  tagB: RefObject<HTMLElement | null>;
  tbA: RefObject<HTMLElement | null>;
  tbB: RefObject<HTMLElement | null>;
  meter: RefObject<HTMLElement | null>;
  heroCopy: RefObject<HTMLElement | null>;
  rvHead: RefObject<HTMLElement | null>;
  rvCube: RefObject<HTMLElement | null>;
  substrate: RefObject<HTMLElement | null>;
  track: RefObject<HTMLElement | null>;
  root: RefObject<HTMLElement | null>;
}

function place(el: HTMLElement | null, cb: Cube, extra = 1.25) {
  if (!el) return;
  el.style.left = cb.sx + 'px';
  el.style.top = (cb.sy + cb.Sp * extra) + 'px';
}

export function useLandingMotion(refs: LandingRefs) {
  useEffect(() => {
    const STATIC = document.documentElement.classList.contains('static');
    const SHOT = document.documentElement.classList.contains('shot');
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallMedia = matchMedia('(max-width: 767px)');
    const scenes: TraceScene[] = [];

    const hero = refs.heroCv.current && refs.heroR.current
      ? new TraceScene(refs.heroCv.current, {
          host: refs.heroR.current,
          cubes: [{ x: .27, y: .3, size: .115, state: 'lume' }, { x: .73, y: .7, size: .115, state: 'lume', dissolve: 1.4 }],
          flow: { from: 0, to: 1, rate: .8 },
          onFrame: s => { place(refs.tagA.current, s.cubes[0]); place(refs.tagB.current, s.cubes[1]); },
        })
      : null;
    if (hero) scenes.push(hero);

    const rv = refs.rvCv.current
      ? new TraceScene(refs.rvCv.current, { cubes: [{ x: .5, y: .5, size: .3, state: 'lume', dissolve: .9 }], trace: false, tilt: true, host: refs.revealPin.current ?? undefined, auto: .25 })
      : null;
    if (rv) scenes.push(rv);

    if (refs.ctaCv.current) {
      scenes.push(new TraceScene(refs.ctaCv.current, { cubes: [{ x: .5, y: .47, size: .2, state: 'lume' }], trace: false, float: 10, auto: .2, pedestal: true, host: refs.ctaR.current ?? undefined }));
    }

    const root = refs.root.current;
    const bcards = root ? [...root.querySelectorAll<HTMLElement>('.bcard')] : [];
    const bscenes = bcards.map((c, i) => {
      const cv = refs.badgeCvs.current?.[i] ?? c.querySelector('canvas');
      if (!cv) return null;
      const sc = new TraceScene(cv, { cubes: [{ x: .5, y: .5, size: .27, state: 'lume' }], n: smallMedia.matches ? 7 : 9, trace: false, auto: .05, tilt: false, ambient: 8 });
      const rgb = (c.dataset.rgb || '200,255,106').split(',').map(Number) as [number, number, number];
      sc.cubes[0].rgb = rgb;
      scenes.push(sc);
      return sc;
    });

    const forced = location.hash.includes('hover');
    const tbA = refs.tbA.current, tbB = refs.tbB.current;
    function traceBack(on: boolean, s: TraceScene) {
      if (!tbA || !tbB) return;
      if (on) {
        s.setFlow(1, 0, 2.6); s.cubes[0].state = 'orig'; s.cubes[1].state = 'copy';
        tbA.className = 'ctag orig'; tbA.innerHTML = '<b>#4</b> · likely original';
        tbB.className = 'ctag copy'; tbB.innerHTML = '<b>#34</b> · silent copy';
      } else {
        s.setFlow(0, 1, .35); s.cubes[0].state = 'dim'; s.cubes[1].state = 'lume';
        tbA.className = 'ctag'; tbA.innerHTML = '<b>#4</b> · XOR';
        tbB.className = 'ctag'; tbB.innerHTML = '<b>#34</b> · hover me';
      }
    }
    const tb = refs.tbCv.current && refs.tbR.current
      ? new TraceScene(refs.tbCv.current, {
          host: refs.tbR.current, pedestal: true,
          cubes: [{ x: .27, y: .44, size: .105, state: 'dim', dissolve: .5 }, { x: .73, y: .44, size: .105, state: 'lume', dissolve: 1.2 }],
          flow: { from: 0, to: 1, rate: .35 },
          onHover: (i, s) => traceBack(i === 1 || forced, s),
          onFrame: s => {
            place(tbA, s.cubes[0], 2.35);
            place(tbB, s.cubes[1], 2.35);
          },
        })
      : null;
    if (tb) {
      scenes.push(tb);
      if (forced) { traceBack(true, tb); if (STATIC) { tb.dust = []; tb.seedStatic(); tb.frame(0); } }
    }

    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      e.target.querySelectorAll<HTMLElement>('.n[data-to]').forEach(n => {
        const to = +n.dataset.to!, fmt = n.dataset.fmt || '{n}';
        if (STATIC || RM || SHOT) { n.textContent = fmt.replace('{n}', String(to)); n.classList.add('done'); return; }
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = clamp((now - t0) / 1200);
          n.textContent = fmt.replace('{n}', String(Math.round(ease(k) * to)));
          if (k < 1) requestAnimationFrame(tick); else n.classList.add('done');
        };
        requestAnimationFrame(tick);
      });
    }), { threshold: .25 });
    root?.querySelectorAll('.rv, .fc').forEach(el => io.observe(el));
    if (STATIC) root?.querySelectorAll<HTMLElement>('.n[data-to]').forEach(n => {
      n.textContent = (n.dataset.fmt || '{n}').replace('{n}', n.dataset.to!);
      n.classList.add('done');
    });

    const steps = root ? [...root.querySelectorAll<HTMLElement>('.step')] : [];
    const widgets = root ? [...root.querySelectorAll<HTMLElement>('.widget')] : [];
    const dots = root ? [...root.querySelectorAll('#dots i')] : [];
    const story = root?.querySelector<HTMLElement>('#story');
    const badges = root?.querySelector<HTMLElement>('#badges');
    const meterKids = refs.meter.current ? [...refs.meter.current.children] : [];
    const prog = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
    let lastB = -1;
    let ticking = false;

    function onScroll() {
      ticking = false;
      const y = scrollY, vh = innerHeight;
      const ph = clamp(y / (vh * .9));
      if (!STATIC && refs.heroCopy.current) {
        refs.heroCopy.current.style.transform = `translateY(${-ph * 80}px)`;
        refs.heroCopy.current.style.opacity = String(1 - ph * 1.1);
      }
      if (hero) hero.flow.rate = .8 + ph * 7;
      const on = Math.round(4 + ph * 12 + ((performance.now() / 600) % 2 | 0));
      meterKids.forEach((c, i) => c.classList.toggle('off', i >= on));
      const pr = STATIC ? .6 : (story ? prog(story) : 0);
      const eh = ease(clamp(pr / .28));
      if (refs.rvHead.current) {
        refs.rvHead.current.style.opacity = STATIC ? '1' : String(eh);
        refs.rvHead.current.style.transform = `translateY(${(1 - eh) * 40}px)`;
      }
      const ec = ease(clamp((pr - .05) / .5));
      if (refs.rvCube.current) refs.rvCube.current.style.transform = `translateY(${(1 - ec) * 55}vh) scale(${.55 + .45 * ec})`;
      if (refs.substrate.current) refs.substrate.current.style.transform = `translateY(${-pr * 120}px)`;
      widgets.forEach(w => { w.style.transform = `translateY(${(.5 - pr) * 260 * (+w.dataset.sp!)}px)`; });
      const si = STATIC ? 2 : pr < .4 ? 0 : pr < .68 ? 1 : 2;
      steps.forEach((s, i) => s.classList.toggle('on', i <= si && (i === si || STATIC)));
      if (rv) {
        rv.cubes[0].state = si === 2 && !STATIC ? 'copy' : 'lume';
        if (STATIC) rv.cubes[0].state = 'lume';
      }
      if (!smallMedia.matches && !STATIC && badges && refs.track.current) {
        const pb = prog(badges);
        const n = bcards.length, cw = 380 + 28;
        const idx = clamp(Math.round(pb * (n - 1) * 1.05 - .02), 0, n - 1);
        refs.track.current.style.transform = `translateX(${-pb * (n - 1) * cw}px)`;
        if (idx !== lastB) {
          lastB = idx;
          bcards.forEach((c, i) => c.classList.toggle('on', i === idx));
          dots.forEach((d, i) => d.classList.toggle('on', i === idx));
          bscenes.forEach((s, i) => { if (s) s.o.auto = i === idx ? .9 : .05; });
        }
      }
    }

    let bio: IntersectionObserver | undefined;
    if (smallMedia.matches && !STATIC && refs.track.current) {
      bio = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) {
          const i = bcards.indexOf(e.target as HTMLElement);
          bcards.forEach((c, j) => c.classList.toggle('on', j === i));
          dots.forEach((d, j) => d.classList.toggle('on', j === i));
          bscenes.forEach((s, j) => { if (s) s.o.auto = j === i ? .9 : .05; });
        }
      }), { root: refs.track.current, threshold: .6 });
      bcards.forEach(c => bio!.observe(c));
    }
    if (STATIC) bcards.forEach(c => c.classList.add('on'));

    const onScrollRaf = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener('scroll', onScrollRaf, { passive: true });
    const interval = setInterval(onScroll, 120);

    const go = (id: string, p = 0) => {
      const s = document.getElementById(id); if (!s) return;
      const top = s.getBoundingClientRect().top + scrollY;
      const span = Math.max(0, s.offsetHeight - innerHeight);
      scrollTo(0, top + p * span - (span ? 0 : 64));
      onScroll();
    };
    (window as unknown as { __go: typeof go; __tb: () => void }).__go = go;
    (window as unknown as { __tb: () => void }).__tb = () => { if (tb) traceBack(true, tb); };

    const m = location.hash.match(/f=([\w-]+):?([\d.]*)/);
    if (m) go(m[1], +(m[2] || 0));
    // landing section hashes
    const sec = location.hash.replace(/^#/, '').split('&')[0];
    if (sec && !sec.startsWith('/') && !sec.startsWith('0x') && !sec.startsWith('f=') && document.getElementById(sec)) {
      // native jump already happened; just sync motion
    }
    onScroll();

    return () => {
      removeEventListener('scroll', onScrollRaf);
      clearInterval(interval);
      io.disconnect();
      bio?.disconnect();
      scenes.forEach(s => s.destroy());
    };
  // mount once; refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
