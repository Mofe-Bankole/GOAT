import type { ScannedPool } from './pool-scanner.ts'
import type { RiskScore } from './risk-scorer.ts'
import type { APY, OnchainVerification } from '../types/index.ts'
import { SUPPORTED_CHAINS } from '../types/index.ts'

const CHAIN_PRIORITY: Record<string, number> = {
  'eip155:196': 1,
  'eip155:8453': 2,
  'eip155:1': 3,
}

export interface RankedPool {
  rank: number
  protocol: string
  chain: string
  pool: string
  asset: string
  apy: APY
  tvl_usd: number
  risk_score: 1 | 2 | 3 | 4 | 5
  risk_factors: string[]
  entry: {
    protocol_address: string
    method: string
    calldata_tips?: string
  }
  onchain?: OnchainVerification
  updated_at: number
}

function determineMethod(pool: ScannedPool): string {
  const symbol = pool.symbol.toLowerCase()
  if (symbol.includes('lp') || symbol.includes('amm') || symbol.includes('/')) {
    return 'add_liquidity'
  }
  if (pool.rewardTokens && pool.rewardTokens.length > 0) {
    return 'stake'
  }
  return 'supply'
}

function determineEntry(pool: ScannedPool): RankedPool['entry'] {
  return {
    protocol_address: pool.pool,
    method: determineMethod(pool),
    calldata_tips: pool.poolMeta ? undefined : 'check pool contract for exact entry method',
  }
}

export function rankPools(
  scannedPools: ScannedPool[],
  riskScores: Map<string, RiskScore>,
  apyValues: Map<string, APY>,
  riskTolerance: 'low' | 'moderate' | 'high',
  maxResults: number,
  onchainResults?: Map<string, OnchainVerification>
): RankedPool[] {
  const riskMultiplier: Record<string, number> = {
    low: 0,
    moderate: 0.5,
    high: 1,
  }

  const riskWeight = riskMultiplier[riskTolerance]

  const scored = scannedPools.map(pool => {
    const poolKey = pool.pool
    const risk = riskScores.get(poolKey) ?? { score: 3 as const, factors: ['unknown risk'] }
    const apy = apyValues.get(poolKey) ?? {
      total: pool.apy ?? 0,
      base: pool.apyBase ?? 0,
      rewards: pool.apyReward ?? 0,
      net_estimated: pool.apy ?? 0,
    }

    const riskPenalty = (risk.score - 1) / 4
    const tvlScore = Math.min(pool.tvlUsd / 100_000_000, 1)
    const chainPriority = CHAIN_PRIORITY[pool.chainCaip2] ?? 99
    const chainBonus = Math.max(0, 10 - chainPriority) / 10

    const weightedScore = apy.net_estimated * (1 - riskWeight * riskPenalty) + tvlScore * 2 + chainBonus

    return { pool, risk, apy, weightedScore }
  })

  scored.sort((a, b) => b.weightedScore - a.weightedScore)

  const results = scored.slice(0, maxResults)

  return results.map((item, index) => ({
    rank: index + 1,
    protocol: item.pool.project,
    chain: SUPPORTED_CHAINS[item.pool.chainCaip2] ?? item.pool.chain,
    pool: item.pool.pool,
    asset: item.pool.symbol,
    apy: item.apy,
    tvl_usd: Math.round(item.pool.tvlUsd),
    risk_score: item.risk.score,
    risk_factors: item.risk.factors,
    entry: determineEntry(item.pool),
    onchain: onchainResults?.get(item.pool.pool),
    updated_at: Date.now(),
  }))
}
