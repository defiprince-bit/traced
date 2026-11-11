# Traced, for TapeOut

**Every circuit, traced back to its source.**

Traced is a read-only lookup for [TapeOut](https://tapeout.pro) circuits on **X Layer mainnet** (chain 196). Pick a processor, enter a circuit ID, and see:

- **Facts:** owner, pins, flattened gate count, netlist keccak256, and the tape-out transaction where known.
- **Built on (REF parents):** decoded live from the on-chain netlist.
- **Cited by (REF children):** from a prebuilt index of the whole scanned census.
- **Copy-twins:** every indexed circuit with the exact same netlist bytes (same keccak256). Identical bytes can't contain a REF to each other, so a twin group is a set of copies with no citation between them. The earliest tape-out is marked as the *likely original* (by tape-out block when every member has one, otherwise by lowest ID on a single processor).
- **Class:** `library`, `wrapper`, `toy`, `miner-sized`, `composed` or `flat` (rules below).
- **Replay:** runs `eval()` for free in your browser over `eth_call`, prints the truth table, and compares it row by row with a twin, a parent, or any circuit you pick.

Demo pages (Cerebr, `0xB04EB79D1A5EECaabAAfF7B77d7c27578EE693FF`):

| Page | What it shows |
|---|---|
| `#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/5?vs=4` | XOR built from 3 REFs (#2 OR, #3 NAND, #1 AND); replay matches flat XOR #4 on all 4 inputs |
| `#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/12` | Line detector with 11 REFs (#9 ×8, #10 ×2, #2) |
| `#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/4?vs=34` | The original 6-NAND XOR, with a byte-identical copy (#34, different owner, no REF) |
| `#/0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff/3` | A 1-NAND library cell cited 109 times |

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
- **The index is a snapshot.** It covers **2,387** circuits on every processor with 1–500 circuits at X Layer block **75,628,053** (11 Nov 2026). FAB-Genisis (6,953), TAPELIQUID (1,387) and 9898 (1,022) are not indexed yet, so REF and twin counts (1,511 REF uses, 67 twin groups) are lower bounds. Circuits outside the index still load live, and their twin check still works by hash, but their children may be missing.
- **Tape-out transactions** are known for 1,191 circuits: all 38 on Cerebr (17 match the Cerebr catalog's verified receipts exactly) and the earliest member per processor of every twin group. They were found by binary-searching `nextId()` with historical `eth_call` and reading the `TapedOut` log in that one block, because the public RPC caps `eth_getLogs` ranges.
- **Sequential circuits** (with latches) can't be replayed with `eval()`. `step()` replay isn't in this MVP.
- Read-only: no wallet, no signing, no transactions.

## How it works

- Netlist format: `NAND = 00|a:u24|b:u24`, `LATCH = 01|d:u24`, `REF = 02|cpu:20B|id:u64|nIn:u8|nOut:u8|ins:u24*nIn` (`src/lib/netlist.ts`).
- Contract views: `netlist(id)`, `circuitInfo(id)`, `ownerOf(id)`, `eval(uint256,bytes)` (selector `0x934d06ea`), bits packed LSB-first (`src/lib/bits.ts`).
- RPC: `https://rpc.xlayer.tech` with `https://xlayerrpc.okx.com` fallback, batches of 10 (the public cap) via viem (`src/lib/xlayer.ts`).
- Styles are all in `src/styles.css` (tokens at the top, from the v1 design pack). Accent and logo are swapped in `src/brand.ts` (default accent `#C8FF6A`, placeholder wordmark) without touching the rest of the UI.
- Hash routes: `#/<cpu>/<id>?vs=<id>&view=lookup|lineage|copy|replay`. The landing lives at `#/` (and section hashes like `#story`). The `view` param is optional; existing `#/<cpu>/<id>?vs=` links still work.

## Develop

```bash
npm install
npm run dev           # local app
npm test              # unit tests: REF decoding, classifier, twin grouping, bit packing, index facts
npm run build         # type-check + static build into dist/
npm run smoke         # headless Chrome check + screenshots into screens/ (needs `npm run preview` running)
```

Rebuild the index from the research dumps:

```bash
npm run find-blocks   # optional: resolve tape-out blocks/txs (read-only, resumable, ~15 min)
npm run index         # writes public/data/index.json
```

`scripts/build-index.ts` reads `circuits.json`, `processors.json`, `receipts.json` and `summary.json` from `RESEARCH_DIR` (default `/workspace/tapelineage/research/data`).

## License

MIT
