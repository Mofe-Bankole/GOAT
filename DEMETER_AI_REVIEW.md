# Demeter Yield Optimizer ASP — AI Review

*OKX.AI Genesis Hackathon · Checked against the live hackathon page and marketplace on July 16, 2026*

---

## Before Anything Else: Submission Mechanics

Shipping code isn't the finish line. Per the official hackathon page, the process is:

1. Build the ASP.
2. List it on OKX.AI — it has to pass OKX's internal review and go live. If it isn't approved or can't go live, the hackathon submission is invalid.
3. Post it on X with `#OKXAI`, including a demo or walkthrough capped at **90 seconds**.
4. Submit a Google form linking that post.

Submissions close **July 17, 2026** (the page shows two slightly different cutoffs in different sections — 22:59 UTC in the schedule block, 23:59 UTC in the submission instructions; treat **22:59 UTC** as the real target to be safe), with a reward announcement scheduled for July 23.

Separately, OKX's own ASP tutorial states review turnaround is **within 24 hours**, with results sent to the email on your Agentic Wallet and to the Agent conversation window.

**If Demeter isn't already submitted for listing, that clock is the biggest risk here — bigger than any feature below. Do it today if it hasn't happened yet.**

> Small aside: there's also a separate "OKX Build X Hackathon" (X Layer Arena / Skills Arena) live in the same window, with a different submission flow. Worth a quick check that you're following Genesis's rules (HackQuest + Google form) specifically.

---

## 1. Highest-Impact 24-Hour Feature

DefiLlama's yields API already returns, for free, no key required:
- 1-day / 7-day / 30-day APY trend, plus a 30-day mean APY
- Impermanent-loss risk classification and exposure type
- A predicted direction with a confidence score
- Mean/standard-deviation volatility stats (`mu` / `sigma`)
- Protocol-level audit counts

That's three of your four risk-score inputs sitting in a JSON response anyone can fetch. A live product, **AprScope**, already does almost exactly this — its own methodology page describes its risk-profile block as a deterministic summary built directly from DefiLlama's IL-risk flag, stablecoin flag, audit count, and DefiLlama's own prediction field, with no independent analysis layered on top. Your own listed weakness #1 ("DefiLlama could add risk scoring themselves") isn't hypothetical — a DefiLlama-wrapper risk score already exists as a shipped product category.

The one input that genuinely isn't in that JSON is the on-chain check — and it's underbuilt relative to how far it could go with the RPC plumbing you already have for `eth_getCode`.

### Recommended build: extend the on-chain check into an upgrade-authority check

- Read the ERC-1967 implementation slot via `eth_getStorageAt`:
  ```
  0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
  ```
  Non-zero means the pool sits behind an upgradeable proxy — logic can change under depositors without notice.

- Read the ERC-1967 admin slot:
  ```
  0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
  ```
  Then `eth_getCode` on whatever address comes back (per OpenZeppelin's reference implementation of these slots). No code = an EOA controls upgrades (single-key rug risk). Code present = probably a multisig or timelock (materially safer).

- Surface it as its own field, not folded invisibly into a 1–5 number:
  ```json
  "upgradeable": true,
  "admin_type": "eoa",
  "admin_address": "0x..."
  ```

Roughly 2–3 hours of work: two more storage reads per pool, some address-shape logic. It's the one piece that's genuinely hard to clone by wrapping a REST API, it directly answers the sharpest version of your own weakness, and it's your best live-demo beat — paste a real pool address, watch it catch something a DefiLlama screenshot wouldn't show.

**Second priority, only if time remains:** a lightweight "portfolio" mode on your existing subscribe endpoint — subscribe a basket of positions instead of one pool, get an aggregated exposure alert. That's what actually addresses "no retention loop," but it's a bigger lift, so it comes after the on-chain depth.

---

## 2. Weakest Part of the Pitch

**The sharper issue:** the differentiation list blurs "things only Demeter can do" with "things DefiLlama's own API already returns." Given AprScope already exists, a DeFi-literate reviewer who spends five minutes checking will find that pattern. Get ahead of it in the pitch language itself — state plainly that you don't recompute what DefiLlama already publishes, and name the two or three things that aren't in anyone's free JSON: live bytecode/upgrade-authority verification, push delivery via webhooks (DefiLlama is pull-only), and a payment endpoint an agent can transact with immediately.

**The smaller issue:** "OKX.AI has low agent volume today" reads like an assumption rather than a checked fact, and it's the more pessimistic read available. CoinAnk's derivatives-data API has sold past 1,400 uses, and a general on-chain data explorer is past 900 — real, paid usage is already happening on the platform. There's no direct yield-optimizer twin currently listed, so first-mover still holds, but "low volume" undersells a marketplace that's already proving out demand elsewhere. Reframe as: proven marketplace, empty niche.

---

## 3. Prize Track to De-Emphasize (Correction First)

There is no "Business Potential" track in the live prize breakdown. The actual structure:

| Track | Prize | Type |
|---|---|---|
| Best Product | $20,000 ($10k/$6k/$4k) | General |
| Creative Genius | $20,000 ($10k/$6k/$4k) | General |
| Revenue Rocket | $20,000 ($10k/$6k/$4k) | General |
| Finance Copilot | $7,500 (3 × $2,500) | Category |
| Software Utility | $7,500 (3 × $2,500) | Category |
| Lifestyle Companion | $7,500 (3 × $2,500) | Category |
| Artistic Excellence | $7,500 (3 × $2,500) | Category |
| Social Buzz | $10,000 (10 × $1,000) | Community |

That's 8 named tracks, not 10. Your Finance Copilot, Revenue Rocket, and Best Product numbers all match exactly — "Business Potential ($10k/$6k/$4k)" is almost certainly **Creative Genius**, the other track sharing that prize structure.

This matters: Creative Genius most likely judges originality of the underlying idea, not platform effects or monetization clarity — the thing your "Business Potential" framing was written for. On pure concept novelty, "scan pools, rank by risk-adjusted yield, serve to agents" is a well-trodden pattern (see AprScope above), so Demeter isn't especially strong on that specific axis even with good execution.

**Recommendation:** de-emphasize any pitch language angling for "creative/original idea," and put that energy into the three tracks where your actual strengths line up with what's actually judged: **Finance Copilot** (direct fit), **Revenue Rocket** (genuinely working machine-payable revenue infrastructure, which most entrants will only gesture at), and **Best Product** (execution: tests, docs, verification depth, a live demo).

---

## 4. What Beats a Hypothetical Competitor

The clearest bar already exists on the platform: **OnChain Arb Scout**, the closest thing to Demeter currently live, states its methodology in dollar terms — a $1,000 simulated trade size with gas and slippage factored in, ranked by net profit. That's concrete and falsifiable, not a score a judge has to take on faith.

To clear that bar:
- Run the on-chain check live in front of the reviewer, not a screenshot.
- Show the payment settling in real time on X Layer.
- Frame output in dollar or percentage terms, not a bare 1–5 score.
- Make sure docs/tests hold up to someone clicking around for two minutes unsupervised — judging is listed as "OKXAI Internal Review," likely a small team moving fast through many submissions, so anything requiring them to take your word for it is a disadvantage.

---

## 5. Demo Script (90-Second Beat Sheet)

The X participation post has to include a demo capped at **90 seconds**. Suggested structure:

| Time | Beat |
|---|---|
| 0:00–0:10 | The problem from the agent's POV, one line: an autonomous vault agent has to pick where idle capital goes every hour, across three chains, without a human checking the contract first. |
| 0:10–0:30 | A live `/api/optimize` call, real params, real response. |
| 0:30–0:50 | The moment that's actually yours: the on-chain check catching a proxy or EOA-controlled admin key that a DefiLlama screenshot wouldn't show. |
| 0:50–1:10 | The payment round-trip settling live on X Layer, ideally next to a real number (calls served, however small). |
| 1:10–1:25 | One line on what's next (portfolio mode) — naming your own current limitation before a judge does reads as self-aware, not weak. |
| 1:25–1:30 | Where to find it. |

Cut anything that's narration over a static screen. Every second should be something actually happening.

---

## 6. Is $0.02/Call the Right Price?

Comparable finance-category agents on OKX.AI currently price from about **0.01 USDT** per call (raw market data) up to **0.1 USDT** (computed, ranked output). $0.02 sits at the cheap end, closer to a raw-data price than a computed/verified one — despite Demeter doing more synthesis than either comparable. If anything, that's conservative rather than too high.

For your stated audience: at $0.02/call, an hourly vault-scanning agent runs roughly **$14–15/month** — trivial against any real position size, so price isn't likely the binding constraint. Friction is more about wallet/integration overhead than the number itself.

Also worth knowing: for pay-per-call agent services on this platform, an x402-compliant paid endpoint is the *specified* integration path for this service type, not one option among several — so the x402 choice isn't a business-model risk to defend, it's just correctly following spec.

**Don't spend remaining hours on pricing tiers** — low return, not demo-able. If it comes up in Q&A: flat rate keeps integration simple for launch; volume pricing is a natural next step once there's usage data.

---

## If You Only Do Three Things Before the Form Closes

1. **Confirm Demeter is actually submitted for OKX.AI listing/review right now** — nothing else matters if that clock doesn't clear in time.
2. **Ship the upgrade-authority check** — it's your realest differentiator and your best demo beat.
3. **Record the 90-second post** around a live on-chain catch plus a live payment settling, and swap any "Business Potential"-flavored language for Finance Copilot / Revenue Rocket / Best Product framing.

---

## Sources

- [OKX.AI Genesis Hackathon — HackQuest](https://www.hackquest.io/hackathons/OKXAI-Genesis-Hackathon)
- [Become an ASP — OKX.AI](https://www.okx.ai/tutorial/asp)
- [OKX.AI Agent Marketplace](https://www.okx.ai/agents)
- [ERC-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [AprScope Methodology](https://aprscope.com/methodology/)
