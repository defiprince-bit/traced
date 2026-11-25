# Traced demo script — under 3 minutes

Target length: **about 2:45** (stay under the 3:00 limit). Built for a tday capture: jump by URL, do not scroll the long landing pin-sections (Story / Badges). Narration is written to be read aloud; on-screen notes say what to show.

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
  - `/#/` landing hero
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12?view=lineage`
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34&view=copy`
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34&view=replay`
  - `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/14?vs=35&view=replay`
- Optional warmup: `/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/3` (library cell, 109 citations) if there is time at the end of beat 2.
- If a lookup is still spinning, wait; do not talk over a loading state.

## Script

### 0:00–0:22 — The problem
**On screen:** `https://traced-mu.vercel.app/#/` (hero only; do not scroll).

**Say:**
> On TapeOut, a circuit can reuse another by REF — that credit is written into the bytes. Or someone can tape out a byte-for-byte copy, with no citation back. From the circuit itself, a silent copy leaves no trail. So how do you find the real source?

### 0:22–0:38 — What Traced is
**On screen:** same hero. Cursor can rest on “Trace a circuit,” but do not click yet.

**Say:**
> Traced is a read-only lookup for TapeOut circuits on X Layer. No wallet, no sign-up, nothing signed or sent. Paste an ID and you can follow the lineage, flag identical copies, and replay the circuit for free in your browser.

### 0:38–1:05 — Lineage (core feature)
**On screen:** jump to
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12?view=lineage`
Wait for the family tree. Pan or expand one level if needed, then hold.

**Say:**
> Here is Cerebr circuit 12, a line detector. The tree shows what it was built on: eleven REF uses, across three parents. Ancestors on one side, the circuits that cite it on the other. Credit is part of the netlist, and Traced just reads it.

### 1:05–1:32 — Copy-twins (core feature)
**On screen:** jump to
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34&view=copy`
Hold on the copy-check of #4 vs #34.

**Say:**
> Circuit 4 is the official six-NAND XOR. Circuit 34 has the same netlist bytes, a different owner, and no REF back. Identical bytes cannot contain a REF to each other, so this is a copy-twin group. Traced marks 4 as the likely original because it was taped out earlier — that is timing, not a verdict.

### 1:32–2:05 — Replay, including latches (core feature)
**On screen:** first, same circuits in replay:
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34&view=replay`
Wait until the table shows 4 of 4. Then jump to the latch demo:
`https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/14?vs=35&view=replay`
Wait for 8 of 8.

**Say:**
> Replay runs in your browser, over a free view call, and compares every row with a twin. Four of four, 34 versus 4. Circuits with latches cannot use eval, so Traced steps them tick by tick. Circuit 14 matches its twin, 35, on eight of eight rows. Those free calls leave no trace on-chain, so Traced never counts usage.

### 2:05–2:25 — Who it’s for, and how it could earn money
**On screen:** jump back to `https://traced-mu.vercel.app/#who` (the “Who it’s for” block). Do not scroll further.

**Say:**
> It’s for circuit builders who want credit when their work is reused, processor owners spotting copies, judges checking originality, and anyone picking a library cell. The lookup stays free. If it charges later, it would be for alerts and a fresh index — the public census is a snapshot — not for usage counts we cannot see.

### 2:25–2:42 — How it uses TapeOut
**On screen:** stay on the landing, or jump to the lookup of #12 if you want the processor name visible. Do not open a wallet.

**Say:**
> Traced reads existing TapeOut circuits on X Layer mainnet. It talks to the official factory and processors like Cerebr, and it only uses view calls: netlist, owner, eval, and step. It does not take custody of a circuit, and it does not yet sit on DeWEB or the other ecosystem tools. The site is traced-mu.vercel.app, and we’re at TracedXyz.

### 2:42–2:45 — End
**On screen:** hero, or a simple end card if tday adds one: `traced-mu.vercel.app` and `@TracedXyz`.

**Say:**
> Every circuit, traced back to its source.

## Timing check

Read-aloud length is about 390 words, roughly 2:30–2:45 at a calm pace. If a replay is slow, trim the second sentence of the lineage beat, not the honesty line about usage, and not the users/business or TapeOut beats — those are required.

## What not to say

- Do not invent user counts, revenue, or “people already pay.”
- Do not call “likely original” a proof or a verdict.
- Do not claim Traced counts how often a circuit is run.
- Do not say it already uses DeWEB, FabX, TapeCode, TapeKit or TapeSend.
- Do not show, or ask anyone to sign, a wallet.
