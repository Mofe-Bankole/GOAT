import type { FastifyInstance } from 'fastify'
import { QueryParamsSchema, OptimizeResponseSchema, SUPPORTED_CHAINS } from '../types/index.ts'
import type { QueryParams } from '../types/index.ts'
import { scanPools } from '../services/pool-scanner.ts'
import { scorePool } from '../services/risk-scorer.ts'
import { calculateApy } from '../services/apy-calculator.ts'
import { rankPools } from '../services/ranker.ts'
import { verifyPoolOnchain } from '../services/onchain-verifier.ts'
import type { OnchainVerification } from '../types/index.ts'
import { DefiLlamaError } from '../utils/errors.ts'
import crypto from 'node:crypto'

async function getProtocolSlugs(pools: Array<{ project: string }>): Promise<string[]> {
  const slugs = new Set(pools.map(p => p.project.toLowerCase().replace(/\s+/g, '-')))
  return [...slugs].filter(Boolean)
}

export default async function optimizeRoutes(fastify: FastifyInstance) {
  fastify.post('/api/optimize', {
    schema: {
      body: QueryParamsSchema,
      response: {
        200: OptimizeResponseSchema,
      },
    },
  }, async (request, reply) => {
    const params = request.body as QueryParams

    let allPools
    try {
      allPools = await fastify.defillama.fetchAllPools()
    } catch (err) {
      throw new DefiLlamaError(err instanceof Error ? err.message : 'unknown error')
    }

    const scanned = scanPools(params, allPools)

    const protocolSlugs = await getProtocolSlugs(scanned)
    const protocolMetaMap = new Map<string, Awaited<ReturnType<typeof fastify.defillama.fetchProtocol>>>()

    await Promise.allSettled(
      protocolSlugs.map(async (slug) => {
        try {
          const meta = await fastify.defillama.fetchProtocol(slug)
          if (meta) protocolMetaMap.set(slug, meta)
        } catch {
          // Protocol metadata fetch failures are non-fatal
        }
      })
    )

    const riskScores = new Map<string, ReturnType<typeof scorePool>>()
    const apyValues = new Map<string, ReturnType<typeof calculateApy>>()
    const onchainResults = new Map<string, OnchainVerification>()

    await Promise.allSettled(
      scanned.map(async (pool) => {
        const slug = pool.project.toLowerCase().replace(/\s+/g, '-')
        const protocolMeta = protocolMetaMap.get(slug)
        const poolKey = pool.pool

        const onchain = await verifyPoolOnchain(pool, fastify.config.RPC_URLS)
        onchainResults.set(poolKey, onchain)

        const risk = scorePool(pool, protocolMeta, onchain)
        riskScores.set(poolKey, risk)

        const apy = calculateApy(pool, params.execution_context)
        apyValues.set(poolKey, apy)
      })
    )

    const riskTolerance = params.risk_tolerance ?? 'moderate'
    const maxResults = params.max_results ?? 10
    const ranked = rankPools(scanned, riskScores, apyValues, riskTolerance, maxResults, onchainResults)

    const chainsCovered = [...new Set(scanned.map(p => SUPPORTED_CHAINS[p.chainCaip2] ?? p.chain))]

    const query_id = crypto.randomUUID()

    return {
      query_id,
      timestamp: Date.now(),
      results: ranked,
      meta: {
        total_pools_scanned: scanned.length,
        chains_covered: chainsCovered,
        data_freshness_seconds: fastify.config.CACHE_TTL_SECONDS,
      },
    }
  })
}
