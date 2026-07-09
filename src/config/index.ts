import envSchema from 'env-schema'
import { Type, type Static } from '@sinclair/typebox'

const schema = Type.Object({
  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: '0.0.0.0' }),
  LOG_LEVEL: Type.Union([
    Type.Literal('trace'),
    Type.Literal('debug'),
    Type.Literal('info'),
    Type.Literal('warn'),
    Type.Literal('error'),
    Type.Literal('fatal'),
  ], { default: 'info' }),
  PAY_TO_ADDRESS: Type.String({ default: '0x0000000000000000000000000000000000000000' }),
  SKIP_X402: Type.Boolean({ default: false }),
  DEFILLAMA_POOLS_URL: Type.String({ default: 'https://yields.llama.fi/pools' }),
  DEFILLAMA_PROTOCOL_URL: Type.String({ default: 'https://api.llama.fi/protocol' }),
  CACHE_TTL_SECONDS: Type.Number({ default: 300 }),
  CACHE_MAX_ITEMS: Type.Number({ default: 1000 }),
})

export type Config = Static<typeof schema>

export function loadConfig(): Config {
  return envSchema<Config>({
    schema,
    dotenv: true,
  })
}
