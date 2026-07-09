import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { loadConfig, type Config } from '../config/index.ts'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
  }
}

export default fp(async function configPlugin(fastify: FastifyInstance) {
  const config = loadConfig()
  fastify.decorate('config', config)
  fastify.log.info({ config: { ...config, PAY_TO_ADDRESS: '[redacted]' } }, 'Config loaded')
}, {
  name: 'config',
})
