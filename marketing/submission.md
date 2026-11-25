# Traced — Google Form answers (copy-paste)

Use these in the official [Build X](https://web3.okx.com/xlayer/build-x-series) Google Form. Deadline: **7 Dec 2026, 23:59 UTC** (00:59 WAT on 8 Dec). Do not submit until the demo video is ready and Douglas has reviewed this text.

Every figure below is from the README or the on-chain index. Nothing here claims users, revenue, or traction.

## Repo visibility (read this first)

The GitHub repo **https://github.com/defiprince-bit/traced** is **private**. The live site and this write-up are enough for a website/tool submission, but judges who want to read the code will be blocked unless the repo is opened or they are added as guests.

Do not change visibility from this kit. If Douglas wants judges to see the source, either:

- make the repo public before submitting, or
- add the addresses the organizers name as collaborators.

## Project name

```
Traced
```

## One-liner

```
A read-only lookup for TapeOut circuits on X Layer: lineage, copy-twins, and a free in-browser replay, traced back to the source.
```

## Live link

```
https://traced-mu.vercel.app
```

## X account

```
https://x.com/TracedXyz
```

## Repository

```
https://github.com/defiprince-bit/traced
```

(Private as of 25 Nov 2026. See the note at the top.)

## Demo pages (optional extras if the form has a video or links field)

```
https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/5?vs=4
https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12
https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34
https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/3
https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/14?vs=35
```

## Description

Paste the block below into the project/service description field. It covers the product, target users and how we will reach them, the proposed revenue model, why someone would pay and keep using it, which TapeOut features Traced uses, the relevant addresses, the live link, and the work done during the event.

```
Traced is a read-only lookup for TapeOut circuits on X Layer mainnet (chain 196). You pick a processor, enter a circuit ID, and see the owner, pins, gate count and netlist hash; the REF parents it was built on; the REF children that cite it; byte-identical copy-twins (same netlist, no REF between them); a class label (library, wrapper, toy, miner-sized, composed or flat — Traced heuristics, not protocol labels); and a free in-browser replay. Combinational circuits run with eval(); circuits with latches run with step(). Both are view calls. Nothing is signed or sent, and there is no wallet or sign-up.

The problem: a TapeOut circuit can reuse another by REF, which writes the credit into the bytes, or it can be taped out as a byte-for-byte copy with no citation. From the circuit itself, a silent copy leaves no trail. Traced makes that visible. “Likely original” inside a twin group is timing (tape-out block, or lowest ID on one processor), not a verdict. Usage is never counted, because free eval() and step() calls leave no on-chain trace.

Live site: https://traced-mu.vercel.app
X: https://x.com/TracedXyz
Repo: https://github.com/defiprince-bit/traced (currently private)

Target users, and how we will reach them:
- Circuit builders who want credit when others reuse their work, and a way to see silent copies of the same netlist bytes.
- Processor owners and curators who want to spot identical netlists on their processor and across the official-factory census.
- Judges and leaderboards who need to check originality before ranking a circuit.
- Developers choosing library cells who want to see a cell’s REF family, and how often it is already cited, before they reuse it.

We will reach them through the TapeOut and X Layer communities on X and Telegram, the @TracedXyz account, and the shareable lookup links already in the app. Embeddable badges are planned, not shipping today.

Proposed revenue model (not live today). The core lookup stays free. Planned paid work is an API and indexer access, plus copy or citation alerts (“someone reused or copied your circuit”), for builders and processor owners who want a fresher index than the public snapshot. Later, optional attribution or royalty rails could let credited REF reuse carry a payment; that is a direction, not a shipped feature.

Why someone would pay and keep using it: the public index is a snapshot, currently X Layer block 75,628,053 (11 Nov 2026), covering 11,749 official-factory circuits, with 1,514 REF uses and 345 twin groups. Alerts and a maintained index are only useful if they stay current. That is the retention loop. Traced will not sell usage counts.

TapeOut features used: Traced is a read-only client of existing TapeOut circuits and their on-chain data on X Layer. It does not use DeWEB, FabX, TapeCode, TapeKit or TapeSend. It reads the official processor factory and the circuits minted through it, and on each processor it calls the view methods netlist(id), circuitInfo(id), ownerOf(id), eval(id, inputs) and step(id, state, inputs) over eth_call. REF parents are decoded from the on-chain netlist bytes. Cited-by children and copy-twins come from the prebuilt official-factory index.

Relevant addresses (X Layer mainnet):
- Official factory: 0x1f09daefa827f02cbb40967cc91b259763760761
- Cerebr (default demo processor): 0xB04EB79D1A5EECaabAAfF7B77d7c27578EE693FF
- 9898: 0x60918c204f3c94630d3d793738fc36293c8405d6
- TAPELIQUID: 0x69f663931209096037474d7c20402232e5c762ca
- FAB-Genisis: 0x87bfca3494aa228ff589ab9b642143a5e8c8f9a6

Work during the event (16 Oct – 7 Dec 2026): Traced is a new project, not a pre-existing product. The first commit is dated 11 Nov 2026. Through 25 Nov 2026 the repository includes circuit lookup, a multi-level REF family tree, copy-twin grouping, free eval() replay, latch replay with step(), an official-factory index of 11,749 circuits (including the previously skipped large processors 9898, TAPELIQUID and FAB-Genisis), the landing page and brand, and the public site above.
```

## TapeOut features used (standalone field)

If the form has a separate field for ecosystem projects or features:

```
Traced is a read-only client of TapeOut circuits and on-chain data on X Layer mainnet (chain 196). It does not use DeWEB, FabX, TapeCode, TapeKit or TapeSend.

It reads the official processor factory 0x1f09daefa827f02cbb40967cc91b259763760761 and the circuits minted through it. On each processor it calls netlist(id), circuitInfo(id), ownerOf(id), eval(id, inputs) and step(id, state, inputs) over eth_call — nothing is signed or sent. REF parents are decoded from the on-chain netlist. Cited-by children and copy-twins come from a prebuilt index of the official-factory census at block 75,628,053 (11,749 circuits).

Demo processor (Cerebr): 0xB04EB79D1A5EECaabAAfF7B77d7c27578EE693FF
Also cited in the index and README: 9898 0x60918c204f3c94630d3d793738fc36293c8405d6, TAPELIQUID 0x69f663931209096037474d7c20402232e5c762ca, FAB-Genisis 0x87bfca3494aa228ff589ab9b642143a5e8c8f9a6.
```

## Relevant addresses (standalone field)

```
X Layer mainnet (chain 196)

Official factory:
0x1f09daefa827f02cbb40967cc91b259763760761

Cerebr (default demo processor):
0xB04EB79D1A5EECaabAAfF7B77d7c27578EE693FF

9898:
0x60918c204f3c94630d3d793738fc36293c8405d6

TAPELIQUID:
0x69f663931209096037474d7c20402232e5c762ca

FAB-Genisis:
0x87bfca3494aa228ff589ab9b642143a5e8c8f9a6
```

## New work during the event (standalone field)

```
Traced is a new project built during the X Layer TapeOut Accelerate window (16 Oct – 7 Dec 2026), not a pre-existing product. The first commit is dated 11 Nov 2026. Through 25 Nov 2026 the work includes: circuit lookup; a multi-level REF family tree; copy-twin grouping (byte-identical netlists with no REF between them); free in-browser eval() replay; latch-circuit replay with free step() calls; an official-factory index of 11,749 circuits at X Layer block 75,628,053, including the previously skipped large processors 9898, TAPELIQUID and FAB-Genisis; the landing page and brand; and the public site at https://traced-mu.vercel.app.
```
