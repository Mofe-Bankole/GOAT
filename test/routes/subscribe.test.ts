import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import Fastify from 'fastify'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyInstance } from 'fastify'
import subscribeRoutes from '../../src/routes/subscribe.ts'

function buildTestApp(): FastifyInstance {
  const app = Fastify({ logger: false }).withTypeProvider<TypeBoxTypeProvider>()
  app.register(subscribeRoutes)
  return app
}

describe('POST /api/subscribe', () => {
  let app: FastifyInstance

  before(async () => {
    app = buildTestApp()
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  it('creates a subscription and returns 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscribe',
      payload: {
        webhook_url: 'https://example.com/hook',
        params: { assets: ['USDC'] },
      },
    })

    assert.strictEqual(response.statusCode, 201)
    const body = response.json()
    assert.ok(body.id)
    assert.strictEqual(body.webhook_url, 'https://example.com/hook')
    assert.deepStrictEqual(body.params.assets, ['USDC'])
    assert.strictEqual(body.hook_failures, 0)
    assert.strictEqual(body.last_notified, null)
  })

  it('returns 400 for missing webhook_url', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscribe',
      payload: { params: { assets: ['USDC'] } },
    })

    assert.strictEqual(response.statusCode, 400)
  })

  it('returns 400 for missing params.assets', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscribe',
      payload: { webhook_url: 'https://example.com/hook', params: {} },
    })

    assert.strictEqual(response.statusCode, 400)
  })
})

describe('GET /api/subscribe/:id', () => {
  let app: FastifyInstance
  let subId: string

  before(async () => {
    app = buildTestApp()
    await app.ready()
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscribe',
      payload: {
        webhook_url: 'https://example.com/hook',
        params: { assets: ['ETH'] },
      },
    })
    subId = response.json().id
  })

  after(async () => {
    await app.close()
  })

  it('returns subscription by id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/subscribe/${subId}`,
    })

    assert.strictEqual(response.statusCode, 200)
    const body = response.json()
    assert.strictEqual(body.id, subId)
    assert.strictEqual(body.webhook_url, 'https://example.com/hook')
    assert.deepStrictEqual(body.params.assets, ['ETH'])
  })

  it('returns 404 for unknown id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/subscribe/nonexistent-id',
    })

    assert.strictEqual(response.statusCode, 404)
  })
})

describe('DELETE /api/subscribe/:id', () => {
  let app: FastifyInstance
  let subId: string

  before(async () => {
    app = buildTestApp()
    await app.ready()
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscribe',
      payload: {
        webhook_url: 'https://example.com/hook',
        params: { assets: ['BTC'] },
      },
    })
    subId = response.json().id
  })

  after(async () => {
    await app.close()
  })

  it('deletes subscription and returns 204', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/subscribe/${subId}`,
    })

    assert.strictEqual(response.statusCode, 204)

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/subscribe/${subId}`,
    })
    assert.strictEqual(getResponse.statusCode, 404)
  })

  it('returns 404 for deleting unknown id', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/subscribe/nonexistent',
    })

    assert.strictEqual(response.statusCode, 404)
  })
})
