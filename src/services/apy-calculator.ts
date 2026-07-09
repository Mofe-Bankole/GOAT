import type { DefiLlamaPool } from '../types/index.ts'
import type { APY } from '../types/index.ts'

export interface ExecutionContext {
  gas_token_price_gwei?: number
  wallet_balance_usd?: number
}

const ESTIMATED_GAS_UNITS = 200_000
const ETH_PRICE_USD = 3500

export function calculateApy(
  pool: DefiLlamaPool,
  executionContext?: ExecutionContext
): APY {
  const total = pool.apy ?? 0
  const base = pool.apyBase ?? 0
  const rewards = pool.apyReward ?? 0

  let netEstimated = total

  if (executionContext?.gas_token_price_gwei) {
    const gasCostWei = BigInt(ESTIMATED_GAS_UNITS) * BigInt(executionContext.gas_token_price_gwei)
    const gasCostEth = Number(gasCostWei) / 1e9 / 1e9
    const gasCostUsd = gasCostEth * ETH_PRICE_USD
    const walletBalance = executionContext.wallet_balance_usd ?? 10_000

    if (walletBalance > 0 && pool.tvlUsd > 0) {
      const estimatedYearlyGas = gasCostUsd * 52
      const gasAsPercentOfPrincipal = (estimatedYearlyGas / walletBalance) * 100
      netEstimated = Math.max(0, total - gasAsPercentOfPrincipal)
    }
  }

  return {
    total: Math.round(total * 100) / 100,
    base: Math.round(base * 100) / 100,
    rewards: Math.round(rewards * 100) / 100,
    net_estimated: Math.round(netEstimated * 100) / 100,
  }
}
