import type { QueryParams, DefiLlamaPool } from '../types/index.ts'
import { SUPPORTED_CHAINS } from '../types/index.ts'

const chainNameToCaip2 = Object.fromEntries(
  Object.entries(SUPPORTED_CHAINS).map(([caip2, name]) => [name.toLowerCase(), caip2])
)

function assetMatches(symbol: string, assets: string[]): boolean {
  const poolSymbol = symbol.toLowerCase()
  return assets.some(a => poolSymbol.includes(a.toLowerCase()))
}

function chainMatches(poolChain: string, chains?: string[]): boolean {
  if (!chains || chains.length === 0) return true

  const poolChainLower = poolChain.toLowerCase()
  const poolCaip2 = chainNameToCaip2[poolChainLower] || poolChainLower

  return chains.some(c => {
    const caip2 = c.toLowerCase()
    const chainName = SUPPORTED_CHAINS[caip2]?.toLowerCase()
    return caip2 === poolChainLower || caip2 === poolCaip2 || chainName === poolChainLower
  })
}

export interface ScannedPool extends DefiLlamaPool {
  chainCaip2: string
}

export function scanPools(params: QueryParams, pools: DefiLlamaPool[]): ScannedPool[] {
  const { assets, chains, min_tvl_usd, min_apy } = params

  let filtered = pools

  if (assets.length > 0) {
    filtered = filtered.filter(p => assetMatches(p.symbol, assets))
  }

  if (chains && chains.length > 0) {
    filtered = filtered.filter(p => chainMatches(p.chain, chains))
  }

  if (min_tvl_usd !== undefined && min_tvl_usd > 0) {
    filtered = filtered.filter(p => p.tvlUsd >= min_tvl_usd)
  }

  if (min_apy !== undefined) {
    filtered = filtered.filter(p => p.apy >= min_apy)
  }

  return filtered.map(p => ({
    ...p,
    chainCaip2: chainNameToCaip2[p.chain.toLowerCase()] || p.chain,
  }))
}
