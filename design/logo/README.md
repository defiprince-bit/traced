# Traced mark — v1 (11 Nov 2026)

Source: Douglas's reference (`/workspace/traced-refs/logo-ref.jpg`). It was retraced into a smooth signed-distance field, then fitted to G1-continuous cubic béziers. Each mark is one compound `<path>` with `fill-rule="evenodd"`, and the holes are real cutouts. Nothing is raster.

**Recommended: C (source via)**, which is `mark.svg`.

| Variant | What changes | Read |
|---|---|---|
| A — via ring (`mark-a.svg`) | A concentric via dot sits inside the centre hole | Reads as a PCB via or target at large sizes. Clogs to a grey blob at 24px and below. |
| B — SMD pad (`mark-b.svg`) | The long right arm flares into a rounded-square pad instead of a round blob | The most obviously "circuit" option. It's the biggest change to the silhouette. |
| **C — source via** (`mark-c.svg`) | The big upper-left terminal is drilled like a via | **The story:** the circuit's origin pad is marked, so it's traced back to its source. It's the smallest silhouette change, and the drill stays open down to 24px. |

Colour: lume `#C8FF6A` (`--lume` in `src/tokens.css`) on `#0B0B0B` (`--bg`). Wordmark `#F2F4EF`, secondary `#7E847C`.

## Files
- `mark.svg` (C, black), `mark-a/b/c.svg`
- `mark-green.svg`, `mark-mono-white.svg`, `mark-on-dark.svg` (+ `.png` @1024)
- `mark-small-32.svg` / `mark-small-16.svg`: optically thickened cuts for 32px and below (the 16px cut drops the drill)
- Lockups (wordmark in Host Grotesk 600, -0.03em, converted to outlines; secondary in Geist Mono 500 caps +0.08em):
  `lockup-on-dark.svg`, `lockup-black.svg`, `lockup-white.svg`, `lockup-tapeout-on-dark.svg`, `lockup-tapeout-black.svg`, plus `*-tile.svg/png` previews on a #0B0B0B tile
- `favicon.svg` (32px cut), `favicon-16.png`, `favicon-32.png`, `favicon-180.png` (square, iOS rounds it), `favicon-512.png`
- `x-avatar-400.png`: full-bleed dark square with the mark kept inside X's circle crop
- `logo-sheet.png`: the reference vs A/B/C on white and dark, the lockups, and small-size tests at 16, 24 and 32px

## Use
- Clear space: the height of the centre hole on every side. Minimum size: 16px using the small cut. Use the full mark from 48px up.
- Don't recolour the mark outside lume, black, or white. Don't add strokes, glows, or rotation; it's already tilted.
- `<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/favicon-180.png">`

## Rebuild
`cd _build && python3 gen.py && python3 build.py && python3 mksheet.py`. This needs scipy, scikit-image, cairosvg, uharfbuzz and fonttools. Host Grotesk (OFL) is in `_build/`. To switch the recommendation, set `REC` in `build.py` (the favicon cuts are C-only).
