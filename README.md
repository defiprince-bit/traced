# Traced, for TapeOut

**Every circuit, traced back to its source.**

Traced is a read-only lookup for [TapeOut](https://tapeout.pro) circuits on **X Layer mainnet** (chain 196). Pick a processor, enter a circuit ID, and see:

- **Facts:** owner, pins, flattened gate count, netlist keccak256, and the tape-out transaction where known.
- **Built on (REF parents):** decoded live from the on-chain netlist.
- **Cited by (REF children):** from a prebuilt index of the official-factory census.
- **Copy-twins:** every indexed circuit with the exact same netlist bytes (same keccak256). Identical bytes can't contain a REF to each other, so a twin group is a set of copies with no citation between them. The earliest tape-out is marked as the *likely original* (by tape-out block when every member has one, otherwise by lowest ID on a single processor).
- **Class:** `library`, `wrapper`, `toy`, `miner-sized`, `composed` or `flat` (rules below).
- **Replay:** runs `eval()` for free in your browser over `eth_call`, prints the truth table, and compares it row by row with a twin, a parent, or any circuit you pick.

Live site: [https://traced-mu.vercel.app](https://traced-mu.vercel.app)

Demo pages (Cerebr, `0xB04EB79D1A5EECaabAAfF7B77d7c27578EE693FF`):

| Page | What it shows |
|---|---|
| `https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/5?vs=4` | XOR built from 3 REFs (#2 OR, #3 NAND, #1 AND); replay matches flat XOR #4 on all 4 inputs |
| `https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12` | Line detector with 11 REFs (#9 ×8, #10 ×2, #2) |
| `https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34` | The original 6-NAND XOR, with a byte-identical copy (#34, different owner, no REF) |
| `https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/3` | A 1-NAND library cell cited 109 times |
| `https://traced-mu.vercel.app/#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/14?vs=35` | A circuit with latches, replayed with free `step()` calls: 8/8 match with twin #35 |


## Who it's for

- **Circuit builders** who want credit when others reuse their work, and a way to see silent copies of the same netlist bytes.
- **Processor owners and curators** who want to spot identical netlists on their processor and across the official-factory census.
- **Judges and leaderboards** who need to check originality before ranking a circuit.
- **Developers picking library cells** who want to see a cell's REF family, and how often it is already cited, before they reuse it.

How we'll reach them: the TapeOut and X Layer communities on X and Telegram, the [@TracedXyz](https://x.com/TracedXyz) account, and the shareable lookup links already in the app (`#/<processor>/<id>`). Embeddable badges are a planned follow-on, not shipping today.

## Business model

The core lookup stays free: no wallet, no sign-up, and no charge to read a circuit, follow its lineage, check copy-twins, or replay it in the browser.

Proposed revenue, not live today:

1. **Paid API and indexer access**, plus **copy or citation alerts** ("someone reused or copied your circuit"), for builders and processor owners who want a fresher index than the public snapshot and a ping when the graph around their circuits changes.
2. **Later: attribution or royalty rails for REF reuse** — optional infrastructure so credited reuse can carry a payment. This is a direction, not a shipped feature.

Why someone would pay and keep using it: the public site is a snapshot (currently X Layer block **75,628,053**, 11 Nov 2026). Alerts and a maintained index are only useful if they stay current; that's the retention loop. Traced does not sell usage counts — `eval()` and `step()` leave no on-chain trace.

## TapeOut features used

Traced is a read-only client of TapeOut circuits on **X Layer mainnet** (chain 196). It does not use DeWEB, FabX, TapeCode, TapeKit or TapeSend.

It reads the official processor factory and the circuits minted through it:

| What | Address |
|---|---|
| Official factory | `0x1f09daefa827f02cbb40967cc91b259763760761` |
| Cerebr (default demo processor) | `0xB04EB79D1A5EECaabAAfF7B77d7c27578EE693FF` |
| 9898 | `0x60918c204f3c94630d3d793738fc36293c8405d6` |
| TAPELIQUID | `0x69f663931209096037474d7c20402232e5c762ca` |
| FAB-Genisis | `0x87bfca3494aa228ff589ab9b642143a5e8c8f9a6` |

On each processor it calls the view methods `netlist(id)`, `circuitInfo(id)`, `ownerOf(id)`, `eval(id, inputs)` and `step(id, state, inputs)` over `eth_call` (nothing is signed or sent). REF parents are decoded from the on-chain netlist bytes. Cited-by children and copy-twins come from a prebuilt index of the official-factory census at block 75,628,053 (11,749 circuits). The addresses above are the factory plus the processors the demos use; the rest of the census is in `public/data/index.json`.

## Built during the event

Traced is a new project, started and built during the X Layer TapeOut Accelerate window (16 Oct – 7 Dec 2026). The first commit is dated **11 Nov 2026**. Work in this repository through **25 Nov 2026** includes:

- Circuit lookup, REF lineage (a multi-level family tree), copy-twin grouping, and free in-browser `eval()` replay
- An official-factory index of 11,749 circuits at block 75,628,053, including the previously skipped large processors 9898, TAPELIQUID and FAB-Genisis
- Latch-circuit replay with free `step()` calls
- The landing page, brand, and the public site at [https://traced-mu.vercel.app](https://traced-mu.vercel.app)

It is not a pre-existing product with a thin event wrapper.

## Class rules (Traced heuristics, not protocol labels; first match wins)

| Class | Rule |
|---|---|
| `library` | Cited by at least one other circuit through a REF |
| `wrapper` | Only REF elements, zero NAND/LATCH of its own |
| `toy` | 1–3 NAND/LATCH gates and no REF |
| `miner-sized` | Flattened gateCount ≥ 1,000 and no REF. Size only, not proof of mining |
| `composed` | Own NAND/LATCH gates plus at least one REF |
| `flat` | Anything else: own gates, no REF |

## Honest limits

- **Usage is not counted.** `eval()` and `step()` are free view calls that leave no trace on-chain. Traced counts REF citations only and never claims run counts.
- **"Likely original" is timing, not a verdict.** Within a twin group, Traced takes the lowest id per processor (ids grow over time), then compares those across processors by tape-out block. Anyone can write a 1-NAND inverter independently, so toy twins are labelled "same bytes as", not "silent copy".
- **The index is a snapshot.** It covers **11,749** circuits — every circuit then on the official factory — at X Layer block **75,628,053** (11 Nov 2026): 1,514 REF uses and 345 twin groups. The three large processors that the research pass skipped are now included in full: 9898 (1,022), TAPELIQUID (1,387) and FAB-Genisis (6,953). Their circuit records live in lazily loaded `public/data/c/<cpu>.json` shards so the core `index.json` stays smaller. A later chain head had FAB-Genisis `nextId` 6,954 (one circuit after this snapshot); that circuit is not in the index. Tape-out transactions are still only known for 1,191 circuits (Cerebr and the earliest member of each twin group from the earlier block search) — most of the newly indexed circuits have no tape-out tx in the index yet, so some twin originals stay “unknown” across processors.
- **Tape-out transactions** are known for 1,191 circuits: all 38 on Cerebr (17 match the Cerebr catalog's verified receipts exactly) and the earliest member per processor of every twin group. They were found by binary-searching `nextId()` with historical `eth_call` and reading the `TapedOut` log in that one block, because the public RPC caps `eth_getLogs` ranges.
- **Sequential circuits** (with latches) can't be replayed with `eval()`, so Traced replays them with free `step()` calls instead, tick by tick, and compares the result with a twin (for example Cerebr #14 matches its twin #35 on 8 of 8 rows).
- Read-only: no wallet, no signing, no transactions.

## How it works

- Netlist format: `NAND = 00|a:u24|b:u24`, `LATCH = 01|d:u24`, `REF = 02|cpu:20B|id:u64|nIn:u8|nOut:u8|ins:u24*nIn` (`src/lib/netlist.ts`).
- Contract views: `netlist(id)`, `circuitInfo(id)`, `ownerOf(id)`, `eval(uint256,bytes)` (selector `0x934d06ea`), bits packed LSB-first (`src/lib/bits.ts`).
- RPC: `https://rpc.xlayer.tech` with `https://xlayerrpc.okx.com` fallback, batches of 10 (the public cap) via viem (`src/lib/xlayer.ts`).
- Styles are all in `src/styles.css` (tokens at the top, from the v1 design pack). Accent and logo are swapped in `src/brand.ts` (default accent `#C8FF6A`, placeholder wordmark) without touching the rest of the UI.
- Hash routes: `#/<cpu>/<id>?vs=<id>&view=lookup|lineage|copy|replay`. The landing lives at `#/` (and section hashes like `#story`). The `view` param is optional; existing `#/<cpu>/<id>?vs=` links still work.
- The Lineage view is a multi-level REF family tree (default depth 3 up and 3 down, collapsible, with a List toggle). Repeated citations stay grouped as a use count (e.g. #37 ×108). Wide fan-outs collapse to “+k more”.
- Notable newly indexed facts: every one of the 1,022 circuits on 9898 is a byte-identical 3-NAND toy (they sit in a 1,523-member twin group that also includes circuits on TAPELIQUID, FAB-Genisis and many smaller processors). TAPELIQUID #1238 is a wrapper that credits #1236 by REF. FAB-Genisis #6053 and #6147 similarly wrap #269 and #4206.

## Develop

```bash
npm install
npm run dev           # local app
npm test              # unit tests: REF decoding, classifier, twin grouping, bit packing, index facts
npm run build         # type-check + static build into dist/
npm run smoke         # headless Chrome check + screenshots into screens/ (needs `npm run preview` running)
```

Rebuild the index from the research dumps plus any skipped-processor cache:

```bash
npm run find-blocks     # optional: resolve tape-out blocks/txs (read-only, resumable, ~15 min)
npm run index-skipped   # optional: read-only eth_call census of FAB-Genisis, TAPELIQUID, 9898 (resumable, batches of 10)
npm run index           # writes public/data/index.json and public/data/c/<cpu>.json shards
```

`scripts/build-index.ts` reads `circuits.json`, `processors.json`, `receipts.json` and `summary.json` from `RESEARCH_DIR` (default `/workspace/tapelineage/research/data`), and merges `data-cache/skipped/*.jsonl` from `npm run index-skipped`. Indexing is historical `eth_call` only — nothing is signed or sent.

## License

MIT
