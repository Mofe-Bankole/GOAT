import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'

interface CacheEntry {
  value: unknown
  expires: number
}

declare module 'fastify' {
  interface FastifyInstance {
    cache: {
      get<T>(key: string): T | undefined
      set(key: string, value: unknown): void
      has(key: string): boolean
      clear(): void
    }
  }
}

export default fp(async function cachePlugin(fastify: FastifyInstance) {
  const ttl = fastify.config.CACHE_TTL_SECONDS * 1000
  const maxItems = fastify.config.CACHE_MAX_ITEMS
  const store = new Map<string, CacheEntry>()

  function prune() {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.expires) {
        store.delete(key)
      }
    }
  }

  function evictIfNeeded() {
    if (store.size >= maxItems) {
      const oldest = store.keys().next().value
      if (oldest) store.delete(oldest)
    }
  }

  fastify.decorate('cache', {
    get<T>(key: string): T | undefined {
      const entry = store.get(key)
      if (!entry) return undefined
      if (Date.now() > entry.expires) {
        store.delete(key)
        return undefined
      }
      return entry.value as T
    },

    set(key: string, value: unknown): void {
      prune()
      evictIfNeeded()
      store.set(key, { value, expires: Date.now() + ttl })
    },

    has(key: string): boolean {
      const entry = store.get(key)
      if (!entry) return false
      if (Date.now() > entry.expires) {
        store.delete(key)
        return false
      }
      return true
    },

    clear(): void {
      store.clear()
    },
  })
}, {
  name: 'cache',
  dependencies: ['config'],
})
