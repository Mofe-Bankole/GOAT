import type { QueryParams } from '../types/index.ts'
import type { RankedPool } from './ranker.ts'
import crypto from 'node:crypto'

export interface Subscription {
  id: string
  webhookUrl: string
  params: QueryParams
  lastSnapshot: RankedPool[] | null
  lastNotified: number | null
  created: number
  hookFailures: number
}

const store = new Map<string, Subscription>()

export function createSubscription(webhookUrl: string, params: QueryParams): Subscription {
  const id = crypto.randomUUID()
  const sub: Subscription = {
    id,
    webhookUrl,
    params,
    lastSnapshot: null,
    lastNotified: null,
    created: Date.now(),
    hookFailures: 0,
  }
  store.set(id, sub)
  return sub
}

export function getSubscription(id: string): Subscription | undefined {
  return store.get(id)
}

export function deleteSubscription(id: string): boolean {
  return store.delete(id)
}

export function listSubscriptions(): Subscription[] {
  return [...store.values()]
}

export function updateSnapshot(id: string, snapshot: RankedPool[]): void {
  const sub = store.get(id)
  if (sub) sub.lastSnapshot = snapshot
}

export function markNotified(id: string): void {
  const sub = store.get(id)
  if (sub) {
    sub.lastNotified = Date.now()
    sub.hookFailures = 0
  }
}

export function markHookFailed(id: string): void {
  const sub = store.get(id)
  if (sub) sub.hookFailures++
}
