import { describe, it } from 'node:test'
import assert from 'node:assert'
import { scanPools } from '../../src/services/pool-scanner.ts'
import type { QueryParams, DefiLlamaPool } from '../../src/types/index.ts'

function makePool(overrides: Partial<DefiLlamaPool> = {}): DefiLlamaPool {
  return {
    chain: 'X Layer',
    project: 'test-protocol',
    symbol: 'USDC',
    tvlUsd: 1_000_000,
    apyBase: 5,
    apyReward: 2,
    apy: 7,
    rewardTokens: null,
    pool: '0xpool',
    apyPct1D: 0,
    apyPct7D: 0,
    apyPct30D: 0,
    stablecoin: true,
    ilRisk: 'no',
    exposure: 'single',
    predictions: {},
    chainId: null,
    poolMeta: null,
    mu: 0,
    sigma: 0,
    count: 0,
    outlier: false,
    underlyings: null,
    il7d: null,
    apyBaseInception: null,
    volumeUsd1d: null,
    volumeUsd7d: null,
    astarTvlUsd: null,
    ...overrides,
  }
}

const pools = [
  makePool({ chain: 'X Layer', symbol: 'USDC', tvlUsd: 10_000_000, apy: 8 }),
  makePool({ chain: 'Ethereum', symbol: 'USDC', tvlUsd: 100_000_000, apy: 5 }),
  makePool({ chain: 'Base', symbol: 'ETH', tvlUsd: 5_000_000, apy: 3 }),
  makePool({ chain: 'X Layer', symbol: 'USDT', tvlUsd: 500_000, apy: 12 }),
  makePool({ chain: 'X Layer', symbol: 'WBTC', tvlUsd: 50_000, apy: 1 }),
]

describe('pool-scanner', () => {
  it('filter by asset', () => {
    const params: QueryParams = { assets: ['USDC'] }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 2)
    assert.ok(results.every(p => p.symbol === 'USDC'))
  })

  it('filter by multiple assets', () => {
    const params: QueryParams = { assets: ['USDC', 'ETH'] }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 3)
  })

  it('filter by chain (CAIP-2)', () => {
    const params: QueryParams = { assets: ['USDC'], chains: ['eip155:196'] }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].chain, 'X Layer')
  })

  it('filter by min TVL', () => {
    const params: QueryParams = { assets: ['USDC'], min_tvl_usd: 50_000_000 }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].chain, 'Ethereum')
  })

  it('filter by min APY', () => {
    const params: QueryParams = { assets: ['USDC'], min_apy: 6 }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].chain, 'X Layer')
  })

  it('no matching pools returns empty', () => {
    const params: QueryParams = { assets: ['SOL'] }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 0)
  })

  it('empty assets returns all pools', () => {
    const params: QueryParams = { assets: [] }
    const results = scanPools(params, pools)
    assert.strictEqual(results.length, 5)
  })
})
