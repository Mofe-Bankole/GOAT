import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { DefiLlamaError } from '../utils/errors.ts'
import type { DefiLlamaPool, DefiLlamaProtocol } from '../types/index.ts'

interface DefiLlamaResponse {
  status: 'success' | 'error'
  data: DefiLlamaPool[]
}

declare module 'fastify' {
  interface FastifyInstance {
    defillama: {
      fetchAllPools(): Promise<DefiLlamaPool[]>
      fetchProtocol(slug: string): Promise<DefiLlamaProtocol | null>
    }
  }
}

export default fp(async function defillamaPlugin(fastify: FastifyInstance) {
  const poolsUrl = fastify.config.DEFILLAMA_POOLS_URL
  const protocolUrl = fastify.config.DEFILLAMA_PROTOCOL_URL

  async function fetchAllPools(): Promise<DefiLlamaPool[]> {
    const cacheKey = 'defillama:all_pools'
    const cached = fastify.cache.get<DefiLlamaPool[]>(cacheKey)
    if (cached) return cached

    const response = await fetch(poolsUrl)
    if (!response.ok) {
      throw new DefiLlamaError(`HTTP ${response.status}: ${response.statusText}`)
    }

    const body = (await response.json()) as DefiLlamaResponse
    if (body.status !== 'success' || !Array.isArray(body.data)) {
      throw new DefiLlamaError('unexpected response format')
    }

    fastify.cache.set(cacheKey, body.data)
    return body.data
  }

  async function fetchProtocol(slug: string): Promise<DefiLlamaProtocol | null> {
    const cacheKey = `defillama:protocol:${slug}`
    const cached = fastify.cache.get<DefiLlamaProtocol>(cacheKey)
    if (cached) return cached

    const url = `${protocolUrl}/${slug}`
    const response = await fetch(url)
    if (response.status === 404) return null
    if (!response.ok) {
      throw new DefiLlamaError(`HTTP ${response.status} for protocol ${slug}`)
    }

    const body = (await response.json()) as DefiLlamaProtocol
    fastify.cache.set(cacheKey, body)
    return body
  }

  fastify.decorate('defillama', { fetchAllPools, fetchProtocol })
}, {
  name: 'defillama',
  dependencies: ['config', 'cache'],
})
