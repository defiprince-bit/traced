# Traced: design (v1, 11 Nov 2026)

**Traced, for TapeOut.** *Every circuit, traced back to its source.*
OKX X Layer TapeOut hackathon entry, due **7 Dec 2026 23:59 UTC** (8 Dec 00:59 WAT).
Design only. Nothing in `/workspace/traced/src` was touched. System rules live in `traced-steering.md`; the decisions log is in `NOTES.md`.

## 1. Direction
Douglas's ref1 (Axiom Zero) language, rewritten for provenance:
- A **#0B0B0B** page with a 1280px frame of hairlines, crosshair "+" marks at the joins, a diagonal hatch on the hero copy panel, and a 48px grid on the visual panel.
- **Lume #C8FF6A**, a lighter acid green, is the only accent. Gold `#FFC266` means *likely original*; pink `#FF6B8B` means *silent copy / mismatch*. Those three colours carry the story.
- A grotesk display face (Host Grotesk), Geist for UI and Geist Mono for every label, ID and hash. Mono caps nav with "/" prefixes.
- The hero visual is **two voxel dot-cubes joined by a right-angle PCB trace**, with dust running from one to the other. It's a picture of the product's one idea: a circuit's bytes travel, and Traced follows them home. It's decorative and never shows data.

## 2. Landing: section-by-section story (`mocks/landing.html`)
| # | Section | What it says | What moves |
|---|---|---|---|
| 1 | **Hero** (50/50) | Mono pill "TapeOut circuits · X Layer". H1 "Every circuit, traced back to its source." Ghost "How it works", lume "Trace a circuit". Right: status "Trace · read-only", a 16-cell dotted meter, cubes A "source" and B "reuse or copy?". Stats strip of honest facts: gate types NAND · LATCH · default processor Cerebr · usage counted **None** · transactions sent **0**. | Pointer tilts the cubes; hovering or tapping a cube streams its dust to the other. On scroll the copy lifts and fades (translateY + opacity), the dust rate rises (0.8 → 7.8) and the meter fills. |
| 2 | **Story reveal** `#story` (240vh pinned) | "Every circuit leaves a trace." Steps 01 taped out → 02 reused by REF → 03 copied silently. | The headline fades up, a cube rises (translateY 55vh → 0, scale .55 → 1) and turns pink at step 03. The substrate SVG grid parallaxes (−120px). Five blurred widgets with **real** values (hash 0x5636…d263, REF #5→#2 ×1, block 72,461,528, eval→1, owner 0xc742…960c) drift at different speeds. |
| 3 | **Features** `#features` 2×3 | "One lookup. Six answers." Lineage **11** REFs inside #12 · Copy check **2** identical netlists #4 and #34 · Replay **4/4** rows match · Badge (4 chips) · Earliest original **#4** · Honest note **0** usage counted. Each number has an "Example" tag and the header says they're real Cerebr examples, not totals. | Cards fade up (stagger 60ms); counters count up over 1200ms when 25% visible. |
| 4 | **Badges** `#badges` (340vh pinned, horizontal) | Toy, Wrapper, Library, Miner-sized, each with its rule, a "watch for" or real example, and a dot-chip cube in the class colour. "Two more, Composed and Flat, appear in the app." | Vertical scroll drives translateX. The centred card is at full opacity and scale 1 with its chip rotating; side cards sit at .4 opacity, scale .9, with their chips near-still. A dots indicator sits underneath. |
| 5 | **Inside the app** `#inside` (sticky device) | Left: 01 Lineage, 02 Copy check, 03 Replay text blocks. Right: a sticky app frame with a mono URL crumb. | The block crossing the middle band (rootMargin −45%) becomes active; the frame crossfades between live `app.html` views (opacity + scale .985 → 1). |
| 6 | **Trace-back** `#trace-back` | "Hover the copy. Watch it point home." The legend explains Likely original / Silent copy / REF. | Hovering or tapping #34 reverses the flow (#34 → #4): #4 turns gold and is tagged "likely original", #34 turns pink and is tagged "silent copy". |
| 7 | **Honesty** `#honesty` 3×2 | "Honest about what a chain can't show." Free runs leave no trace · So we don't count usage · Read-only, always · Earliest isn't proof · Badges are our labels · Same bytes, nothing more. | Fade-up stagger. |
| 8 | **CTA + footer** `#cta` | "Find where it came from." Large LookupBar and chips #5 / #4 vs #34 / #12 deep-linking to the app. Footer: links and "Not affiliated with TapeOut, OKX or X Layer." | An idle floating cube with a pedestal (slow bob and auto-rotate). |

## 3. App (`mocks/app.html`, views by hash)
`#lineage-12` (radial tree + detail panel) · `#lookup-5` (all five functional parts on one page) · `#copy-34` (findings shell: filters, twin compare) · `#findings-empty` ("Nice, no silent copies found.") · `#replay-34` (truth table) · `#state-loading` · `#state-notfound` · `#state-error`. The shell follows ref2 (CyFocus findings) and the lineage view follows ref3 (radial tree with a right detail panel).

The five functional parts, and where each one lives:
1. **Header with classification badge:** the title row plus the `Badge` in the lookup card and detail panel.
2. **REF family tree:** `RadialLineage` on desktop, `LineageList` on mobile.
3. **Copy check with original marked:** the `CopyCheck` mini, and the full `TwinCompare` in `#copy-34`.
4. **Free eval replay truth table with match marks:** `ReplayTable`.
5. **Honest note, no usage count:** `HonestNote` in the panel, lookup and replay views, plus the honesty grid on the landing.

## 4. Motion spec
- CSS animates **opacity and transform only** (checked by script; colour changes are instant state swaps). Canvases redraw their own pixels.
- Durations: fast 140ms (hover), base 240ms, slow 600ms (crossfades, cards), reveal 800ms, count 1200ms. Ease `cubic-bezier(.16,1,.3,1)`.
- TraceScene targets 60fps: voxels n=17 / dust ≤700 on desktop, n=11 / dust ≤220 at ≤767px, DPR capped at 2, paused offscreen.

### Build with GSAP ScrollTrigger + Lenis (optional), or keep vanilla
The mock is vanilla (IntersectionObserver plus one rAF scroll handler) and production can ship it as is. If DevOps wants smoother scrubbing:
| Part | Recommended | Why |
|---|---|---|
| Lenis smooth scroll | Optional, desktop only; off for reduced motion and touch | Makes the pinned scrubs feel continuous. Pass `lenis.on('scroll', ScrollTrigger.update)`. |
| Hero copy lift + dust rate | ScrollTrigger `scrub:true`, trigger the hero, end `bottom top` | Drives `TraceScene.flow.rate` from `self.progress`. |
| Story reveal (§2) | ScrollTrigger `pin:true`, `scrub:.6`, a timeline of headline → cube → steps | Replaces the manual `prog()` maths; snap the steps with `snap:[0,.4,.68,1]`. |
| Badges horizontal (§4) | ScrollTrigger `pin` + `scrub`, `x: -(n-1)*cardW`, `onUpdate` sets the active card | The textbook horizontal pin. **Mobile: no pin**; use native scroll-snap (already in the mock). |
| Device crossfade (§5) | Either. IO is enough. ScrollTrigger `toggleActions` per block if GSAP is already loaded. | |
| Feature counters, fade-ups, honesty grid | Keep vanilla IO | GSAP adds nothing here. |
| TraceScene | Always vanilla Canvas2D (`src/cubes.js`) | Own rAF; no library. |
Wrap every GSAP setup in `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference) and (min-width: 768px)`.

## 5. Mobile rules (≤767px)
- The hero stacks with copy first, then the canvas (cubes on a diagonal), then the stats strip in 2×2.
- The story pin is shorter; the steps stack under the cube with their short lines hidden.
- Badges become a **swipe carousel** (scroll-snap, 82vw cards, active card set by IO at 60%), with dots underneath.
- The sticky device becomes **stacked frames**: each text block is followed by its own 390-wide app iframe.
- Trace-back: text first, then the canvas; tapping #34 holds the trace-back for 2.6s.
- App: top bar plus a bottom tab bar; the lineage becomes the grouped `LineageList`; the detail panel moves below; twin cards stack.
- Particle counts drop (n=11, dust ≤220).

## 6. Reduced motion and static mode
`prefers-reduced-motion: reduce` (or `#static` in the mock URL) adds `html.static`. Pins are removed and every section lays out in flow, cards and steps show at full opacity, counters show their final values, the badge track wraps into a grid, and each canvas draws **one static frame** with pre-seeded dust. Hover still swaps cube states (an instant colour change, no flow animation).

## 7. Accessibility
- Text contrast passes AA, and AAA for everything except fg-3 labels (5.1:1). See the table in `traced-steering.md`.
- Focus ring: `0 0 0 2px var(--bg), 0 0 0 4px var(--lume)`. Every interactive element is a real `<a>` or `<button>`, and the lineage leaves are links.
- Decorative canvases are `aria-hidden`; the trace-back canvas is `role="img"` with a sentence. Status never relies on colour alone: every verdict has a text tag.
- Touch targets are at least 44px on mobile.

## 8. Distinctness
- **TapeOutScan** has a light UI with blue and gold accents.
- **Firsto** is dark with teal-green, gold squares and red.
- Traced uses true black, a single *yellow-leaning* lume (#C8FF6A, hue ≈ 82°, against Firsto's teal at ≈ 160°), voxel cubes and PCB traces, square technical radii and mono labels. The closest overlap is "dark with a green" against Firsto; see NOTES.md §3.

## 9. Legal and assets
- No OKX, X Layer, TapeOut or third-party logos. Names appear as text only, and the footer disclaimer is required.
- Fonts are OFL. The cubes and grids are code.
- The **logo is deferred** (Douglas). The mocks use the placeholder wordmark `logo-wordmark.svg` ("Traced" in Host Grotesk 600, outlined, no mark).
- A separate mark exploration exists in `logo/` (from another workstream, retraced from `traced-refs/logo-ref.jpg`). It isn't used in these mocks; see NOTES.md.
- `_superseded-v0/` holds the earlier copper/serif direction. Ignore it.

## 10. Shot index (`shots/`)
Landing, desktop 1440×900: `landing-desktop-01-hero`, `-02-story-a` (step 01), `-02-story-b` (step 03, copy), `-03-features`, `-04-badges-a`, `-04-badges-b` (Library centred), `-05-inside-lineage`, `-05-inside-copy`, `-05-inside-replay`, `-06-traceback`, `-06-traceback-hover`, `-07-honesty`, `-08-cta`, `landing-desktop-full` (static, 1440×6842).
Landing, mobile 390×844: `landing-mobile-01-hero`, `-02-story`, `-03-features`, `-04-badges`, `-05-inside`, `-06-traceback` (hover state), `-08-cta`, `landing-mobile-full` (static).
App, desktop 1440×900: `app-lineage-12-desktop`, `app-lookup-5-desktop`, `app-copy-34-desktop`, `app-findings-empty-desktop`, `app-replay-34-desktop`, `app-state-loading-desktop`, `app-state-notfound-desktop`, `app-state-error-desktop`.
App, mobile 390×844 plus full length: `app-{lineage-12,lookup-5,copy-34,findings-empty,replay-34}-mobile.png` and `…-mobile-full.png`.

## 11. Build notes
- `python3 src/build.py` inlines `tokens.css`, `base.css` and `cubes.js` into `mocks/*.html`. Fonts load from Google Fonts with local fallbacks; there's no other network dependency and no CDN JS.
- `bash src/shots.sh` regenerates every shot through `src/shoot.mjs`, a dependency-free Chrome DevTools driver that runs in real time so canvases and scroll effects settle. Full-page shots are stitched from viewport tiles.
- Mock URL flags: `#static` (reduced-motion layout), `&shot` (zero CSS durations), `#f=<section>:<progress>` (jump to a frame); app views by hash (`app.html#lineage-12`). In the console: `__go(id,p)`, `__block(i)`, `__tb()`.
- `src/shoot.sh` (virtual-time headless) is kept for the app views only, because virtual time stalls under continuous rAF.
