import { buildApp, type AppInstance } from '../src/app.ts'

let app: AppInstance | undefined

export default async function handler(req: any, res: any) {
  if (!app) {
    app = await buildApp()
    await app.ready()
  }
  app.server.emit('request', req, res)
}
