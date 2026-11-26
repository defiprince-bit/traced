# Traced demo script — under 3 minutes

Target length: **about 2:45** (stay under the 3:00 limit). Built for a tday capture: the opening scrolls the landing Story so the narration matches each reveal; after that, jump by URL. Skip the Badges pin-section. Narration is written to be read aloud; on-screen notes say what to show.

Live origin: `https://traced-mu.vercel.app`

Cerebr (all demo routes below): `0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff`

The tday capture token used for the Vouch demo expired on 20 Nov 2026. Use a fresh token tomorrow; do not paste it in chat.

## Beats covered

1. The problem
2. Core features, shown on real circuits
3. Target users and the business model
4. How Traced uses TapeOut
5. Close / where to try it

## Before you record

- Desktop, 1440×900 or similar, dark room, no bookmarks bar clutter.
- Start logged out of everything; Traced has no wallet and no sign-up — leave it that way.
- Prefetch the five demo routes once so the index and RPC calls are warm:
  - `/#/` landing hero (scroll once through Story and Trace-back so the animations are warm)
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12?view=lineage`
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/34?vs=4&view=copy`
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34&view=replay`
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/14?vs=35&view=replay`
- Optional warmup: `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/3` (library cell, 109 citations) if there is time at the end of beat 2.
- If a lookup is still spinning, wait; do not talk over a loading state.

## Script

### 0:00–0:40 — The problem (scroll the story)
**On screen:** start on `https://traced-mu.vercel.app/#/` at the hero. Scroll **slowly and steadily** (mouse wheel or trackpad, no jumps) so each line lands on the matching visual:
1. **Hero** (hold ~3s): “Every circuit, traced back to its source.” with the A · source / B · reuse or copy? tags.
2. **Story** (pinned section, keep scrolling at an even pace): headline “Every circuit leaves a trace,” then steps 01 → 02 → 03 reveal one by one.
3. **Trace-back**: stop here, hover **#34**, and let the dust run back to **#4** as it lights up as the likely original.

**Say** (one line per step, timed to the reveal):
> *(hero)* On TapeOut, every circuit is built from NAND and latch gates, and lives on-chain.
> *(step 01)* A circuit is taped out: its netlist bytes and its owner go on-chain.
> *(step 02)* Someone reuses it by REF, and the credit is written into their bytes.
> *(step 03)* Or someone copies it silently. Same bytes, no REF back, no trail.
> *(trace-back, hover #34)* So how do you find the real source? You trace it back.

### 0:40–0:50 — What Traced is
**On screen:** keep scrolling into **What you see** (“One lookup. Six answers.”), then stop.

**Say:**
> Traced is a free, read-only lookup for TapeOut circuits on X Layer. No wallet, no sign-up. Paste an ID and follow the lineage, flag copies, and replay it in your browser.

### 0:50–1:12 — Lineage (core feature)
**On screen:** jump to
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12?view=lineage`
Wait for the family tree. Pan or expand one level if needed, then hold.

**Say:**
> Here is Cerebr circuit 12, a line detector. The tree shows what it was built on: eleven REF uses, across three parents. Credit is part of the netlist, and Traced just reads it.

### 1:12–1:35 — Copy-twins (core feature)
**On screen:** jump to
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/34?vs=4&view=copy`
Hold on the copy-check of #34 vs #4.

**Say:**
> Circuit 4 is the official six-NAND XOR. Circuit 34 has the same netlist bytes, a different owner, and no REF back. Identical bytes cannot contain a REF to each other, so this is a copy-twin group. Traced marks 4 as the likely original because it was taped out earlier — that is timing, not a verdict.

### 1:35–2:05 — Replay, including latches (core feature)
**On screen:** first, same circuits in replay:
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34&view=replay`
Wait until the table shows 4 of 4. Then jump to the latch demo:
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/14?vs=35&view=replay`
Wait for 24 of 24.

**Say:**
> Replay runs in your browser, over a free view call, and compares every row with a twin. Four of four, 34 versus 4. Circuits with latches cannot use eval, so Traced steps them tick by tick. Circuit 14 matches its twin, 35, on twenty-four of twenty-four steps. Those free calls leave no trace on-chain, so Traced never counts usage.

### 2:05–2:25 — Who it’s for, and how it could earn money
**On screen:** jump back to `https://traced-mu.vercel.app/#who` (the “Who it’s for” block). Do not scroll further.

**Say:**
> It’s for circuit builders who want credit when their work is reused, processor owners spotting copies, judges checking originality, and anyone picking a library cell. The lookup stays free. If it charges later, it would be for alerts and a fresh index — the public census is a snapshot — not for usage counts we cannot see.

### 2:25–2:42 — How it uses TapeOut
**On screen:** stay on the landing, or jump to the lookup of #12 if you want the processor name visible. Do not open a wallet.

**Say:**
> Traced reads existing TapeOut circuits on X Layer mainnet. It talks to the official factory and processors like Cerebr, and it only uses view calls: netlist, owner, eval, and step. It never takes custody of a circuit. The site is traced-mu.vercel.app, and we’re at TracedXyz.

### 2:42–2:45 — End
**On screen:** hero, or a simple end card if tday adds one: `traced-mu.vercel.app` and `@TracedXyz`.

**Say:**
> Every circuit, traced back to its source.

## Timing check

Read-aloud length is about 390 words, roughly 2:30–2:45 at a calm pace. If a replay is slow, trim the second sentence of the lineage beat or the “What Traced is” line, not the honesty line about usage, and not the users/business or TapeOut beats — those are required.

## What not to say

- Do not invent user counts, revenue, or “people already pay.”
- Do not call “likely original” a proof or a verdict.
- Do not claim Traced counts how often a circuit is run.
- Do not say it already uses DeWEB, FabX, TapeCode, TapeKit or TapeSend.
- Do not show, or ask anyone to sign, a wallet.
