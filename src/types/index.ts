import { Type, type Static } from '@sinclair/typebox'

export const ExecutionContextSchema = Type.Optional(
  Type.Object({
    gas_token_price_gwei: Type.Optional(Type.Number()),
    wallet_balance_usd: Type.Optional(Type.Number()),
  })
)

export const QueryParamsSchema = Type.Object({
  assets: Type.Array(Type.String(), { minItems: 1 }),
  chains: Type.Optional(Type.Array(Type.String())),
  risk_tolerance: Type.Optional(Type.Union([
    Type.Literal('low'),
    Type.Literal('moderate'),
    Type.Literal('high'),
  ])),
  min_tvl_usd: Type.Optional(Type.Number({ default: 100000 })),
  max_results: Type.Optional(Type.Number({ default: 10 })),
  min_apy: Type.Optional(Type.Number()),
  execution_context: ExecutionContextSchema,
})

export type QueryParams = Static<typeof QueryParamsSchema>

export const APYSchema = Type.Object({
  total: Type.Number(),
  base: Type.Number(),
  rewards: Type.Number(),
  net_estimated: Type.Number(),
})

export type APY = Static<typeof APYSchema>

export const EntrySchema = Type.Object({
  protocol_address: Type.String(),
  method: Type.String(),
  calldata_tips: Type.Optional(Type.String()),
})

export type Entry = Static<typeof EntrySchema>

export const OnchainVerificationSchema = Type.Object({
  verified: Type.Union([Type.Boolean(), Type.Null()]),
  note: Type.String(),
  upgradeable: Type.Optional(Type.Union([Type.Boolean(), Type.Null()])),
  admin_type: Type.Optional(Type.Union([
    Type.Literal('eoa'),
    Type.Literal('contract'),
    Type.Literal('none'),
    Type.Null(),
  ])),
  admin_address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export type OnchainVerification = Static<typeof OnchainVerificationSchema>

export const PoolResultSchema = Type.Object({
  rank: Type.Number(),
  protocol: Type.String(),
  chain: Type.String(),
  pool: Type.String(),
  asset: Type.String(),
  apy: APYSchema,
  tvl_usd: Type.Number(),
  risk_score: Type.Union([
    Type.Literal(1),
    Type.Literal(2),
    Type.Literal(3),
    Type.Literal(4),
    Type.Literal(5),
  ]),
  risk_factors: Type.Array(Type.String()),
  entry: EntrySchema,
  onchain: Type.Optional(OnchainVerificationSchema),
  updated_at: Type.Number(),
})

export type PoolResult = Static<typeof PoolResultSchema>

export const MetaSchema = Type.Object({
  total_pools_scanned: Type.Number(),
  chains_covered: Type.Array(Type.String()),
  data_freshness_seconds: Type.Number(),
})

export type Meta = Static<typeof MetaSchema>

export const OptimizeResponseSchema = Type.Object({
  query_id: Type.String(),
  timestamp: Type.Number(),
  results: Type.Array(PoolResultSchema),
  meta: MetaSchema,
})

export type OptimizeResponse = Static<typeof OptimizeResponseSchema>

export interface DefiLlamaPool {
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apyBase: number
  apyReward: number
  apy: number
  rewardTokens: string[] | null
  pool: string
  apyPct1D: number
  apyPct7D: number
  apyPct30D: number
  stablecoin: boolean
  ilRisk: string
  exposure: string
  predictions: object
  chainId: number | null
  poolMeta: string | null
  mu: number
  sigma: number
  count: number
  outlier: boolean
  underlyings: string[] | null
  il7d: number | null
  apyBaseInception: number | null
  volumeUsd1d: number | null
  volumeUsd7d: number | null
  astarTvlUsd: number | null
}

export interface DefiLlamaProtocol {
  slug: string
  name: string
  description?: string
  url?: string
  audit?: string
  audit_note?: string
  twitter?: string
  audits?: string
  audit_links?: string[]
  audited_by?: string[]
  forkedFrom?: string[]
  oracles?: string[]
  chains?: string[]
  module?: string
  tvl?: number
  chainTvls?: Record<string, number>
  change_1h?: number
  change_1d?: number
  change_7d?: number
  mcap?: number
  treasury?: string
  holders?: string
  referred?: string[]
  github?: string[]
  listedAt?: number
  version?: number
  parentProtocol?: string
  is_verified?: boolean
}

export interface Caip2Mapping {
  [caip2: string]: string
}

export const SubscribeRequestSchema = Type.Object({
  webhook_url: Type.String({ format: 'uri' }),
  params: Type.Object({
    assets: Type.Array(Type.String(), { minItems: 1 }),
    chains: Type.Optional(Type.Array(Type.String())),
    risk_tolerance: Type.Optional(Type.Union([
      Type.Literal('low'),
      Type.Literal('moderate'),
      Type.Literal('high'),
    ])),
    min_tvl_usd: Type.Optional(Type.Number({ default: 100000 })),
    max_results: Type.Optional(Type.Number({ default: 10 })),
    min_apy: Type.Optional(Type.Number()),
  }),
})

export type SubscribeRequest = Static<typeof SubscribeRequestSchema>

export const SubscriptionResponseSchema = Type.Object({
  id: Type.String(),
  webhook_url: Type.String(),
  params: Type.Object({
    assets: Type.Array(Type.String()),
    chains: Type.Optional(Type.Array(Type.String())),
    risk_tolerance: Type.Optional(Type.String()),
    min_tvl_usd: Type.Optional(Type.Number()),
    max_results: Type.Optional(Type.Number()),
    min_apy: Type.Optional(Type.Number()),
  }),
  last_notified: Type.Union([Type.Number(), Type.Null()]),
  hook_failures: Type.Number(),
  created: Type.Number(),
})

export type SubscriptionResponse = Static<typeof SubscriptionResponseSchema>

export const SUPPORTED_CHAINS: Caip2Mapping = {
  'eip155:196': 'X Layer',
  'eip155:8453': 'Base',
  'eip155:1': 'Ethereum',
}
