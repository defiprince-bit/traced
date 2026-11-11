# Traced design: NOTES for DevOps (11 Nov 2026)

How Douglas's direction and the brief were applied. Please raise §3 with Douglas.

## 1. Applied as given
- Logo **deferred**: the placeholder wordmark "Traced" only, with no mark (`logo-wordmark.svg`).
- Landing in ref1 language: #0B0B0B, hairline grid, crosshair marks, hatch on the hero-left panel, mono uppercase nav with "/" prefixes, a big grotesk headline (Host Grotesk) with a mono pill above, ghost and solid lume buttons, a right panel with a mono status label and a dotted bar meter, and a bottom stats strip.
- A lighter acid green: **#C8FF6A** (16.8:1 on bg; text on it is #0B0B0B), tested by script.
- Hero visual: two interactive voxel dot-cubes with dust along right-angle PCB paths in Canvas2D. Pointer or touch tilts them; hover or tap streams the dust to the other cube. Fewer particles on mobile, static under reduced motion.
- The video flow (`traced-refs/video-flow-notes.md`) as 8 sections: sticky blurred header, 50/50 hero, pinned reveal with parallax substrate and blurred widgets, 2×3 features with count-ups, horizontal sticky badge cards, sticky device crossfade, 3D trace-back hover, honesty grid, CTA with CID input, chips and floating cube, then the footer.
- App: ref2 findings shell (sidebar, filter list, wireframe sphere empty state "Nice, no silent copies found") and ref3 radial lineage with a right detail panel (badge, gates, owner, tx, replay).
- The five functional parts are present on every circuit view (design.md §3).
- Mobile: swipe carousel, stacked device frames, lower particle counts, reduced-motion static frames.

## 2. Adapted or set aside, and why
| Instruction | What we did | Why |
|---|---|---|
| ref1 partner-logo row | **Dropped** | Brief: no OKX, X Layer, TapeOut or third-party logos (trademark; we're not affiliated). The footer disclaimer covers it. |
| ref1 stats strip (big marketing numbers) | Kept the strip, **replaced the numbers with honest facts**: gate types NAND · LATCH, default processor Cerebr, usage counted None, transactions sent 0 | No fabricated stats. Each one is true and serves the honesty story. |
| ref1 status label wording | Our own words: "Trace · read-only", cube tags "A · source" / "B · reuse or copy?" | Douglas asked for our own wording. |
| Video-flow count-ups | Only real example values from the Traced index (11 REFs on #12, 2 identical netlists #4/#34, 4/4 rows match, #4 earliest, 0 usage), each tagged **Example** | No fabricated stats; example data labelled. |
| "11 REFs on #12" | Shown as **11 REF uses across 3 parents** (#9 ×8, #10 ×2, #2 ×1). The tree shows 11 use-leaves grouped by parent (desktop) or 3 grouped rows (mobile). | The index has 11 REF elements but only 3 distinct parent circuits. "11 REFs" stays true without implying 11 different sources. |
| Badges: "Toy, Wrapper, Library, Miner" | Cards say **Miner-sized**; Composed and Flat are mentioned and used in the app | `classify.ts` names the class `miner-sized` (size only, not proof of mining) and has 6 classes. Calling it "Miner" would overclaim. |
| Earlier v0 direction (copper accent, italic serif headline) | Superseded and moved to `_superseded-v0/` | Douglas's later direction: grotesk, black and green. |
| Cube/dust metaphor | Decorative only, never bound to data | Particles that looked like usage would imply a count we can't have. |
| Device showcase | Uses live iframes of the mock app views, not screenshots | Stays in sync with the app mock; production can swap in images. |
| Motion | Colour transitions removed from CSS; opacity and transform only | Brief rule. State colour changes are instant. |

## 3. Real conflicts and open questions (please raise with Douglas)
1. **Acid green vs "distinct from Firsto".** Firsto is dark with a teal-green. We kept Douglas's green but pushed it yellow (#C8FF6A, hue ≈ 82° against Firsto's ≈ 160°), paired it with gold and pink verdicts, and used no teal anywhere. If judges see Firsto and Traced side by side, "dark plus green" is the overlap. Fallback if needed: make gold `--orig` the primary accent.
2. **Logo.** Douglas said deferred, so the mocks use the wordmark only. A mark exploration now exists in `design/logo/` (A/B/C variants retraced from `traced-refs/logo-ref.jpg`, recommending C, with favicons and an X avatar). It came from a separate workstream and is **not** wired into these mocks. Douglas should confirm whether it replaces the placeholder; if so, swap `.wm` in the header, app sidebar and footer.
3. **"Miner" vs "Miner-sized"** (above): does the brief require the shorter label? We recommend keeping the code's label.
4. **#34 has no indexed tape-out block**, so "likely original" for #4 is picked **by ID on the same processor**, not by block. The UI says so. If DevOps indexes #34's tx, the basis line should switch to "by block".
5. **#5's replay comparison against #4** is a user-picked pairing ("you picked: official XOR"), not an automatic twin. The UI labels it that way.
6. **#3 has no name** in the index; it's shown as "#3 · Library" with no title.
7. **Pinned scroll length** (story 240vh, badges 340vh) may feel long in a 2–3 minute demo video. Shorten both by about 30% for recording, or record with `#f=` jumps.

## 4. Nothing outbound
No messages were sent. App code in `/workspace/traced/src` is untouched.
