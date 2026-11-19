# Pinned launch thread (draft)

**Do not post.** The launch is held until about **1–3 Dec 2026**. The repo and site stay private until Douglas says go. This is a draft for his review, not a scheduled post, and it must not be published as Douglas or from any other account.

Character counts below are plain-text lengths, including spaces, punctuation and line breaks. X counts each standard URL as 23 characters once real links replace the placeholders. Post 7 still has room for that (about 137 characters after two t.co URLs).

No prize talk. Every number is from `/workspace/traced/README.md`. The thread does not invent run counts or call “likely original” a verdict.

## The thread

### 1/7 — 149 characters

```
On TapeOut, a circuit can be taped out as a byte-for-byte copy of someone else's work, with no citation back to it.

How do you find the real source?
```

**Suggested image:** `/workspace/traced/design/brand-kit/landing-desktop-01-hero.png` (also in `/workspace/traced/design/shots/`). The landing hero states the product idea before any UI chrome. Alternate if you want the problem stated visually first: `/workspace/traced/design/shots/landing-desktop-02-story-a.png` or `landing-desktop-02-story-b.png`.

### 2/7 — 172 characters

```
A citation is a REF. Identical netlist bytes can't contain a REF to each other, so a silent copy leaves no trail in the circuit itself.

Traced calls those sets copy-twins.
```

**Suggested image:** `/workspace/traced/design/brand-kit/app-copy-34-desktop.png`. Demo from the README: Cerebr `#4` (the original 6-NAND XOR) beside byte-identical copy `#34` (different owner, no REF). Mobile alternate: `/workspace/traced/design/shots/app-copy-34-mobile.png`.

### 3/7 — 172 characters

```
Traced, for TapeOut.

Every circuit, traced back to its source.

It's a read-only lookup for TapeOut circuits on X Layer mainnet. Enter a circuit ID. No wallet, no sign-up.
```

**Suggested image:** `/workspace/traced/design/shots/app-lookup-5-desktop.png`. Lookup of Cerebr `#5` (XOR built from 3 REFs), which is the first demo in the README. If you would rather stay on the marketing page, reuse the hero from post 1.

### 4/7 — 180 characters

```
Paste an ID and you get the family tree: the REF parents it was built on, and the children that cite it.

It also flags byte-identical copy-twins, and classes such as toy circuits.
```

**Suggested image:** `/workspace/traced/design/brand-kit/app-lineage-12-desktop.png`. README demo: Cerebr `#12`, a line detector with 11 REFs. Mobile alternate: `/workspace/traced/design/shots/app-lineage-12-mobile.png`.

### 5/7 — 265 characters

```
You can replay a circuit for free in your browser with eval(). It prints the truth table, and can compare it row by row with a twin, a parent, or any circuit you pick.

That free replay is not counted on-chain. It leaves no trace, so Traced never claims run counts.
```

**Suggested image:** `/workspace/traced/design/shots/app-replay-34-desktop.png`. In-app replay / truth-table view. Alternate: `/workspace/traced/design/shots/landing-desktop-05-inside-replay.png`.

The honesty line is required by the README and BRAND.md: `eval()` and `step()` are free view calls that leave no trace on-chain. Traced counts REF citations only and never claims run counts.

### 6/7 — 232 characters

```
The index is a snapshot, not a live census. At X Layer block 75,628,053 (11 Nov 2026) it covered 11,749 official-factory circuits, with 1,514 REF uses and 345 twin groups.

"Likely original" in a twin group is timing, not a verdict.
```

**Suggested image:** `/workspace/traced/design/shots/landing-desktop-07-honesty.png`, which is the landing page’s honest-limits section. All figures are from the README “Honest limits” section (snapshot at block 75,628,053 on 11 Nov 2026).

### 7/7 — 113 characters as drafted

```
Try Traced (links go live when we launch):

[site link]
[repo link]

Built for @TapeOutWorld, on @XLayerOfficial.
```

**Suggested image:** `/workspace/traced/design/shots/landing-desktop-08-cta.png`. Leave the links as placeholders until the site and repo are public. Once replaced, expect this post to land around **137 characters** (two URLs counted at 23 each).

Only these two official handles are tagged. See the verification notes below. If a handle later fails a re-check, replace it with `[tag?]` rather than guessing a substitute.

## Official handles — verified, and how

Lookups used Grok Bot’s public X read tools (`get_users_by_usernames`, `get_users_posts`, `search_posts_all`) on **18 Nov 2026, about 22:33–22:37 West Africa Time (Africa/Lagos, UTC+1)**. Official pages were fetched the same evening.

### Tag: `@TapeOutWorld`

- X user id `2101355422703865856`. Display name **TapeOut**. `verified: true`, `verified_type: business` (gold check). Created 19 Sep 2026. Profile website: [tapeout.net](https://tapeout.net/). Bio describes TapeOut (verifiable tools, DeWEB). About 6,614 followers at lookup.
- The account itself stated, on 13 Oct 2026 at 07:54 WAT (06:54 UTC), “TapeOut is now gold verified / For official TapeOut news look for the gold check on @TapeOutWorld”: [x.com/TapeOutWorld/status/2109900487520903587](https://x.com/TapeOutWorld/status/2109900487520903587).
- On 22 Oct 2026 at 18:32 WAT (17:32 UTC) it posted: “The official account is @TapeOutWorld with the gold check… Official news comes from @TapeOutWorld”: [x.com/TapeOutWorld/status/2113322491439673790](https://x.com/TapeOutWorld/status/2113322491439673790).
- Official X Layer (`@XLayerOfficial`, itself business-verified) repeatedly names `@TapeOutWorld` in TapeOut Accelerate posts retrieved on 18 Nov 2026, including “The X Layer @TapeOutWorld Accelerate Leaderboard is live” ([status/2120761693727039534](https://x.com/XLayerOfficial/status/2120761693727039534), 12 Nov 2026, 10:06 WAT) and “Entries for @TapeOutWorld close tomorrow” ([status/2122286359155270110](https://x.com/XLayerOfficial/status/2122286359155270110), 16 Nov 2026, 12:11 WAT).

### Tag: `@XLayerOfficial`

- X user id `1719688604551700480`. Display name **X Layer**. `verified: true`, `verified_type: business`. Created 1 Nov 2023. Profile website: [web3.okx.com/xlayer](https://web3.okx.com/xlayer). Bio: “The New Money Chain. Make everything onchain. The only official X Layer channel. Engagement ≠ Endorsement.” About 150,086 followers at lookup. (A lookup of `xlayerofficial` resolves to this same account; usernames are case-insensitive.)
- This is the account that published official TapeOut Accelerate announcements, including the leaderboard post above and “Last call for submissions… Entries for @TapeOutWorld close tomorrow” ([status/2122286359155270110](https://x.com/XLayerOfficial/status/2122286359155270110), 16 Nov 2026).
- The official event page, [web3.okx.com/xlayer/build-x-series](https://web3.okx.com/xlayer/build-x-series) (fetched 18 Nov 2026), tells readers to “follow X Layer and TapeOut official X accounts for more updates.” It does not print the handles in the page text we retrieved.

**Hyperlink gap (documented, not a reason to drop the tag):** okx.com and web3.okx.com pages set `twitter:site` to `@okx`, and the static HTML we fetched did not include an `x.com/XLayerOfficial` href (the pages are heavily JS-rendered). Official confirmation here is the business gold check, the bio’s “only official X Layer channel” line, the official X Layer URL on the profile, and the account being the publisher of official X Layer announcements.

### Do not tag

- **`@TapeOut_X`** — different account (id `2102790436951859201`). Display name “TAPEOUTX”, bio “Senior Coder”, website tapeoutx.pro, `verified_type: blue` (not gold). Not the official TapeOut account.
- **`@TapeOut`** — an unrelated 2010 account (id `225508439`), display name “Flávio Ortiz”, not verified, empty bio.
- **`@ZeroTapeOut`** — “TapeOut Space”, a community entry point, not official, not verified.
- **`@okx`** — official OKX (business-verified, okx.com), but this thread tags only official TapeOut and X Layer handles.
- **`@NairaGuardHQ`** — off-limits. Do not mention, tag, or reuse it.
- Affiliated TapeOut community accounts (the ones `@TapeOutWorld` says carry a small TapeOut badge and speak only for themselves).

## Official hashtag and posting rules

**No official required hashtag was found** for a project launch thread.

- The official event page ([web3.okx.com/xlayer/build-x-series](https://web3.okx.com/xlayer/build-x-series), fetched 18 Nov 2026) has no social hashtag and no posting format for launched projects. Submission is through the designated Google Form, provisionally before **7 Dec 2026, 23:59 UTC** (same as 8 Dec 2026, 00:59 West Africa Time).
- Official posts from `@XLayerOfficial` and `@TapeOutWorld` between 1 Oct and 18 Nov 2026 that we retrieved about TapeOut Accelerate did not use a campaign hashtag such as `#TapeOutAccelerate` or `#BuildX`.
- `@TapeOutWorld` did post an X Layer × TapeOut Accelerate **security reminder** on 22 Oct 2026 at 13:02 WAT (12:02 UTC): verify the source of hackathon information, beware phishing pages that impersonate official event, registration or prize-claim sites, and check the domain: [x.com/TapeOutWorld/status/2113239625988989122](https://x.com/TapeOutWorld/status/2113239625988989122). That is a safety rule, not a hashtag rule. The launch thread should only link to the real site and repo once they are public.
- A separate `@XLayerOfficial` creative contest (“Tweet about what you wish existed onchain, tag us and @TapeOutWorld”), [status/2117943699829129408](https://x.com/XLayerOfficial/status/2117943699829129408), ended 17 Nov 2026. It is not a rule for this launch thread.

Community posts sometimes use `#TapeOut` or `#XLayer`. Those are not treated as official here, and they are left out of the draft so the thread does not invent a required tag.
