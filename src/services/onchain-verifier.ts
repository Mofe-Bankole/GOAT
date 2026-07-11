import type { ScannedPool } from './pool-scanner.ts'
import { parseRpcUrls } from '../config/index.ts'
import type { Config } from '../config/index.ts'

export interface OnchainResult {
  verified: boolean | null
  note: string
}

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

function isEvmAddress(addr: string): boolean {
  return EVM_ADDRESS_RE.test(addr)
}

async function jsonRpcCall(url: string, method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })
  if (!response.ok) return null
  const body = await response.json() as { result?: unknown }
  return body?.result ?? null
}

export async function verifyPoolOnchain(
  pool: ScannedPool,
  rpcUrlsRaw: string
): Promise<OnchainResult> {
  const rpcUrls = parseRpcUrls(rpcUrlsRaw)
  const rpcUrl = rpcUrls[pool.chainCaip2]
  if (!rpcUrl) {
    return { verified: null, note: `no RPC configured for ${pool.chainCaip2}` }
  }

  if (!isEvmAddress(pool.pool)) {
    return { verified: null, note: 'non-EVM pool identifier, on-chain check not applicable' }
  }

  try {
    const code = await jsonRpcCall(rpcUrl, 'eth_getCode', [pool.pool, 'latest'])
    if (code === null) {
      return { verified: null, note: 'RPC request failed' }
    }
    const hasCode = typeof code === 'string' && code !== '0x'
    return {
      verified: hasCode,
      note: hasCode
        ? 'contract verified on-chain'
        : 'no contract found at pool address',
    }
  } catch {
    return { verified: null, note: 'on-chain verification error' }
  }
}
