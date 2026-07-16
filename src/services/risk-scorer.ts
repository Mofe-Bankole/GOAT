import type { DefiLlamaPool, DefiLlamaProtocol, OnchainVerification } from '../types/index.ts'

const BLUE_CHIP_ASSETS = ['USDC', 'USDT', 'DAI', 'ETH', 'WBTC', 'WETH', 'stETH']

export interface RiskScore {
  score: 1 | 2 | 3 | 4 | 5
  factors: string[]
}

export function scorePool(
  pool: DefiLlamaPool,
  protocolMeta?: DefiLlamaProtocol | null,
  onchain?: OnchainVerification | null
): RiskScore {
  const factors: string[] = []
  const isAudited = protocolMeta?.audit !== undefined && protocolMeta.audit !== null && protocolMeta.audit !== ''
  const isForked = protocolMeta?.forkedFrom && protocolMeta.forkedFrom.length > 0
  const ageDays = protocolMeta?.listedAt
    ? Math.floor((Date.now() - protocolMeta.listedAt * 1000) / (1000 * 60 * 60 * 24))
    : 0
  const hasBlueChipAssets = pool.underlyings
    ? pool.underlyings.some(u => BLUE_CHIP_ASSETS.includes(u))
    : BLUE_CHIP_ASSETS.some(a => pool.symbol.includes(a))
  const isFarmToken = pool.rewardTokens !== null && pool.rewardTokens.length > 0 &&
    !pool.rewardTokens.some(r => BLUE_CHIP_ASSETS.some(b => r.toLowerCase().includes(b.toLowerCase())))

  if (onchain && onchain.verified === false) {
    factors.push('pool contract not found on-chain')
  } else if (onchain && onchain.verified === true) {
    factors.push('contract verified on-chain')
  } else if (onchain && onchain.verified === null) {
    factors.push('on-chain verification unavailable')
  }

  if (onchain?.admin_type === 'eoa') {
    factors.push('EOA-controlled upgrade authority (single-key rug risk)')
  } else if (onchain?.admin_type === 'contract') {
    factors.push('contract-controlled upgrade authority')
  }

  // Score 1: Treasury (>$50M TVL, audited, >6 months, blue-chip)
  if (pool.tvlUsd >= 50_000_000 && isAudited && ageDays >= 180 && hasBlueChipAssets) {
    return { score: 1, factors: ['treasury-grade pool'] }
  }

  // Score 2: Safe (>$10M TVL, audited, >3 months)
  if (pool.tvlUsd >= 10_000_000 && isAudited && ageDays >= 90) {
    return { score: 2, factors: ['safe pool'] }
  }

  // Score 3: Moderate (>$1M TVL, audited or forked from audited)
  if (pool.tvlUsd >= 1_000_000 && (isAudited || isForked)) {
    if (!isAudited) factors.push('unaudited protocol')
    return { score: 3, factors: factors.length ? factors : ['moderate risk pool'] }
  }

  // Score 4: Risky (<$1M TVL, unaudited, new)
  if (pool.tvlUsd >= 100_000) {
    if (pool.tvlUsd < 1_000_000) factors.push('low liquidity')
    if (!isAudited) factors.push('no audit')
    if (ageDays > 0 && ageDays < 90) factors.push('new protocol')
    return { score: 4, factors: factors.length ? factors : ['risky pool'] }
  }

  // Score 5: Speculative (<$100k TVL, unaudited, farm tokens)
  if (pool.tvlUsd < 100_000) factors.push('very low liquidity')
  if (!isAudited) factors.push('no audit')
  if (isFarmToken) factors.push('farm token rewards')
  if (ageDays > 0 && ageDays < 30) factors.push('new protocol')

  return { score: 5, factors: factors.length ? factors : ['speculative pool'] }
}
