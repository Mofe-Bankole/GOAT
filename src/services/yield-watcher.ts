import { scanPools, type ScannedPool } from './pool-scanner.ts'
import { scorePool } from './risk-scorer.ts'
import { calculateApy } from './apy-calculator.ts'
import { rankPools, type RankedPool } from './ranker.ts'
import { verifyPoolOnchain } from './onchain-verifier.ts'
import { listSubscriptions, updateSnapshot, markNotified, markHookFailed } from './subscription-store.ts'
import type { OnchainVerification, DefiLlamaPool, DefiLlamaProtocol } from '../types/index.ts'

const APY_CHANGE_THRESHOLD = 0.5

interface PoolChange {
  pool: string
  protocol: string
  chain: string
  apy_before: number
  apy_after: number
  change_pct: number
}

interface WebhookPayload {
  event: 'yield_change'
  subscription_id: string
  timestamp: number
  changes: PoolChange[]
  current: RankedPool[]
}

function diffSnapshots(prev: RankedPool[], current: RankedPool[]): PoolChange[] {
  const changes: PoolChange[] = []
  const prevMap = new Map(prev.map(p => [p.pool, p]))

  for (const pool of current) {
    const prevPool = prevMap.get(pool.pool)
    if (!prevPool) {
      changes.push({
        pool: pool.pool,
        protocol: pool.protocol,
        chain: pool.chain,
        apy_before: 0,
        apy_after: pool.apy.total,
        change_pct: 100,
      })
      continue
    }
    const diff = Math.abs(pool.apy.total - prevPool.apy.total)
    if (diff >= APY_CHANGE_THRESHOLD) {
      changes.push({
        pool: pool.pool,
        protocol: pool.protocol,
        chain: pool.chain,
        apy_before: prevPool.apy.total,
        apy_after: pool.apy.total,
        change_pct: prevPool.apy.total > 0
          ? ((pool.apy.total - prevPool.apy.total) / prevPool.apy.total) * 100
          : 100,
      })
    }
  }

  return changes
}

export async function checkYieldChanges(
  defillama: {
    fetchAllPools(): Promise<DefiLlamaPool[]>
    fetchProtocol(slug: string): Promise<DefiLlamaProtocol | null>
  },
  rpcUrls: string
): Promise<void> {
  const subscriptions = listSubscriptions()
  if (subscriptions.length === 0) return

  const allPools = await defillama.fetchAllPools()

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const scanned = scanPools(sub.params, allPools)

        const protocolSlugs = [...new Set(scanned.map(p =>
          p.project.toLowerCase().replace(/\s+/g, '-')
        ))].filter(Boolean)

        const protocolMetaMap = new Map<string, DefiLlamaProtocol>()
        await Promise.allSettled(
          protocolSlugs.map(async (slug) => {
            try {
              const meta = await defillama.fetchProtocol(slug)
              if (meta) protocolMetaMap.set(slug, meta)
            } catch { /* non-fatal */ }
          })
        )

        const riskScores = new Map<string, ReturnType<typeof scorePool>>()
        const apyValues = new Map<string, ReturnType<typeof calculateApy>>()
        const onchainResults = new Map<string, OnchainVerification>()

        for (const pool of scanned) {
          const slug = pool.project.toLowerCase().replace(/\s+/g, '-')
          const protocolMeta = protocolMetaMap.get(slug)
          const onchain = await verifyPoolOnchain(pool, rpcUrls)
          onchainResults.set(pool.pool, onchain)
          riskScores.set(pool.pool, scorePool(pool, protocolMeta, onchain))
          apyValues.set(pool.pool, calculateApy(pool, sub.params.execution_context))
        }

        const riskTolerance = sub.params.risk_tolerance ?? 'moderate'
        const maxResults = sub.params.max_results ?? 10
        const ranked = rankPools(scanned, riskScores, apyValues, riskTolerance, maxResults, onchainResults)

        if (sub.lastSnapshot) {
          const changes = diffSnapshots(sub.lastSnapshot, ranked)
          if (changes.length > 0) {
            const payload: WebhookPayload = {
              event: 'yield_change',
              subscription_id: sub.id,
              timestamp: Date.now(),
              changes,
              current: ranked,
            }

            const response = await fetch(sub.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

            if (response.ok) {
              markNotified(sub.id)
            } else {
              markHookFailed(sub.id)
            }
          }
        }

        updateSnapshot(sub.id, ranked)
      } catch {
        markHookFailed(sub.id)
      }
    })
  )
}

export function startWatcher(
  defillama: {
    fetchAllPools(): Promise<DefiLlamaPool[]>
    fetchProtocol(slug: string): Promise<DefiLlamaProtocol | null>
  },
  rpcUrls: string,
  intervalMs: number = 5 * 60 * 1000
): { stop: () => void } {
  const timer = setInterval(() => {
    checkYieldChanges(defillama, rpcUrls).catch(() => {})
  }, intervalMs)

  checkYieldChanges(defillama, rpcUrls).catch(() => {})

  return {
    stop: () => clearInterval(timer),
  }
}
