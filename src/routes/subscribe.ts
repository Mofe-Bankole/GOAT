import type { FastifyInstance } from 'fastify'
import { SubscribeRequestSchema, SubscriptionResponseSchema } from '../types/index.ts'
import type { SubscribeRequest } from '../types/index.ts'
import {
  createSubscription,
  getSubscription,
  deleteSubscription,
} from '../services/subscription-store.ts'

export default async function subscribeRoutes(fastify: FastifyInstance) {
  fastify.post('/api/subscribe', {
    schema: {
      body: SubscribeRequestSchema,
      response: {
        201: SubscriptionResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { webhook_url, params } = request.body as SubscribeRequest
    const sub = createSubscription(webhook_url, params)

    return reply.code(201).send({
      id: sub.id,
      webhook_url: sub.webhookUrl,
      params: {
        assets: sub.params.assets,
        chains: sub.params.chains,
        risk_tolerance: sub.params.risk_tolerance,
        min_tvl_usd: sub.params.min_tvl_usd,
        max_results: sub.params.max_results,
        min_apy: sub.params.min_apy,
      },
      last_notified: sub.lastNotified,
      hook_failures: sub.hookFailures,
      created: sub.created,
    })
  })

  fastify.get('/api/subscribe/:id', {
    schema: {
      response: {
        200: SubscriptionResponseSchema,
        404: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const sub = getSubscription(id)
    if (!sub) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `Subscription ${id} not found`,
      })
    }

    return {
      id: sub.id,
      webhook_url: sub.webhookUrl,
      params: {
        assets: sub.params.assets,
        chains: sub.params.chains,
        risk_tolerance: sub.params.risk_tolerance,
        min_tvl_usd: sub.params.min_tvl_usd,
        max_results: sub.params.max_results,
        min_apy: sub.params.min_apy,
      },
      last_notified: sub.lastNotified,
      hook_failures: sub.hookFailures,
      created: sub.created,
    }
  })

  fastify.delete('/api/subscribe/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const deleted = deleteSubscription(id)
    if (!deleted) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `Subscription ${id} not found`,
      })
    }
    return reply.code(204).send()
  })
}
