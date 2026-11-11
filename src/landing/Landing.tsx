import { useEffect, useRef, useState } from 'react';
import type { LoadedIndex } from '../useIndex';
import { CEREBR, toHash } from '../route';
import { Wordmark } from '../ui/Wordmark';
import { LookupBar } from '../ui/LookupBar';
import { ExampleChips } from '../ui/ExampleChips';
import { Badge } from '../ui/Badge';
import { VerdictTag } from '../ui/VerdictTag';
import { TraceScene } from '../cubes';
import { useLandingMotion } from './useLandingScroll';

const NAV = [
  { href: '#story', label: 'Story' },
  { href: '#features', label: 'Features' },
  { href: '#badges', label: 'Badges' },
  { href: '#trace-back', label: 'Trace-back' },
  { href: '#honesty', label: 'Honesty' },
];

const OPEN = toHash({ cpu: CEREBR, id: 5, vs: 4, view: 'lookup' });

const PREVIEWS = {
  lineage: { src: `${import.meta.env.BASE_URL}previews/lineage-12.png`, m: `${import.meta.env.BASE_URL}previews/lineage-12-m.png`, href: toHash({ cpu: CEREBR, id: 12, vs: null, view: 'lineage' }), crumb: 'traced / lineage / cerebr #12' },
  copy: { src: `${import.meta.env.BASE_URL}previews/copy-34.png`, m: `${import.meta.env.BASE_URL}previews/copy-34-m.png`, href: toHash({ cpu: CEREBR, id: 34, vs: 4, view: 'copy' }), crumb: 'traced / copy check / cerebr #34' },
  replay: { src: `${import.meta.env.BASE_URL}previews/replay-34.png`, m: `${import.meta.env.BASE_URL}previews/replay-34-m.png`, href: toHash({ cpu: CEREBR, id: 34, vs: 4, view: 'replay' }), crumb: 'traced / replay / #34 vs #4' },
};

export default function Landing({ ix, onTrace }: { ix: LoadedIndex; onTrace: (cpu: string, id: number, view?: 'lookup' | 'lineage' | 'copy' | 'replay', vs?: number | null) => void }) {
  const [menu, setMenu] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const heroCv = useRef<HTMLCanvasElement>(null);
  const heroR = useRef<HTMLDivElement>(null);
  const rvCv = useRef<HTMLCanvasElement>(null);
  const revealPin = useRef<HTMLDivElement>(null);
  const ctaCv = useRef<HTMLCanvasElement>(null);
  const ctaR = useRef<HTMLDivElement>(null);
  const tbCv = useRef<HTMLCanvasElement>(null);
  const tbR = useRef<HTMLDivElement>(null);
  const badgeCvs = useRef<(HTMLCanvasElement | null)[]>([]);
  const tagA = useRef<HTMLSpanElement>(null);
  const tagB = useRef<HTMLSpanElement>(null);
  const tbA = useRef<HTMLSpanElement>(null);
  const tbB = useRef<HTMLSpanElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const heroCopy = useRef<HTMLDivElement>(null);
  const rvHead = useRef<HTMLDivElement>(null);
  const rvCube = useRef<HTMLDivElement>(null);
  const substrate = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLandingMotion({
    heroCv, heroR, rvCv, revealPin, ctaCv, ctaR, tbCv, tbR, badgeCvs,
    tagA, tagB, tbA, tbB, meter, heroCopy, rvHead, rvCube, substrate, track, root,
  });

  return (
    <div className="landing" ref={root}>
      <header className="hdr">
        <div className="in">
          <Wordmark href="#top" />
          <nav className="nav" aria-label="Sections">
            {NAV.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <a className="btn btn-sm" href={OPEN}>Open app</a>
          <button className="menu" aria-label="Menu" onClick={() => setMenu(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        </div>
      </header>
      {menu && (
        <div className="sheet" role="dialog" aria-label="Menu">
          <div className="row"><Wordmark href="#top" onClick={() => setMenu(false)} /><button className="btn btn-sm" onClick={() => setMenu(false)} aria-label="Close">Close</button></div>
          {NAV.map(l => <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}</a>)}
          <a href={OPEN} onClick={() => setMenu(false)}>Open app</a>
        </div>
      )}

      <main className="frame" id="top">
        {/* 1 HERO */}
        <section className="sec" id="hero" style={{ borderTop: 0 }}>
          <div className="hero">
            <div className="hero-l"><div className="hero-copy" ref={heroCopy} id="heroCopy">
              <span className="mpill">TapeOut circuits · X Layer <span className="cur" /></span>
              <h1>Every circuit, traced back to its <span className="g">source.</span></h1>
              <p className="lede">Paste a circuit ID. See what it’s built from, who reused it with credit, and whether it’s a silent copy of something older.</p>
              <div className="ctas">
                <a className="btn btn-lg" href="#story">How it works</a>
                <a className="btn btn-lume btn-lg" href="#cta">Trace a circuit</a>
              </div>
            </div></div>
            <div className="hero-r" id="heroR" ref={heroR}>
              <canvas ref={heroCv} role="img" aria-label="Two circuits drawn as dot cubes. Dust flows from one to the other along a circuit trace. Move to tilt, hover a cube to reverse the flow." />
              <div className="hud">
                <span className="status">Trace · read-only</span>
                <span className="meter" id="meter" ref={meter} aria-hidden="true">
                  {Array.from({ length: 16 }, (_, i) => <i key={i} />)}
                </span>
              </div>
              <span className="ctag" id="tagA" ref={tagA}><b>A</b> · source</span>
              <span className="ctag" id="tagB" ref={tagB}><b>B</b> · reuse or copy?</span>
              <span className="hint">Move to tilt · hover a cube</span>
            </div>
            <div className="stats">
              <div className="stat"><span className="label">Gate types</span><span className="v">NAND · LATCH<span className="cur-u" /></span></div>
              <div className="stat"><span className="label">Default processor</span><span className="v">Cerebr<span className="cur-u" /></span></div>
              <div className="stat"><span className="label">Usage counted</span><span className="v">None<small>eval() is a free view call, off-chain</small></span></div>
              <div className="stat"><span className="label">Transactions sent</span><span className="v">0<small>Read-only. Nothing is signed.</small></span></div>
            </div>
          </div>
          <i className="x bl" /><i className="x br" />
        </section>

        {/* 2 STORY */}
        <section className="sec reveal" id="story">
          <div className="pin" id="revealPin" ref={revealPin}>
            <div className="substrate" id="substrate" ref={substrate} aria-hidden="true">
              <svg viewBox="0 0 1400 1000" preserveAspectRatio="xMidYMid slice">
                <defs><pattern id="sg" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="#1A1D1A" strokeWidth="1" /></pattern></defs>
                <rect width="1400" height="1000" fill="url(#sg)" />
                <g fill="none" stroke="#263220" strokeWidth="1.5">
                  <rect x="80" y="120" width="220" height="160" /><rect x="1090" y="160" width="240" height="180" />
                  <rect x="140" y="660" width="260" height="190" /><rect x="1040" y="640" width="200" height="220" />
                  <path d="M300 200H460V420H560M1090 250H940V430H840M400 750H520V600H600M1040 750H900V590H800" />
                </g>
                <g fill="#3E5222">
                  <circle cx="460" cy="200" r="4" /><circle cx="460" cy="420" r="4" /><circle cx="940" cy="250" r="4" />
                  <circle cx="940" cy="430" r="4" /><circle cx="520" cy="600" r="4" /><circle cx="900" cy="590" r="4" />
                </g>
              </svg>
            </div>
            <div className="widget" data-sp=".5" style={{ left: '7%', top: '26%' }}><span className="label">netlist hash</span><b>0x5636…d263</b></div>
            <div className="widget hide-m" data-sp=".8" style={{ left: '12%', top: '62%' }}><span className="label">REF</span>#5 → <b>#2</b> ×1</div>
            <div className="widget" data-sp=".35" style={{ right: '8%', top: '22%' }}><span className="label">tape-out</span>block <b>72,461,528</b></div>
            <div className="widget hide-m" data-sp=".7" style={{ right: '10%', top: '58%' }}><span className="label">eval(#5, A=1 B=0)</span>→ <b>1</b> · free</div>
            <div className="widget hide-m" data-sp="1" style={{ left: '24%', top: '80%' }}><span className="label">owner</span>0xc742…960c</div>
            <div className="rv-head" id="rvHead" ref={rvHead}>
              <span className="eyebrow">The story</span>
              <h2 style={{ marginTop: 20 }}>Every circuit leaves a <span className="g">trace.</span></h2>
              <p className="lede">TapeOut circuits are built from NAND and LATCH gates. They can reuse each other by REF, and that credit is written into the bytes. So is a copy.</p>
            </div>
            <div className="rv-cube" id="rvCube" ref={rvCube}><canvas ref={rvCv} aria-hidden="true" /></div>
            <div className="steps" id="steps">
              <div className="step"><span className="mono">01</span><p><b>A circuit is taped out.</b><span>Its netlist bytes and owner go on-chain.</span></p></div>
              <div className="step"><span className="mono">02</span><p><b>Someone reuses it by REF.</b><span>The credit is part of their bytes.</span></p></div>
              <div className="step"><span className="mono">03</span><p><b>Someone copies it silently.</b><span>Same bytes, no REF back.</span></p></div>
            </div>
          </div>
        </section>

        {/* 3 FEATURES */}
        <section className="sec" id="features">
          <div className="sh">
            <div><span className="eyebrow">What you see</span><h2 className="rv">One lookup. <span className="g">Six answers.</span></h2></div>
            <p className="lede rv">Counts below are real values from Cerebr examples in the Traced index, not totals.</p>
          </div>
          <div className="fgrid">
            <div className="fc rv">
              <svg className="ic" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="8" height="6" /><rect x="21" y="3" width="8" height="6" /><rect x="11" y="23" width="10" height="6" /><path d="M7 9v6h9v8M25 9v6h-9" /></svg>
              <h3>Lineage</h3><p>The REF family tree: the circuits it reuses, and the circuits that reuse it.</p>
              <div className="ctr"><span className="n" data-to="11">0</span><span className="u">REFs inside #12</span><span className="tag ex">example</span></div>
            </div>
            <div className="fc rv">
              <svg className="ic" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="11" height="18" /><rect x="18" y="7" width="11" height="18" /><path d="M6 12h5M6 16h5M6 20h3M21 12h5M21 16h5M21 20h3" /></svg>
              <h3>Copy check</h3><p>Circuits with byte-identical netlists and no REF back to each other.</p>
              <div className="ctr"><span className="n" data-to="2">0</span><span className="u">identical netlists, #4 and #34</span><span className="tag ex">example</span></div>
            </div>
            <div className="fc rv">
              <svg className="ic" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="7" height="7" /><rect x="3" y="20" width="7" height="7" /><rect x="14" y="5" width="7" height="7" /><rect x="14" y="20" width="7" height="7" /><path d="m24 9 2 2 4-5M24 24l2 2 4-5" /></svg>
              <h3>Replay</h3><p>Run it free in your browser and compare its truth table with its twin or parent.</p>
              <div className="ctr"><span className="n" data-to="4" data-fmt="{n}/4">0/4</span><span className="u">rows match, #34 vs #4</span><span className="tag ex">example</span></div>
            </div>
            <div className="fc rv">
              <svg className="ic" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="10" y="7" width="12" height="18" /><path d="M6 10h4M6 14h4M6 18h4M6 22h4M22 10h4M22 14h4M22 18h4M22 22h4" /></svg>
              <h3>Badge</h3><p>A plain-language class from the netlist’s shape. Traced’s heuristic, labelled as one.</p>
              <div className="minibadges">
                <Badge cls="toy" /><Badge cls="wrapper" /><Badge cls="library" /><Badge cls="miner-sized" />
              </div>
            </div>
            <div className="fc rv">
              <svg className="ic" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="24" height="24" /><rect x="11" y="11" width="10" height="10" fill="currentColor" /></svg>
              <h3>Earliest original</h3><p>When bytes match, the earliest tape-out is marked as the likely original.</p>
              <div className="ctr"><span className="n" style={{ color: 'var(--orig)' }}>#4</span><span className="u">before #34, by block</span><span className="tag ex">example</span></div>
            </div>
            <div className="fc rv">
              <svg className="ic" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="16" height="16" /><path d="M3 16h5M24 16h5M9 9l14 14" /></svg>
              <h3>Honest note</h3><p>Free eval calls leave no on-chain trace, so nobody can count usage. We don’t pretend to.</p>
              <div className="ctr"><span className="n" data-to="0">0</span><span className="u">usage counted, by design</span></div>
            </div>
          </div>
          <i className="x tl" /><i className="x tr" />
        </section>

        {/* 4 BADGES */}
        <section className="sec badges" id="badges">
          <div className="pin" id="badgePin">
            <div className="sh">
              <div><span className="eyebrow">Badges</span><h2>Four shapes. <span className="g">One glance.</span></h2></div>
              <p className="lede">Each circuit gets one class from its parts. Two more, Composed and Flat, appear in the app.</p>
            </div>
            <div className="track" id="track" ref={track}>
              {([
                { cls: 'toy' as const, rgb: '166,171,163', n: '01 / 04', title: 'Toy', rule: '1–3 NAND/LATCH gates · no REF', p: 'A trivial gate like NOT or AND. Easy to make, so it’s often copied many times.', ex: <>Watch for: <b>many identical twins</b></> },
                { cls: 'wrapper' as const, rgb: '185,163,255', n: '02 / 04', title: 'Wrapper', rule: 'Only REF elements · zero own gates', p: 'Pure composition. It burns no transistors itself and credits every part it uses.', ex: <>Example: <b>Cerebr #5, #12</b></> },
                { cls: 'library' as const, rgb: '200,255,106', n: '03 / 04', title: 'Library', rule: 'Cited by at least one circuit via REF', p: 'A building block other designers reuse with credit. A source worth finding.', ex: <>Example: <b>Cerebr #1, #2, #3</b></> },
                { cls: 'miner-sized' as const, rgb: '255,194,102', n: '04 / 04', title: 'Miner-sized', rule: 'Flat netlist · ≥ 1,000 gates · no REF', p: 'Big and flat, the size typical of gate-count farming. Size only, never proof of mining.', ex: <>Note: <b>a size label, not a verdict</b></> },
              ]).map((b, i) => (
                <article key={b.cls} className="bcard" style={{ ['--c' as string]: `var(--cls-${b.cls === 'miner-sized' ? 'miner' : b.cls})` }} data-rgb={b.rgb}>
                  <div className="top"><Badge cls={b.cls} /><span className="label">{b.n}</span></div>
                  <canvas ref={el => { badgeCvs.current[i] = el; }} aria-hidden="true" />
                  <h3>{b.title}</h3>
                  <div className="rule">{b.rule}</div>
                  <p>{b.p}</p>
                  <div className="exl">{b.ex}</div>
                </article>
              ))}
            </div>
            <div className="dots" id="dots"><i /><i /><i /><i /></div>
          </div>
        </section>

        {/* 5 INSIDE */}
        <Inside />

        {/* 6 TRACE-BACK */}
        <section className="sec tb" id="trace-back">
          <div className="tb-l">
            <span className="eyebrow">The trace-back</span>
            <h2 className="rv">Hover the copy. Watch it point <span className="g">home.</span></h2>
            <p className="lede rv">#34 has the same bytes as #4. Touch it and its dust runs back along the trace to the circuit it came from, which lights up as the likely original.</p>
            <div className="legend rv">
              <div><VerdictTag kind="orig" />earliest of the identical twins</div>
              <div><VerdictTag kind="copy" />same bytes, no REF back</div>
              <div><VerdictTag kind="ok">REF</VerdictTag>reuse with credit, never a copy</div>
            </div>
            <p className="foot" style={{ marginTop: 22 }}>Example: Cerebr #4 and #34. Move to tilt · hover or tap #34.</p>
          </div>
          <div className="tb-r" id="tbR" ref={tbR}>
            <canvas ref={tbCv} role="img" aria-label="Two dot cubes, #4 and #34. Hovering #34 sends its dust back to #4, which is marked likely original." />
            <span className="ctag" id="tbA" ref={tbA}><b>#4</b> · XOR</span>
            <span className="ctag" id="tbB" ref={tbB}><b>#34</b> · hover me</span>
          </div>
        </section>

        {/* 7 HONESTY */}
        <section className="sec hon" id="honesty">
          <div className="sh"><span className="eyebrow">Honesty</span><h2 className="rv">Honest about what a chain <span className="g">can’t</span> show.</h2></div>
          <div className="hgrid">
            <div className="hc rv"><span className="mono">01</span><h3>Free runs leave no trace</h3><p>eval() is a view call. It costs nothing and writes nothing on-chain.</p></div>
            <div className="hc rv"><span className="mono">02</span><h3>So we don’t count usage</h3><p>Nobody can see who runs a circuit, including us. We won’t guess a number.</p></div>
            <div className="hc rv"><span className="mono">03</span><h3>Read-only, always</h3><p>No wallet, no signing. Every lookup is a public read on X Layer.</p></div>
            <div className="hc rv"><span className="mono">04</span><h3>Earliest isn’t proof</h3><p>The likely original is picked by tape-out block, or by ID on one processor. It’s a strong hint, not a verdict.</p></div>
            <div className="hc rv"><span className="mono">05</span><h3>Badges are our labels</h3><p>Toy, Wrapper, Library and Miner-sized are Traced heuristics, not TapeOut classes.</p></div>
            <div className="hc rv"><span className="mono">06</span><h3>Same bytes, nothing more</h3><p>A copy check compares netlist bytes. It can’t see intent, and REF reuse is never a copy.</p></div>
          </div>
          <i className="x tl" /><i className="x tr" />
        </section>

        {/* 8 CTA */}
        <section className="sec cta" id="cta">
          <div className="cta-l">
            <span className="eyebrow">Start tracing</span>
            <h2 className="rv">Find where it <span className="g">came from.</span></h2>
            <p className="lede rv">Pick a processor, paste a circuit ID, and follow the trace.</p>
            <div className="rv"><LookupBar ix={ix} cpu={CEREBR} id={null} size="lg" onTrace={(cpu, id) => onTrace(cpu, id, 'lookup')} /></div>
            <div className="ex rv"><span className="label">Try</span><ExampleChips /></div>
          </div>
          <div className="cta-r" ref={ctaR}><canvas id="ctaCv" ref={ctaCv} aria-hidden="true" /></div>
          <i className="x tl" /><i className="x tr" />
        </section>
      </main>
      <footer className="rv">
        <div className="in">
          <Wordmark href="#top" />
          <nav className="links" aria-label="Footer">
            <a href={OPEN}>Open app</a>
            <a href="#story">Story</a>
            <a href="#honesty">Honesty</a>
            <a href="#top">Top</a>
          </nav>
          <div className="legal">
            <span className="foot">Every circuit, traced back to its source. Read-only; nothing is signed or sent.</span>
            <span className="foot">Not affiliated with TapeOut, OKX or X Layer.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Inside() {
  const [screen, setScreen] = useState(0);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const crumb = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const els = blocks.current.filter(Boolean) as HTMLDivElement[];
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) setScreen(+e.target.getAttribute('data-s')!); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    els.forEach(b => io.observe(b));
    return () => io.disconnect();
  }, []);
  const items = [PREVIEWS.lineage, PREVIEWS.copy, PREVIEWS.replay];
  return (
    <section className="sec device" id="inside">
      <div className="dv-l">
        <div className={`dblock${screen === 0 ? ' on' : ''}`} data-s="0" ref={el => { blocks.current[0] = el; }}>
          <span className="eyebrow">01 / Lineage</span>
          <h3>Follow every REF, even eleven of them.</h3>
          <p>The circuit sits on the left. Its REFs fan out to every part it reuses, grouped by parent, with use counts.</p>
          <ul><li>#12 → #9 ×8, #10 ×2, #2 ×1</li><li>Wide fan-outs collapse to “+k more”</li><li>Click any node for its detail</li></ul>
          <div className="mframe"><a href={items[0].href}><img src={items[0].m} alt="Lineage view of Cerebr #12" /></a></div>
        </div>
        <div className={`dblock${screen === 1 ? ' on' : ''}`} data-s="1" ref={el => { blocks.current[1] = el; }}>
          <span className="eyebrow">02 / Copy check</span>
          <h3>Same bytes, no credit, flagged.</h3>
          <p>Findings list every byte-identical twin. The earliest is marked as the likely original, and we say how we picked it.</p>
          <ul><li>#34 = #4, byte for byte</li><li>Original picked by block, else by ID</li><li>No twins? “Nice, no silent copies.”</li></ul>
          <div className="mframe"><a href={items[1].href}><img src={items[1].m} alt="Copy check of Cerebr #34" /></a></div>
        </div>
        <div className={`dblock${screen === 2 ? ' on' : ''}`} data-s="2" ref={el => { blocks.current[2] = el; }}>
          <span className="eyebrow">03 / Replay</span>
          <h3>Proof you can run, free.</h3>
          <p>Replay evaluates the circuit in your browser and compares every row with its twin or parent.</p>
          <ul><li>4 of 4 rows match, #34 vs #4</li><li>Free view calls, nothing signed</li><li>Mismatches flagged in pink</li></ul>
          <div className="mframe"><a href={items[2].href}><img src={items[2].m} alt="Replay of Cerebr #34 vs #4" /></a></div>
        </div>
      </div>
      <div className="dv-r">
        <div className="dsticky">
          <div className="appframe" id="appframe">
            <div className="bar"><i /><i /><i /><span id="crumb" ref={crumb}>{items[screen].crumb}</span></div>
            {items.map((it, i) => (
              <div key={it.crumb} className={`screen${i === screen ? ' on' : ''}`} data-s={i}>
                <a href={it.href}><img src={it.src} alt="" /></a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// re-export for hook typings (scene instances live in the hook)
export type { TraceScene };
