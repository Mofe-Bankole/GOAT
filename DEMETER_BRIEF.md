# Demeter Yield Optimizer ASP — Project Brief for AI Review

## One-Line Pitch
A pay-per-call AI agent that scans DeFi protocols across X Layer, Base, and Ethereum and returns ranked, risk-scored yield opportunities with on-chain contract verification.

## Target Audience
- DeFi automation agents (daily yield polling)
- Portfolio rebalancing agents (weekly check-ins)
- Vault management agents (hourly scans)
- All on the OKX.AI Agent Service Provider marketplace

## Tech Stack
- Node.js 25, Fastify, TypeBox, @fastify/rate-limit
- x402 micropayments via @okxweb3/x402-express ($0.02/call on X Layer, eip155:196)
- DefiLlama API for pool + protocol data
- Public JSON-RPC for on-chain eth_getCode verification
- In-memory LRU cache (5-min TTL)
- Vercel serverless deployment

## API Endpoints

### POST /api/optimize ($0.02/call, x402 payment)
- Input: assets, chains, risk_tolerance, min_tvl_usd, max_results, min_apy
- Output: ranked pools with APY breakdown (total/base/rewards/net), risk score 1-5, risk factors, on-chain contract verification, entry instructions

### POST /api/subscribe (free)
- Register webhook URL with query params
- Background watcher polls every 5 min, fires webhook on APY change >= 0.5%

### GET/DELETE /api/subscribe/:id (free)
- Check subscription status, hook failure count, delete

### GET / (free)
- Interactive demo page with form, results table, health indicator

### GET /health
- Health check

## Differentiation from DefiLlama
1. On-chain contract verification via eth_getCode
2. Agent-native API (not a human UI bolted on)
3. Risk scoring (TVL x audit x age x on-chain state)
4. Webhook subscriptions (push, not pull)
5. x402 micropayments
6. First-mover on OKX.AI marketplace

## Known Weaknesses
1. DefiLlama could add risk scoring themselves
2. OKX.AI has low agent volume today
3. No retention loop (agents call, get data, leave)
4. No historical data or trend analysis
5. No mobile interface
6. x402 adds friction for non-crypto-native agents

## Competitors on OKX.AI
- None currently in the yield/finance category (first-mover advantage)

## Prize Tracks Targeting
- Finance Copilot (direct hit)
- Revenue Rocket (x402 micropayments, $0.02/call)
- Best Product (36 tests, clean code, demo page, docs)
- Business Potential (platform effect, clear monetization)

## Prize Pool
- $100,000 total across 10 tracks
- Finance Copilot: $2,500 per winner (3 winners)
- Revenue Rocket: $10k/$6k/$4k
- Business Potential: $10k/$6k/$4k
- Best Product: $10k/$6k/$4k

## Questions for the AI Reviewer
1. What's the single highest-impact feature we could add in 24 hours before deadline?
2. What's the weakest part of our pitch to judges?
3. Is there a prize track we should de-emphasize or one we're underrating?
4. What would make judges pick us over a hypothetical competitor in the same category?
5. How would you improve our demo script/story?
6. Is $0.02/call the right price point?
