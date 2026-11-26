# Traced motion-design prompt (for Claude)

Paste everything below the line into Claude. Attach the files from `traced-bull-assets.zip` (screenshots + logos). Do not invent assets.

---

You are a motion designer building a short promo for **Traced** in code (Remotion preferred; HTML/CSS/GSAP rendered to MP4 is fine). Use **free tools only** — for example Remotion plus a free TTS such as Edge TTS, or leave a silent/timing track and I will record the voiceover myself. No paid stock, no paid APIs, no watermarked fonts.

Deliver two cuts of the same film, **30–45 seconds**, with burned-in voiceover:

- Vertical 9:16 (1080×1920) for X / Reels
- Landscape 16:9 (1920×1080) for YouTube / X landscape

## What Traced is

Traced is a free, read-only lookup for TapeOut circuits on X Layer (chain 196). Paste a circuit ID and see REF lineage, copy-twins (identical netlist bytes, no REF back), and a free in-browser replay over `eval()` / `step()`. No wallet, no sign-up, no custody. Tagline: **Every circuit, traced back to its source.** Site: https://traced-mu.vercel.app — X: @TracedXyz

These stills are from the live production site. Do not restyle the product UI; put the screenshots in device frames and move the camera around them.

## Brand (from src/styles.css — use these exact values)

**Surfaces:** bg `#0B0B0B`, panel `#111211`, raised `#171917`, hairline `#232623`, hairline-strong `#343834`.
**Text:** fg `#F2F4EF`, secondary `#A6ABA3`, labels `#7E847C`.
**Accent (lume, acid green):** `#C8FF6A` (hover `#D9FF94`, deep `#9ED93F`, dim `#3E5222`). Text on lume: `#0B0B0B`.
**Verdicts:** likely original gold `#FFC266`; silent copy / mismatch `#FF6B8B`.
**Type:** display **Host Grotesk** (headlines, kinetic type, end-card word), body **Geist**, mono **Geist Mono** (IDs, labels, uppercase captions, letter-spacing `0.08em`). All three are free on Google Fonts / Fontsource. Tracking for display: `-0.03em`. Radii are tight and technical: 2 / 4 / 8 / 12px, not pills except for tiny status chips.
**Motion feel:** CSS easing `cubic-bezier(.16, 1, .3, 1)` for UI; trace dust uses `cubic-bezier(.45, 0, .2, 1)`. Opacity + transform only. No bounce, no elastic, no glassmorphism, no gradients that aren't in the stills.

Logo: Variant A, the via-ring mark. Use `brand/logo-mark-a-1024-transparent.png` or `brand/mark-a-lume.svg` (lume on transparent). The rounded-square avatar is `brand/logo-avatar-1024.png` / `brand/favicon.svg`. Wordmark: `brand/logo-wordmark-2400.png` or `brand/wordmark.svg`. The original `brand/mark-a.svg` is **black** and is used as a CSS mask in the product — do not place that file on a dark background or it will vanish. Do not use mark-b or mark-c.

## Assets I am attaching

Use these filenames. All desktop stills are 3840×2160 (1920×1080 at 2×). The mobile still is 780×1688 (390×844 at 2×).

- `01-hero-1920x1080.png` — landing hero, tagline, two lume cubes with dust from A (source) to B (reuse or copy?)
- `02-story-steps-1920x1080.png` — Story: “Every circuit leaves a trace.” Steps 01–03 at the bottom; 03 (silent copy) is lit; the cube is copy-pink
- `03-traceback-34-hover-1920x1080.png` — Trace-back with #34 hovered: gold #4 “likely original”, pink #34 “silent copy”, dust running home along the trace
- `04-lineage-12-1920x1080.png` — Cerebr #12 lineage tree: 11 REF uses, 3 parents (#3, #10, #2)
- `05-copy-34-vs-4-1920x1080.png` — Copy check: “#34 is byte-for-byte #4”
- `06-copy-4-vs-34-likely-original-1920x1080.png` — Copy check: “#4 is the likely original of #34” (this is the corrected page)
- `07-replay-4-vs-34-1920x1080.png` — Replay #4 vs #34, truth table **4/4** match
- `08-latch-replay-14-vs-35-1920x1080.png` — Latch step-replay #14 vs #35, **24/24** match
- `10-hero-mobile-390x844.png` — mobile hero, for the 9:16 device frame
- `09-who-1920x1080.png` — “Who it's for” (builders, processor owners, judges, library users). Optional; use only if a beat needs a landing hold. Do not build a users/business-model scene around it.
- `brand/` — logos as described above

## Voiceover (read exactly; ~100 words)

On TapeOut, every circuit lives on-chain. Reuse it by REF, and the credit is written into the bytes. Copy it silently, and there is no trail. So how do you find the real source? You trace it back.

Traced is a free, read-only lookup for TapeOut circuits on X Layer. No wallet. No sign-up.

Paste an ID and follow the lineage. Flag copy-twins: same netlist bytes, different owner, no credit back. Then replay it in your browser. Four of four. Latches, stepped tick by tick: twenty-four of twenty-four.

Every circuit, traced back to its source.

## VO direction

Confident bull-post tone: close-mic, mid-low, dry, unhurried but sharp. Not a radio announcer, not a whisper. About 145–155 words/minute so this script lands near 40s. Brief hold before “You trace it back.” and before the final tagline. Pronounce REF as “ref”, eval as “ee-val”, #4 as “number four.” If you generate speech, prefer a free neural English voice (Edge TTS), then duck music −12 dB under the VO. I may replace the TTS with my own take; keep a clean VO stem and a music stem.

## Music direction

Original or clearly free instrumental only. Dark, precise, low pulse; sparse percussion; no lyrics, no corporate ukulele, no generic “tech handshake.” A lume-coloured riser or sting on “You trace it back.” and a short resolve on the end card. Leave 2s of room at the end so the card can hold.

## Shot-by-shot storyboard (~40s)

Time the cuts to the VO. 9:16: stack kinetic type in the safe upper/lower thirds and place product stills in a phone or slim device frame (use `10-hero-mobile-390x844.png` for the opening; crop the desktop stills to the content, not the empty side margins). 16:9: stills can go wider, still in a thin hairline frame (`#343834`, 12px radius, bg `#0B0B0B`, optional soft `#C8FF6A` glow at 16% opacity). Slow push-ins only (about 100% → 108% over a beat). Animate **dust / right-angle PCB traces** from copy (`#FF6B8B`) back to source (`#FFC266` / `#C8FF6A`) whenever twins or traceback are on screen.

**0:00–0:04 — Hook.** Still `01-hero` (16:9) / `10-hero-mobile` (9:16). Slow push-in on the cubes. Kinetic type, Host Grotesk, `#F2F4EF` with **source** in `#C8FF6A`: “Every circuit, traced back to its source.” VO: “On TapeOut, every circuit lives on-chain.”

**0:04–0:10 — The story.** Cut to `02-story-steps`. Hold the headline. On “Reuse it by REF…”, flash step 02; on “Copy it silently…”, snap step 03 to full opacity and let the pink cube read as the copy. On-screen mono labels: `01 TAPE-OUT` → `02 REF` → `03 SILENT COPY`.

**0:10–0:16 — Trace it back.** Cut to `03-traceback-34-hover`. Draw lume dust along the existing right-angle trace from #34 (pink) into #4 (gold). Hold the tags “#34 · silent copy” and “#4 · likely original.” On-screen: “Same bytes. No REF back.” VO ends this beat on “You trace it back.”

**0:16–0:21 — What it is.** Brief type-led card on `#0B0B0B`, or a tight crop of the hero plus a line of Geist. On-screen, three short lines: `FREE` · `READ-ONLY` · `NO WALLET`. VO: “Traced is a free, read-only lookup for TapeOut circuits on X Layer. No wallet. No sign-up.”

**0:21–0:26 — Lineage.** `04-lineage-12` in a device frame, slow push toward the #12 node and its three parents. On-screen mono: `CEREBR #12` / `11 REF USES` / `3 PARENTS`. VO: “Paste an ID and follow the lineage.”

**0:26–0:32 — Copy-twins.** Start on `05-copy-34-vs-4` (“#34 is byte-for-byte #4”), then wipe or match-cut to `06-copy-4-vs-34-likely-original` (“#4 is the likely original of #34”). A trace line should run from #34 to #4. On-screen footnote in `#7E847C` Geist Mono, small: “Likely original = earliest tape-out. A hint, not a verdict.” VO: “Flag copy-twins: same netlist bytes, different owner, no credit back.”

**0:32–0:38 — Replay.** `07-replay-4-vs-34`: punch the **4/4** tally, four rows ticking to match in `#C8FF6A`. Then `08-latch-replay-14-vs-35`: hold **24/24**, a short stepped count if you can do it without inventing rows that aren’t in the still. On-screen: `4 / 4` then `24 / 24 · STEP()`. VO: “Then replay it in your browser. Four of four. Latches, stepped tick by tick: twenty-four of twenty-four.”

**0:38–0:45 — End card.** Hard cut to `#0B0B0B`. Centre the lume mark, then the wordmark. Under it, Geist Mono, `#A6ABA3`: `traced-mu.vercel.app` and `@TracedXyz`. Tagline under that, Host Grotesk, with **source** in `#C8FF6A`. Hold at least 2 seconds after the last word. No QR code, no “link in bio,” no DeWEB, no wallet.

## Hard rules (do not break)

- Do not invent user counts, revenue, traction, waitlists, or partnerships.
- Never say “private.” If you mention visibility, do not. This product is a public lookup.
- Do not claim DeWEB, FabX, TapeCode, TapeKit, TapeSend, or that the site is already on-chain hosted.
- “Likely original” is timing (earliest tape-out block), **not** proof, not a verdict, not “the real owner.”
- Do not say Traced counts how often a circuit is run. Replay is a free view call and leaves no on-chain trace.
- Do not show a wallet, a connect button, a sign-up, or a paywall.
- Do not add testimonials, fake cursors clicking through the live site, or UI chrome that isn’t in the stills.
- Do not stretch or heavily recolor the screenshots. Subtle grade to match `#0B0B0B` is fine.

## Render specs

- 30 fps, H.264 (`yuv420p`), `.mp4`, +faststart.
- 1080×1920 and 1920×1080. Optionally also 4K 16:9 if cheap.
- Peak around −1 dBFS, VO clear over music, loudness around −14 LUFS.
- Export: `traced-promo-9x16.mp4`, `traced-promo-16x9.mp4`, plus a VO stem and a music stem if you generate them.
- Safe margins: 80px (16:9) and 120px top/bottom (9:16) so type is not cropped by X UI.

Build it, preview the cuts against the VO, and give me the two MP4s.
