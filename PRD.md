# Demeter Yield Optimizer ASP

## Agent Service Provider for OKX.AI Genesis Hackathon

---

## 1. Elevator Pitch

A pay-per-call AI agent that scans DeFi protocols across multiple chains and returns ranked, risk-scored yield opportunities — so any agent can autonomously decide where to deploy capital.

---

## 2. Prize Track Strategy

| Track | Our Angle | Why We Win |
|-------|-----------|------------|
| **Finance Copilot** | DeFi yield copilot — the single utility every yield-seeking agent needs | Direct hit: it's a copilot for capital deployment |
| **Revenue Rocket** | High-frequency polling + subscription model | Agents call daily/weekly; usage compounds naturally |
| **Best Product** | Clean API surface, proper error handling, great docs | Simple scope = easy to polish to production grade |
| **Business Potential** | Clear GTM: every DeFi agent, vault, or portfolio manager is a customer | Platform effect — more agents = more calls = better data = more agents |

---

## 3. Target Users (on OKX.AI)

| User | Scenario | Call Pattern |
|------|----------|-------------|
| **DeFi automation agents** | "Where should I deploy 10k USDC for best risk-adjusted yield?" | Daily polling |
| **Portfolio rebalancing agents** | "Has the optimal yield changed since last week?" | Weekly rebalance checks |
| **Yield-chasing trading agents** | "What's the best single-sided stablecoin pool right now?" | On-demand |
| **Vault management agents** | "Scan all pools on X Layer and Base with >$100k TVL" | Hourly (for active managers) |

---

## 4. Core Features (MVP by July 18)

### 4.1 Query Parameters

```typescript
{
  assets: string[];              // ["USDC", "ETH", "USDT"]
  chains?: string[];             // ["eip155:196", "eip155:8453"] — default: all
  risk_tolerance?: "low" | "moderate" | "high";  // default: moderate
  min_tvl_usd?: number;          // default: 100000
  max_results?: number;          // default: 10
  min_apy?: number;              // minimum APY filter
  execution_context?: {          // optional — for net APY calc
    gas_token_price_gwei?: number;
    wallet_balance_usd?: number;
  };
}
```

### 4.2 Response

```typescript
{
  query_id: string;
  timestamp: number;
  results: Array<{
    rank: number;
    protocol: string;
    chain: string;
    pool: string;
    asset: string;
    apy: {
      total: number;         // base + rewards, %
      base: number;
      rewards: number;
      net_estimated: number; // after estimated gas cost
    };
    tvl_usd: number;
    risk_score: 1 | 2 | 3 | 4 | 5;  // 1 = safest
    risk_factors: string[];  // ["low liquidity", "no audit", "volatile asset"]
    entry: {
      protocol_address: string;
      method: string;          // "supply", "stake", "add_liquidity"
      calldata_tips?: string;  // hints for the calling agent
    };
    updated_at: number;
  }>;
  meta: {
    total_pools_scanned: number;
    chains_covered: string[];
    data_freshness_seconds: number;
  };
}
```

### 4.3 Risk Scoring Model

| Score | Label | Criteria |
|-------|-------|----------|
| 1 | **Treasury** | >$50M TVL, audited, >6 months live, blue-chip assets |
| 2 | **Safe** | >$10M TVL, audited, >3 months live |
| 3 | **Moderate** | >$1M TVL, audited or forked from audited |
| 4 | **Risky** | <$1M TVL, unaudited, new protocol |
| 5 | **Speculative** | <$100k TVL, unaudited, farm token rewards |

### 4.4 Data Sources

| Source | Data | Method |
|--------|------|--------|
| DefiLlama API | Pool APY, TVL, protocol metadata | `https://yields.llama.fi/pools` |
| DefiLlama API | Protocol audit status, track record | `https://api.llama.fi/protocol/{slug}` |
| Onchain RPC | Live pool state verification | Optional — via X Layer RPC |

---

## 5. Architecture

```
┌──────────────────────────────────────────────────┐
│                   AI AGENT                        │
│  (Claude, GPT, trading bot, vault manager)        │
└──────────────┬───────────────────────────────────┘
               │  HTTP POST /api/optimize
               │  + x402 payment header
               ▼
┌──────────────────────────────────────────────────┐
│              Demeter Yield ASP Server                │
│  ┌────────────────────────────────────────────┐   │
│  │  x402 Payment Middleware                    │   │
│  │  (@okxweb3/x402-express)                   │   │
│  │  → 402 if unpaid, verify sig, forward      │   │
│  └────────────────┬───────────────────────────┘   │
│                   ▼                                │
│  ┌────────────────────────────────────────────┐   │
│  │  Request Router + Validation               │   │
│  └────────────────┬───────────────────────────┘   │
│                   ▼                                │
│  ┌────────────────────────────────────────────┐   │
│  │  Strategy Engine                            │   │
│  │  ┌────────────────┐ ┌──────────────────┐   │   │
│  │  │ Pool Scanner   │ │ Risk Scorer      │   │   │
│  │  └───────┬────────┘ └──────────────────┘   │   │
│  │          ▼                                 │   │
│  │  ┌────────────────┐ ┌──────────────────┐   │   │
│  │  │ APY Calculator │ │ Ranker           │   │   │
│  │  └────────────────┘ └──────────────────┘   │   │
│  └────────────────┬───────────────────────────┘   │
│                   ▼                                │
│  ┌────────────────────────────────────────────┐   │
│  │  Response Formatter + Cache Layer          │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 5.1 Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node.js 25 | Latest, fast, good async |
| Framework | Fastify | Performance, schema validation, plugin system |
| Payment | `@okxweb3/x402-express` | Required for OKX.AI marketplace |
| Data fetching | `undici` (built-in fetch) | No deps needed, fast |
| Caching | In-memory LRU (5 min TTL) | Avoid beating DefiLlama, keep data fresh |
| Validation | Fastify JSON Schema / TypeBox | Auto-generated OpenAPI docs |
| Deploy | Docker (if needed) or serverless | Flexible |

---

## 6. x402 Payment Integration

Using Onchain OS `@okxweb3/x402-express` middleware:

```typescript
// Pricing model
const PRICING = {
  "/api/optimize": {
    accepts: [{
      scheme: "exact",
      network: "eip155:196",  // X Layer mainnet
      payTo: process.env.PAY_TO_ADDRESS,
      price: "$0.02",         // per query
    }],
    description: "Yield optimization query — returns ranked strategies",
    mimeType: "application/json",
  }
};
```

**Why $0.02:** Low enough that agents don't hesitate to poll daily, high enough that 1000 agents × 1 call/day × $0.02 = $20/day passive. Revenue Rocket judges love recurring micropayment volume.

---

## 7. OKX.AI Marketplace Listing

### 7.1 Agent Descriptor

```yaml
name: Demeter Yield Optimizer
tagline: Find the best risk-adjusted DeFi yield across chains
category: Finance Copilot
protocol: x402
network: eip155:196
price: $0.02/call
endpoint: https://goat-yield-asp.vercel.app/api/optimize
capabilities:
  - Multi-chain yield scanning
  - Risk scoring (1-5)
  - Net APY after gas estimation
  - Asset-specific filtering
```

### 7.2 Demo Video Script (90s)

```
0:00  Hook: "Your agent has capital. Where does it deploy?"
0:10  Show agent conversation: "Find best USDC yield on X Layer"
0:25  Cut to: ASP receiving request, scanning 47 pools
0:40  Return ranked results with APY, risk scores, TVL
0:55  Agent picks one: "Enter Aave USDC pool at 12.4% APY"
1:05  Show: payment settles on X Layer in seconds
1:15  ROI pitch: "One call = $0.02. One bad decision = thousands lost."
1:30  CTA: "List your ASP at okx.ai — Demeter Yield Optimizer"
```

---

## 8. Post-Hackathon Revenue Model

| Phase | Model | Est. Monthly |
|-------|-------|-------------|
| Launch | Pay-per-call ($0.02) | Variable |
| Month 2 | Introduce tiers: 100 calls/mo for $1.50 | $1.50/agent |
| Month 3 | Plus premium tiers: real-time alerts, MEV-aware routing | $5-10/agent |
| Month 6 | API access for vaults/funds (custom pricing) | $50-500/client |

**Target:** 1000 active agents at $1.50/mo = $1,500/mo recurring. Niche but sustainable for an OPC.

---

## 9. Timeline (14 days)

| Day | Milestone | Deliverable |
|-----|-----------|-------------|
| **1-2** | Data layer | DefiLlama integration, pool fetching, schema |
| **3-4** | Scoring engine | Risk model, APY calculator, net yield math |
| **5-6** | API server | Fastify app, routes, validation, error handling |
| **7-8** | x402 payment | `@okxweb3/x402-express` middleware, test payments |
| **9-10** | Polish + caching | LRU cache, rate limiting, response formatting |
| **11** | Deploy + test | Live endpoint, end-to-end agent simulation |
| **12** | OKX.AI listing | Submit ASP, Google Form, marketplace descriptor |
| **13** | Demo video | 90s screen recording, X post with #okxai |
| **14** | Buffer + traction | Drive real usage, iterate on feedback |

---

## 10. Competitive Moat

| Factor | Edge |
|--------|------|
| **First to OKX.AI** | No yield optimizer ASP exists yet on the platform |
| **Agent-native** | Built for A2A from day one (not a human UI bolted onto an API) |
| **Risk scoring** | Not just raw APY — includes TVL depth, audit status, protocol age |
| **x402 micropayments** | Gas-efficient, instant settlement on X Layer |
| **Multi-chain** | X Layer + Base + Ethereum at launch |

---

## 11. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| DefiLlama API rate limits | Aggressive caching (5 min TTL), fallback polling |
| DefiLlama goes down | Secondary RPC-based data (simplified fallback) |
| Low initial usage for Revenue Rocket | Pre-seed: build 3-5 demo agents that call it daily, share on X |
| x402 integration bugs | Testnet first, fail-safe responses in middleware |
| OKX.AI marketplace approval delays | Submit listing ASAP (Day 12), leave buffer |
