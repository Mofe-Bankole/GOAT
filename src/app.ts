import Fastify from 'fastify'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyInstance, FastifyError } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'

import configPlugin from './plugins/config.ts'
import cachePlugin from './plugins/cache.ts'
import defillamaPlugin from './plugins/defillama.ts'
import x402Plugin from './plugins/x402.ts'
import demoRoutes from './routes/demo.ts'
import optimizeRoutes from './routes/optimize.ts'
import subscribeRoutes from './routes/subscribe.ts'
import { startWatcher } from './services/yield-watcher.ts'

export type AppInstance = FastifyInstance

export async function buildApp(): Promise<AppInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  }).withTypeProvider<TypeBoxTypeProvider>()

  await app.register(cors)

  await app.register(configPlugin)
  await app.register(cachePlugin)

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip
    },
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Max ${context.max} requests per ${context.after}. Try again later.`,
    }),
  })

  await app.register(defillamaPlugin)

  app.get('/health', async () => ({ status: 'ok', timestamp: Date.now() }))

  await app.register(demoRoutes)

  await app.register(x402Plugin)

  await app.register(optimizeRoutes)
  await app.register(subscribeRoutes)

  app.addHook('onReady', () => {
    const watcher = startWatcher(app.defillama, app.config.RPC_URLS)
    app.addHook('onClose', (_instance, done) => {
      watcher.stop()
      done()
    })
  })

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error }, 'Request error')

    if (error.validation) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      })
    }

    const statusCode = error.statusCode ?? 500

    return reply.code(statusCode).send({
      statusCode,
      error: error.code ?? 'INTERNAL_ERROR',
      message: error.message,
    })
  })

  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    })
  })

  return app
}
