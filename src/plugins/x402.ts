import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import expressPlugin from '@fastify/express'
import { paymentMiddlewareFromConfig, type SchemeRegistration } from '@okxweb3/x402-express'
import { ExactEvmScheme } from '@okxweb3/x402-evm/exact/server'

export default fp(async function x402Plugin(fastify: FastifyInstance) {
  if (fastify.config.SKIP_X402) {
    fastify.log.warn('x402 payment verification disabled via SKIP_X402')
    return
  }

  await fastify.register(expressPlugin)

  const schemes: SchemeRegistration[] = [
    {
      network: 'eip155:196',
      server: new ExactEvmScheme(),
    },
  ]

  const routes = {
    'POST /api/optimize': {
      accepts: {
        scheme: 'exact' as const,
        price: '$0.02',
        network: 'eip155:196' as const,
        payTo: fastify.config.PAY_TO_ADDRESS,
      },
      description: 'Yield optimization query',
      mimeType: 'application/json',
    },
  }

  const middleware = paymentMiddlewareFromConfig(routes, undefined, schemes)
  fastify.use(middleware)

  fastify.log.info('x402 payment middleware registered — $0.02 per /api/optimize call')
}, {
  name: 'x402',
  dependencies: ['config'],
})
