import { buildApp } from './app.ts'

async function main() {
  const app = await buildApp()
  const { PORT, HOST } = app.config

  await app.listen({ port: PORT, host: HOST })
  app.log.info(`Demeter Yield Optimizer ASP running on http://${HOST}:${PORT}`)

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`)
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
