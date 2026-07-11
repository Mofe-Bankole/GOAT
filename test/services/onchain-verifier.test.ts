import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import { verifyPoolOnchain } from '../../src/services/onchain-verifier.ts'
import type { ScannedPool } from '../../src/services/pool-scanner.ts'

const POOL_ADDRESS = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'

function makePool(overrides: Partial<ScannedPool> = {}): ScannedPool {
  return {
    chain: 'X Layer',
    project: 'test-protocol',
    symbol: 'USDC',
    tvlUsd: 1_000_000,
    apyBase: 5,
    apyReward: 2,
    apy: 7,
    rewardTokens: null,
    pool: POOL_ADDRESS,
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
    chainCaip2: 'eip155:196',
    ...overrides,
  }
}

const RPC_URLS = JSON.stringify({
  'eip155:196': 'https://xlayer.example.com',
})

describe('onchain-verifier', () => {
  it('returns null verification for unknown chain (no RPC)', async () => {
    const pool = makePool({ chainCaip2: 'eip155:999' })
    const result = await verifyPoolOnchain(pool, RPC_URLS)
    assert.strictEqual(result.verified, null)
    assert.match(result.note, /no RPC configured/)
  })

  it('returns null verification for non-EVM pool address', async () => {
    const pool = makePool({ pool: 'some-internal-id' })
    const result = await verifyPoolOnchain(pool, RPC_URLS)
    assert.strictEqual(result.verified, null)
    assert.match(result.note, /non-EVM pool identifier/)
  })

  it('returns verified=true when contract has code', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      json: async () => ({ result: '0x1234' }),
    } as Response))

    const pool = makePool()
    const result = await verifyPoolOnchain(pool, RPC_URLS)
    assert.strictEqual(result.verified, true)
    assert.match(result.note, /contract verified/)

    mock.restoreAll()
  })

  it('returns verified=false when contract returns empty code', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      json: async () => ({ result: '0x' }),
    } as Response))

    const pool = makePool()
    const result = await verifyPoolOnchain(pool, RPC_URLS)
    assert.strictEqual(result.verified, false)
    assert.match(result.note, /no contract found/)

    mock.restoreAll()
  })

  it('returns null verification on RPC failure', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      ok: false,
    } as Response))

    const pool = makePool()
    const result = await verifyPoolOnchain(pool, RPC_URLS)
    assert.strictEqual(result.verified, null)

    mock.restoreAll()
  })

  it('returns null verification on malformed RPC response', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      json: async () => ({}) as Record<string, unknown>,
    } as Response))

    const pool = makePool()
    const result = await verifyPoolOnchain(pool, RPC_URLS)
    assert.strictEqual(result.verified, null)

    mock.restoreAll()
  })

  it('handles malformed RPC_URLS config gracefully', async () => {
    const pool = makePool()
    const result = await verifyPoolOnchain(pool, 'not-json')
    assert.strictEqual(result.verified, null)
    assert.match(result.note, /no RPC configured/)
  })
})
