import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import { verifyPoolOnchain } from '../../src/services/onchain-verifier.ts'
import type { ScannedPool } from '../../src/services/pool-scanner.ts'

const POOL_ADDRESS = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'
const IMPL_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
const ADMIN_ADDR = '0x0000000000000000000000000000000000000B0B'
const EOA_ADMIN = '0x000000000000000000000000dead000000000000'

const ZERO_SLOT = '0x0000000000000000000000000000000000000000000000000000000000000000'
const IMPL_SLOT_VALUE = '0x000000000000000000000000' + POOL_ADDRESS.slice(2)
const ADMIN_SLOT_VALUE = '0x000000000000000000000000' + ADMIN_ADDR.slice(2)
const EOA_SLOT_VALUE = '0x000000000000000000000000' + EOA_ADMIN.slice(2)

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

function mockFetch(responses: Record<string, unknown>) {
  mock.method(globalThis, 'fetch', async (_url: string, opts: RequestInit) => {
    const body = JSON.parse(opts.body as string)
    const method = body.method
    const result = responses[method] ?? null
    return {
      ok: true,
      json: async () => ({ result } as Record<string, unknown>),
    } as Response
  })
}

function mockFetchFail() {
  mock.method(globalThis, 'fetch', async () => ({
    ok: false,
  } as Response))
}

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

  it('returns verified=true for non-upgradeable contract', async () => {
    mockFetch({
      eth_getCode: '0x1234',
      eth_getStorageAt: ZERO_SLOT,
    })
    const result = await verifyPoolOnchain(makePool(), RPC_URLS)
    assert.strictEqual(result.verified, true)
    assert.strictEqual(result.upgradeable, false)
    assert.match(result.note, /non-upgradeable/)
    mock.restoreAll()
  })

  it('detects EOA-controlled upgrade authority (rug risk)', async () => {
    const calls: string[] = []
    mock.method(globalThis, 'fetch', async (_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string)
      calls.push(body.method)
      if (body.method === 'eth_getCode' && body.params[0] === EOA_ADMIN) {
        return { ok: true, json: async () => ({ result: '0x' }) } as Response
      }
      if (body.method === 'eth_getStorageAt' && body.params[1] === IMPL_SLOT) {
        return { ok: true, json: async () => ({ result: IMPL_SLOT_VALUE }) } as Response
      }
      if (body.method === 'eth_getStorageAt' && body.params[1] === ADMIN_SLOT) {
        return { ok: true, json: async () => ({ result: EOA_SLOT_VALUE }) } as Response
      }
      if (body.method === 'eth_getCode' && body.params[0] === POOL_ADDRESS) {
        return { ok: true, json: async () => ({ result: '0x1234' }) } as Response
      }
      return { ok: true, json: async () => ({ result: null }) } as Response
    })
    const result = await verifyPoolOnchain(makePool(), RPC_URLS)
    assert.strictEqual(result.verified, true)
    assert.strictEqual(result.upgradeable, true)
    assert.strictEqual(result.admin_type, 'eoa')
    assert.match(result.note, /EOA/)
    mock.restoreAll()
  })

  it('detects contract-controlled upgrade authority (multisig)', async () => {
    mock.method(globalThis, 'fetch', async (_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string)
      if (body.method === 'eth_getCode' && body.params[0] === ADMIN_ADDR) {
        return { ok: true, json: async () => ({ result: '0x5678' }) } as Response
      }
      if (body.method === 'eth_getStorageAt' && body.params[1] === IMPL_SLOT) {
        return { ok: true, json: async () => ({ result: IMPL_SLOT_VALUE }) } as Response
      }
      if (body.method === 'eth_getStorageAt' && body.params[1] === ADMIN_SLOT) {
        return { ok: true, json: async () => ({ result: ADMIN_SLOT_VALUE }) } as Response
      }
      return { ok: true, json: async () => ({ result: '0x1234' }) } as Response
    })
    const result = await verifyPoolOnchain(makePool(), RPC_URLS)
    assert.strictEqual(result.verified, true)
    assert.strictEqual(result.upgradeable, true)
    assert.strictEqual(result.admin_type, 'contract')
    mock.restoreAll()
  })

  it('returns verified=false when contract missing', async () => {
    mockFetch({
      eth_getCode: '0x',
      eth_getStorageAt: ZERO_SLOT,
    })
    const result = await verifyPoolOnchain(makePool(), RPC_URLS)
    assert.strictEqual(result.verified, false)
    assert.match(result.note, /no contract found/)
    mock.restoreAll()
  })

  it('returns null on RPC failure', async () => {
    mockFetchFail()
    const result = await verifyPoolOnchain(makePool(), RPC_URLS)
    assert.strictEqual(result.verified, null)
    mock.restoreAll()
  })

  it('handles malformed RPC_URLS gracefully', async () => {
    const pool = makePool()
    const result = await verifyPoolOnchain(pool, 'not-json')
    assert.strictEqual(result.verified, null)
    assert.match(result.note, /no RPC configured/)
  })
})
