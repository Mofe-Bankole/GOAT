# Demeter Yield Optimizer ASP

Pay-per-call AI agent that scans DeFi protocols across X Layer, Base, and Ethereum — returns ranked, risk-scored yield opportunities with on-chain verification.

Built for the OKX.AI Genesis Hackathon (Finance Copilot / Revenue Rocket tracks).

## Why Demeter?

Most yield scrapers mirror DefiLlama. Demeter goes further — every pool contract is verified on-chain via `eth_getCode` before it reaches you. Autonomous agents moving real capital get deterministic trust, not stale off-chain metadata. **This is the security layer of DeFi AI.**

| Feature | DefiLlama API | Demeter |
|---------|--------------|---------|
| APY + TVL data | Yes | Yes (same source) |
| Risk scoring | Raw numbers only | 5-tier model (audit, TVL depth, age) |
| On-chain verification | No | eth_getCode on every pool contract |
| Agent-native API | No (human UI) | Yes, built for A2A |
| Push notifications | No | Webhook subscriptions |
| Micropayments | No | x402 ($0.02/call) |

## Quick Start

```bash
npm install
npm run dev
```

Requires Node.js 25+. Set `SKIP_X402=true` for local dev (no wallet needed).

## API

### `POST /api/optimize`

Find the best yield for your assets.

```json
{
  "assets": ["USDC", "ETH"],
  "chains": ["eip155:196", "eip155:8453"],
  "risk_tolerance": "moderate",
  "min_tvl_usd": 100000,
  "max_results": 10
}
```

**Response** includes ranked pools with APY breakdown, risk score (1-5), on-chain contract verification, and entry instructions for the calling agent.

### `POST /api/subscribe`

Register a webhook for yield change alerts (free, no x402).

```json
{
  "webhook_url": "https://youragent.com/hook",
  "params": { "assets": ["USDC"] }
}
```

The server polls DefiLlama every 5 minutes and fires webhooks when APY changes by >=0.5%.

### `GET /api/subscribe/:id`

Check subscription status, last notified time, and hook failure count.

### `DELETE /api/subscribe/:id`

Remove a subscription.

### `GET /health`

Health check.

### `GET /`

Interactive demo page.

## Pricing

| Endpoint | Price | Settlement |
|----------|-------|------------|
| `POST /api/optimize` | $0.02/call | x402 on X Layer |
| Subscription routes | Free | — |

## Architecture

```
Agent → POST /api/optimize (+ x402 payment)
                         ↓
              Fastify Server
              ├─ x402 middleware (payment)
              ├─ Pool Scanner (DefiLlama)
              ├─ On-chain Verifier (eth_getCode)
              ├─ Risk Scorer (1-5 tiers)
              ├─ APY Calculator (net after gas)
              └─ Yield Watcher (5min interval, webhooks)
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `SKIP_X402` | false | Disable payment for dev |
| `PAY_TO_ADDRESS` | — | Wallet to receive x402 payments |
| `RPC_URLS` | X Layer, Base, Ethereum defaults | JSON mapping of chain CAIP2 to RPC URL |
| `CACHE_TTL_SECONDS` | 300 | DefiLlama data cache TTL |

## Test

```bash
npm test
npm run typecheck
```

## Deploy

Deploy as a Vercel serverless function. See `vercel.json` and `api/index.ts`.

## Roadmap

| Phase | Timeline | Feature |
|-------|----------|---------|
| MVP | Hackathon | On-chain verified yield scanning + webhooks |
| Phase 2 | Post-launch | Historical APY trends, volatility tracking |
| Phase 3 | Month 2 | Dynamic auto-rebalancing vaults — agents deposit capital into smart vaults that auto-route based on Demeter's real-time signals |
| Phase 4 | Month 3 | Premium tiers: sub-second polling, MEV-aware routing, custom alerts |
