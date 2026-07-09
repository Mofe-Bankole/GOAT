import { describe, it } from 'node:test'
import assert from 'node:assert'
import { scorePool } from '../../src/services/risk-scorer.ts'
import type { DefiLlamaPool, DefiLlamaProtocol } from '../../src/types/index.ts'

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

function makeProtocol(overrides: Partial<DefiLlamaProtocol> = {}): DefiLlamaProtocol {
  return {
    slug: 'test-protocol',
    name: 'Test Protocol',
    audit: 'https://audit.example.com',
    listedAt: Math.floor((Date.now() - 200 * 24 * 60 * 60 * 1000) / 1000),
    ...overrides,
  }
}

describe('risk-scorer', () => {
  it('score 1: treasury — >$50M TVL, audited, >6mo, blue-chip', () => {
    const pool = makePool({ tvlUsd: 100_000_000, symbol: 'USDC', underlyings: ['USDC'] })
    const meta = makeProtocol({ audit: 'https://audit.example.com' })
    const result = scorePool(pool, meta)
    assert.strictEqual(result.score, 1)
  })

  it('score 2: safe — >$10M TVL, audited, >3mo', () => {
    const pool = makePool({ tvlUsd: 25_000_000 })
    const meta = makeProtocol()
    const result = scorePool(pool, meta)
    assert.strictEqual(result.score, 2)
  })

  it('score 3: moderate — >$1M TVL, audited', () => {
    const pool = makePool({ tvlUsd: 5_000_000 })
    const meta = makeProtocol()
    const result = scorePool(pool, meta)
    assert.strictEqual(result.score, 3)
  })

  it('score 3: moderate — forked from audited', () => {
    const pool = makePool({ tvlUsd: 5_000_000 })
    const meta = makeProtocol({ audit: '', forkedFrom: ['aave'] })
    const result = scorePool(pool, meta)
    assert.strictEqual(result.score, 3)
  })

  it('score 4: risky — <$1M TVL, unaudited', () => {
    const pool = makePool({ tvlUsd: 500_000 })
    const meta = makeProtocol({ audit: undefined })
    const result = scorePool(pool, meta)
    assert.strictEqual(result.score, 4)
    assert.ok(result.factors.includes('no audit'))
  })

  it('score 5: speculative — <$100k TVL, farm tokens', () => {
    const pool = makePool({
      tvlUsd: 50_000,
      rewardTokens: ['0xFARM'],
      underlyings: ['FARM'],
    })
    const meta = makeProtocol({ audit: undefined, listedAt: undefined })
    const result = scorePool(pool, meta)
    assert.strictEqual(result.score, 5)
    assert.ok(result.factors.includes('farm token rewards'))
  })

  it('score 5: speculative — very low liquidity', () => {
    const pool = makePool({ tvlUsd: 10_000 })
    const result = scorePool(pool, null)
    assert.strictEqual(result.score, 5)
    assert.ok(result.factors.includes('very low liquidity'))
  })

  it('factors: new protocol when age < 90 days', () => {
    const pool = makePool({ tvlUsd: 200_000 })
    const meta = makeProtocol({
      audit: undefined,
      listedAt: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000),
    })
    const result = scorePool(pool, meta)
    assert.ok(result.factors.includes('new protocol'))
  })
})
