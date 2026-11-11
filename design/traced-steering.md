---
inclusion: always
---

# Traced: steering (design system v1)

Traced, for TapeOut. *Every circuit, traced back to its source.* A read-only provenance viewer for TapeOut circuits on X Layer: REF lineage, silent-copy detection, free eval() replay. These rules hold for every screen. The mocks in `mocks/` are the visual reference; `src/tokens.css` is the token source of truth.

## 1. Tokens

Paste as-is into the app's global CSS. Never hard-code a colour outside this block.

```css
:root{
  /* surfaces */
  --bg:#0B0B0B;              /* page, app canvas */
  --panel:#111211;           /* sidebar, cards, detail panel */
  --raised:#171917;          /* inputs, nodes, table heads, menus */
  --raised-hi:#1E211E;       /* hover on raised */
  --hairline:#232623;        /* grid lines, card borders */
  --hairline-strong:#343834; /* dividers on raised */
  --hatch:rgba(242,244,239,.05); /* diagonal hatch stroke */
  --crosshair:#5A6058;       /* + marks at grid intersections */
  /* text */
  --fg:#F2F4EF;              /* primary 17.8:1 */
  --fg-2:#A6ABA3;            /* secondary 8.4:1 */
  --fg-3:#7E847C;            /* labels, footnotes 5.1:1 (min 11px mono caps / 12px text) */
  /* accent: Douglas's lighter acid green */
  --lume:#C8FF6A;            /* primary accent, solid button, live traces 16.8:1 */
  --lume-hi:#D9FF94;         /* hover */
  --lume-deep:#9ED93F;       /* pressed, dense voxels */
  --lume-dim:#3E5222;        /* idle traces, empty meter cells (decorative only) */
  --lume-veil:rgba(200,255,106,.10);
  --on-lume:#0B0B0B;         /* text on lume 16.8:1 */
  /* verdicts */
  --orig:#FFC266;            /* likely original 12.3:1 */
  --orig-veil:rgba(255,194,102,.10);
  --copy:#FF6B8B;            /* silent copy, mismatch, error 7.2:1 */
  --copy-veil:rgba(255,107,139,.10);
  --low:#2C302B;             /* logic-0 cell fill */
  /* class badges (Traced heuristics, src/lib/classify.ts) */
  --cls-toy:#A6ABA3; --cls-wrapper:#B9A3FF; --cls-library:#C8FF6A;
  --cls-miner:#FFC266; --cls-composed:#8FB8FF; --cls-flat:#A6ABA3;
  /* type */
  --font-display:"Host Grotesk","Geist",system-ui,sans-serif;
  --font-body:"Geist",system-ui,-apple-system,"Segoe UI",sans-serif;
  --font-mono:"Geist Mono","JetBrains Mono",ui-monospace,Menlo,monospace;
  --text-2xs:11px; --text-xs:12px; --text-sm:13px; --text-base:15px; --text-md:17px;
  --text-lg:20px; --text-xl:28px; --text-2xl:44px; --text-3xl:56px; --text-hero:72px;
  --leading-tight:1.02; --leading-snug:1.25; --leading-body:1.55;
  --track-display:-.03em; --track-label:.08em;
  /* spacing */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px; --s-6:24px;
  --s-8:32px; --s-10:40px; --s-12:48px; --s-16:64px; --s-20:80px; --s-30:120px;
  --frame:1280px;            /* landing frame width; hairlines on its edges */
  --grid-cell:48px;          /* hero-panel grid */
  /* radii: square and technical */
  --r-xs:2px; --r-sm:4px; --r-md:8px; --r-lg:12px; --r-xl:18px; --r-pill:999px;
  /* elevation */
  --shadow-panel:inset 0 1px 0 rgba(255,255,255,.03),0 30px 80px -40px rgba(0,0,0,.9);
  --glow-lume:0 0 0 1px rgba(200,255,106,.5),0 0 28px rgba(200,255,106,.16);
  --ring:0 0 0 2px var(--bg),0 0 0 4px var(--lume);
  /* motion: CSS animates opacity + transform only; canvases redraw pixels */
  --d-fast:140ms; --d-base:240ms; --d-slow:600ms; --d-reveal:800ms; --d-count:1200ms;
  --ease-out:cubic-bezier(.16,1,.3,1);
  --ease-trace:cubic-bezier(.45,0,.2,1);
}
```

Fonts (all OFL, Google Fonts): **Host Grotesk** 500 for display (−0.03em), **Geist** 400/500 for body and UI, **Geist Mono** 400/500 for labels, IDs, hashes, addresses, nav and data. Labels are mono caps at 11–12px, +0.08em.

```html
<link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Optional Tailwind mapping (`theme.extend`):

```js
colors:{bg:'var(--bg)',panel:'var(--panel)',raised:'var(--raised)',hairline:'var(--hairline)',
  fg:{DEFAULT:'var(--fg)',2:'var(--fg-2)',3:'var(--fg-3)'},
  lume:{DEFAULT:'var(--lume)',hi:'var(--lume-hi)',deep:'var(--lume-deep)',dim:'var(--lume-dim)'},
  orig:'var(--orig)',copy:'var(--copy)',
  cls:{toy:'var(--cls-toy)',wrapper:'var(--cls-wrapper)',library:'var(--cls-library)',miner:'var(--cls-miner)',composed:'var(--cls-composed)',flat:'var(--cls-flat)'}},
fontFamily:{display:'var(--font-display)',sans:'var(--font-body)',mono:'var(--font-mono)'},
borderRadius:{xs:'2px',sm:'4px',md:'8px',lg:'12px',xl:'18px'},
transitionTimingFunction:{out:'cubic-bezier(.16,1,.3,1)'}
```

### Contrast (checked by script, WCAG 2.1, on #0B0B0B / #111211 / #171917)
| Token | on bg | Use |
|---|---|---|
| fg #F2F4EF | 17.8 | body, headings |
| fg-2 #A6ABA3 | 8.4 | secondary text |
| fg-3 #7E847C | 5.1 | labels, footnotes (≥11px mono caps or ≥12px text) |
| lume #C8FF6A | 16.8 | accent text, solid buttons (text #0B0B0B on lume = 16.8) |
| orig #FFC266 | 12.3 | "likely original" |
| copy #FF6B8B | 7.2 | "silent copy", mismatch, error |
| wrapper #B9A3FF | 9.1 | badge |
| composed #8FB8FF | 9.8 | badge |
| lume-dim #3E5222 | — | decorative only, never text |

## 2. Components

| Component | Props | Notes |
|---|---|---|
| `Header` (landing) | `links[]`, `ctaHref` | Sticky, `backdrop-filter: blur(14px)` over `rgba(11,11,11,.72)`, hairline bottom. Mono caps nav, each link prefixed "/ ". Lockup: chosen mark A (via ring, lume) + "Traced" in Host Grotesk 600 with mono "FOR TAPEOUT" underneath. Ghost "Open app" button. Mobile: menu button, sheet. |
| `AppShell` | `active`, `processor` | 232px floating sidebar (panel, r-xl, hairline): lockup (mark A + "Traced" / "FOR TAPEOUT"), lume "New lookup" + "+", nav (Lookup, Lineage, Copy check with count, Replay), processor box, "What we can't see", "X Layer · read-only". ≤767px: sticky top bar (compact lockup: mark + "Traced") + bottom tab bar (4 tabs). |
| `LookupBar` | `processor`, `cid`, `onTrace`, `size: 'md'|'lg'` | Processor select (name + mono symbol) │ "#" + mono input │ lume "Trace". Input `min-width:0; width:100%`. Stacks on mobile (button full width). Enter submits. |
| `ExampleChips` | `chips: {cid, label, href}[]` | Exactly three on the landing CTA and the not-found state: **#5** "XOR, built from 3 parts", **#4 vs #34** "a silent copy", **#12** "11 REFs". Mono ID in lume, label fg-2. |
| `Badge` | `cls: 'toy'|'wrapper'|'library'|'miner'|'composed'|'flat'` | DIP-package chip: 2px-pin icon + mono caps label in the class colour, 1px border at 45% of it. `flat` uses a dashed border. Label text for miner is "Miner-sized". Always paired with the rule it came from in the detail panel. |
| `VerdictTag` | `kind: 'orig'|'copy'|'ok'|'ex'` | Mono caps 11px. orig = "Likely original" (gold), copy = "Silent copy" (pink), ok = "No twins"/"match" (lume), ex = "Example data · Traced index" (dashed fg-3). |
| `CopyCheck` | `twins[]`, `basis: 'block'|'id'` | Zero twins → "No silent copies" + one-line basis. Twins → `TwinCompare`. Footnote always: "Matched on keccak256 of the netlist bytes. REF reuse is never a copy." |
| `TwinCompare` | `original`, `copy`, `hash` | Two cards side by side (stacked on mobile) with "= same bytes" between: gold border on the likely original, pink on the copy; owner, tape-out tx (link), block. Footer states how the original was picked ("lowest ID on the same processor, because #34's tape-out block isn't indexed yet"). |
| `RadialLineage` | `root`, `mode: 'parents'|'uses'|'children'|'twins'`, `onSelect` | Orb with the root's cube (left), category chips column (counts; selected one lume), leaves fanned on the right with bezier wires and a travelling pulse. **Collapse rule:** show at most 12 leaves (8 under 1100px); the rest become one "+k more" node that expands in place. In `uses` mode, repeated parents get a bracket "#9 ×8". |
| `LineageList` (mobile) | same as above | Head card (cube, ID, badge), horizontal chips, spine list. `uses` mode groups by parent: one row per parent with "×n uses" and n pin ticks (max 12). |
| `DetailPanel` | `circuit` | 340px right panel: badge + processor, ID, one-sentence summary, 2×2 tiles (gates flattened, REF uses, parents, children), kv list (owner, tape-out tx, block, I/O, netlist hash), mini copy check, mini replay, `HonestNote`. Below main content on mobile. |
| `ReplayTable` | `inputs`, `rows`, `against`, `results` | Bit cells: 1 = lume outline on lume-veil, 0 = `--low`. Columns A…, this OUT, twin/parent OUT, MATCH. Match = lume "✓ match"; mismatch = whole row pink veil + "× differs". Summary tiles: rows match "4/4", inputs → outputs, "0 transactions sent". Footer: "The app fills this table from live eval() view calls on X Layer." |
| `HonestNote` | `compact?` | Icon + "Replay uses free eval() view calls. They leave nothing on-chain, so nobody, including us, can count who uses a circuit. Traced only shows what's written: REFs, netlist bytes, tape-out txs." Appears in the detail panel, lookup and replay. Never remove. |
| `States` | `kind: 'loading'|'notfound'|'error'` | Loading: title "Tracing #5…", skeleton blocks (opacity pulse) + scan line (transform) labelled "Reading X Layer · netlist · owner · REFs", "Free view calls. Nothing is signed." Not found: "No circuit #999 on Cerebr." + hint + `ExampleChips`. Error: pink mono "Can't reach X Layer", "The trace went quiet.", "Both public RPC endpoints timed out. Nothing was sent or signed, so it's safe to retry.", lume "Try again" + ghost "Copy error details", endpoints listed. |
| `FindingsEmpty` | `cid` | Wireframe lume sphere (canvas, slow rotation; static under reduced motion), mono "Copy check · Cerebr #5", **"Nice, no silent copies found."**, one-line reason. |
| `TraceScene` | `cubes[{x,y,size,state,dissolve}]`, `flow{from,to,rate}`, `trace`, `pedestal`, `tilt`, `onHover`, `onFrame` | Canvas2D voxel dot-cubes + right-angle PCB trace with dust. `state`: lume / dim / orig / copy. Pointer tilts; hover/tap (2.6s hold on touch) calls `onHover`. Desktop n=17 voxels/edge, 700 dust max; ≤767px n=11, 220 dust. DPR ≤2. Pauses offscreen (IntersectionObserver). Reduced motion: one static frame with pre-seeded dust. Reference implementation: `src/cubes.js`. Decorative: `aria-hidden`, or `role="img"` with a sentence when it carries a meaning (trace-back). |

## 3. Layout & breakpoints
- Landing frame 1280px max, hairline verticals on both edges, crosshair "+" marks where section rules meet them. Hero 50/50 (hatched copy panel │ gridded canvas panel), stats strip of 4 cells below.
- Breakpoints: **≥1100** full; **768–1099** tablet (hero stacks, feature grid 2-up, detail panel under the tree); **≤767** mobile (single column, 20px gutters, 44px minimum touch targets, bottom tab bar in the app).
- App: sidebar 232px · main fluid · detail panel 340px. Cards: panel bg, hairline border, r-xl outer / r-md inner.

## 4. Voice
- Plain, short, a little dry. Second person. Name the circuit by ID ("#34"), never "this asset".
- Say what the chain shows, and how we know. Every verdict carries its basis ("by block", "by ID on Cerebr", "same keccak256").
- Hedge exactly where the data is a heuristic: "likely original", "Traced's heuristic". Never "stolen", "plagiarised", "proof of theft".
- Badges are Traced's labels, not TapeOut classes. Say so wherever they're explained.
- No usage numbers. Ever. If a design needs a count of runs, it is the wrong design.

## 5. Do / don't
- **Do** label example values "Example data · Traced index" (dashed `VerdictTag ex`).
- **Do** keep the five functional parts on any circuit view: header with badge, REF family tree, copy check with original marked, replay table with match marks, honest note.
- **Do** animate only opacity and transform in CSS; canvases redraw. Honour `prefers-reduced-motion` everywhere.
- **Don't** fabricate stats, users, TVL, "circuits traced" counters, testimonials or partner rows.
- **Don't** use OKX, X Layer, TapeOut or any third-party logo. Text names are fine; the footer says "Not affiliated with TapeOut, OKX or X Layer."
- **Don't** use teal or a second green; lume is the only green. Don't put text in lume-dim.
- **Don't** call REF reuse a copy.

## 6. Example-data rule
All numbers on the landing and in the mocks come from `public/data/index.json` (X Layer chainId 196, indexed to block 75,628,053) for the Cerebr processor `0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff`. They are examples of what one lookup shows, never totals. Current examples: #12 has 11 REF uses across 3 parents (#9 ×8, #10 ×2, #2 ×1) and 47 flattened gates; #4 and #34 share netlist hash 0x5636…d263 with no REF between them; #34's 4 truth-table rows match #4. If the index changes, regenerate the numbers. Don't keep stale ones.
