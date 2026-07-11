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
  RPC_URLS: Type.String({
    default: JSON.stringify({
      'eip155:196': 'https://xlayerrpc.okx.com',
      'eip155:8453': 'https://mainnet.base.org',
      'eip155:1': 'https://eth.drpc.org',
    }),
    description: 'JSON mapping of chain CAIP2 to RPC URL',
  }),
})

export type Config = Static<typeof schema>

export interface RpcMap {
  [caip2: string]: string
}

export function parseRpcUrls(raw: string): RpcMap {
  try {
    return JSON.parse(raw) as RpcMap
  } catch {
    return {}
  }
}

export function loadConfig(): Config {
  return envSchema<Config>({
    schema,
    dotenv: true,
  })
}
