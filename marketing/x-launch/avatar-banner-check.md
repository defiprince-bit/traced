# Avatar and banner check for X

Inspected the brand-kit originals, measured pixels, and rendered desktop and mobile profile-header mockups. Every render was checked visually. **Both assets pass. No remakes.**

Source files (also copied into this folder):

- `/workspace/traced/design/brand-kit/x-avatar-400.png`
- `/workspace/traced/design/brand-kit/x-banner-1500x500.png`

## Avatar — pass

- Size: **400×400**, square PNG, RGB.
- The lime mark (Mark A) sits on `#0B0B0B`.
- Circle crop: no bright pixel falls outside the inscribed circle. The mark’s maximum radius from centre is about **133px**, leaving about **67px** of clearance to the circle edge (and none of it within 8px of the edge). All four arms stay comfortably inside the crop.
- Proofs: `avatar-circle-crop.png` (square vs circle) and the circle avatar overlay on both header mockups.

## Banner — pass

- Size: **1500×500**, 3:1 PNG, RGB. The brand kit already kept the left side clear for the avatar.
- Key content bounding box (logo, wordmark, tagline): **x=793–1338, y=164–422** for the logo and wordmark; tagline sits above y=422. Content starts 94px from the top and ends 77px from the bottom.
- Desktop avatar overlap (left 25% of the lower half, x=0–375, y=250–500): no key content. The only non-grid pixels in that zone are the faint `#5A6058` crosshair at (200, 400), which is decoration, not a lockup or tagline. On the desktop mockup the circle avatar sits in this empty left grid and does not cover “Traced” or the tagline.
- Mobile crop (about 60px off the top and bottom): **zero** key-content pixels in y=0–60 or y=440–500. The wordmark and tagline remain fully visible after the crop, which the mobile mockup confirms.

## Mockups in this folder

| File | What it shows |
|---|---|
| `profile-header-desktop.png` | X-style desktop profile header, 1500px wide, circle avatar overlapping the lower-left of the 1500×500 banner, plus the draft display name, bio, location and website placeholder. |
| `profile-header-mobile.png` | X-style mobile header at 3× of a 390px-wide screen. Banner cropped 60px from the top and bottom of the source, then scaled, with the circle avatar overlay. |
| `banner-safe-areas.png` | Source banner with guides: mobile crop strips, desktop avatar-overlap rectangle, and the mobile safe band (y=60–440). |
| `avatar-circle-crop.png` | 400×400 avatar with the circle crop drawn on top. |

The mockups use Host Grotesk, Geist and Geist Mono, on a lights-out X chrome (`#000000`) so they sit next to the `#0B0B0B` banner. The handle shown is the recommended placeholder `@TracedXyz`.

## What was not remade

`avatar-x.png` and `banner-x.png` were not created, because the brand-kit files already meet the size, square, circle-crop, left-overlap and mobile-safe-area rules.
