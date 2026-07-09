import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import Fastify from 'fastify'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyInstance } from 'fastify'
import configPlugin from '../../src/plugins/config.ts'
import cachePlugin from '../../src/plugins/cache.ts'
import defillamaPlugin from '../../src/plugins/defillama.ts'
import optimizeRoutes from '../../src/routes/optimize.ts'
import type { DefiLlamaPool } from '../../src/types/index.ts'

function buildTestApp(pools: DefiLlamaPool[]): FastifyInstance {
  const app = Fastify({ logger: false }).withTypeProvider<TypeBoxTypeProvider>()

  process.env.SKIP_X402 = 'true'

  app.register(configPlugin)
  app.register(cachePlugin)

  app.decorate('defillama', {
    fetchAllPools: async () => pools,
    fetchProtocol: async (_slug: string) => null,
  })

  app.register(optimizeRoutes)

  return app
}

const mockPools: DefiLlamaPool[] = [
  {
    chain: 'X Layer',
    project: 'aave',
    symbol: 'USDC',
    tvlUsd: 100_000_000,
    apyBase: 6,
    apyReward: 2,
    apy: 8,
    rewardTokens: ['0xReward'],
    pool: '0xaave-usdc',
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
    underlyings: ['USDC'],
    il7d: null,
    apyBaseInception: null,
    volumeUsd1d: null,
    volumeUsd7d: null,
    astarTvlUsd: null,
  },
  {
    chain: 'Ethereum',
    project: 'compound',
    symbol: 'USDC',
    tvlUsd: 50_000_000,
    apyBase: 4,
    apyReward: 1,
    apy: 5,
    rewardTokens: null,
    pool: '0xcomp-usdc',
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
    underlyings: ['USDC'],
    il7d: null,
    apyBaseInception: null,
    volumeUsd1d: null,
    volumeUsd7d: null,
    astarTvlUsd: null,
  },
  {
    chain: 'Base',
    project: 'morpho',
    symbol: 'ETH',
    tvlUsd: 5_000_000,
    apyBase: 3,
    apyReward: 0,
    apy: 3,
    rewardTokens: null,
    pool: '0xmo-eth',
    apyPct1D: 0,
    apyPct7D: 0,
    apyPct30D: 0,
    stablecoin: false,
    ilRisk: 'no',
    exposure: 'single',
    predictions: {},
    chainId: null,
    poolMeta: null,
    mu: 0,
    sigma: 0,
    count: 0,
    outlier: false,
    underlyings: ['ETH'],
    il7d: null,
    apyBaseInception: null,
    volumeUsd1d: null,
    volumeUsd7d: null,
    astarTvlUsd: null,
  },
]

describe('POST /api/optimize', () => {
  let app: FastifyInstance

  before(async () => {
    app = buildTestApp(mockPools)
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  it('returns 200 with ranked results', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: { assets: ['USDC'] },
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.ok(body.query_id)
    assert.ok(body.timestamp)
    assert.ok(Array.isArray(body.results))
    assert.ok(body.results.length > 0)
    assert.ok(body.meta.total_pools_scanned >= 0)
    assert.ok(body.meta.chains_covered.length > 0)
  })

  it('returns pools with correct structure', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: { assets: ['USDC'], max_results: 1 },
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    const pool = body.results[0]

    assert.ok(typeof pool.rank === 'number')
    assert.ok(typeof pool.protocol === 'string')
    assert.ok(typeof pool.chain === 'string')
    assert.ok(typeof pool.pool === 'string')
    assert.ok(typeof pool.asset === 'string')
    assert.ok(typeof pool.apy.total === 'number')
    assert.ok(typeof pool.apy.base === 'number')
    assert.ok(typeof pool.apy.rewards === 'number')
    assert.ok(typeof pool.apy.net_estimated === 'number')
    assert.ok(typeof pool.tvl_usd === 'number')
    assert.ok([1, 2, 3, 4, 5].includes(pool.risk_score))
    assert.ok(Array.isArray(pool.risk_factors))
    assert.ok(typeof pool.entry.protocol_address === 'string')
    assert.ok(typeof pool.entry.method === 'string')
  })

  it('filters by chain', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: { assets: ['USDC'], chains: ['eip155:196'] },
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.ok(body.results.every((r: { chain: string }) => r.chain === 'X Layer'))
  })

  it('returns empty results for unmatched assets', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: { assets: ['SOL'] },
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.strictEqual(body.results.length, 0)
  })

  it('returns 400 for missing assets', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: {},
    })

    assert.strictEqual(response.statusCode, 400)
  })

  it('returns 400 for empty assets array', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/optimize',
      payload: { assets: [] },
    })

    assert.strictEqual(response.statusCode, 400)
  })

  it('returns 404 for unknown route', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/unknown',
    })

    assert.strictEqual(response.statusCode, 404)
  })
})
