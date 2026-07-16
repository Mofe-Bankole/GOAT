import type { ScannedPool } from './pool-scanner.ts'
import { parseRpcUrls } from '../config/index.ts'

export interface OnchainResult {
  verified: boolean | null
  note: string
  upgradeable?: boolean | null
  admin_type?: 'eoa' | 'contract' | 'none' | null
  admin_address?: string | null
}

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const ERC1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
const ERC1967_ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'

function isEvmAddress(addr: string): boolean {
  return EVM_ADDRESS_RE.test(addr)
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function parseStorageAddress(storage: unknown): string | null {
  if (typeof storage !== 'string' || storage === '0x') return null
  const raw = storage.length >= 66 ? '0x' + storage.slice(26) : storage
  if (!isEvmAddress(raw) || raw.toLowerCase() === ZERO_ADDRESS) return null
  return raw.toLowerCase()
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

async function checkUpgradeAuthority(
  rpcUrl: string,
  address: string
): Promise<Pick<OnchainResult, 'upgradeable' | 'admin_type' | 'admin_address'>> {
  try {
    const [implSlot, adminSlot] = await Promise.all([
      jsonRpcCall(rpcUrl, 'eth_getStorageAt', [address, ERC1967_IMPLEMENTATION_SLOT, 'latest']),
      jsonRpcCall(rpcUrl, 'eth_getStorageAt', [address, ERC1967_ADMIN_SLOT, 'latest']),
    ])

    const implAddr = parseStorageAddress(implSlot)
    if (!implAddr) {
      return { upgradeable: false, admin_type: 'none', admin_address: null }
    }

    const adminAddr = parseStorageAddress(adminSlot)
    if (!adminAddr) {
      return { upgradeable: true, admin_type: null, admin_address: implAddr }
    }

    const adminCode = await jsonRpcCall(rpcUrl, 'eth_getCode', [adminAddr, 'latest'])
    const isContract = typeof adminCode === 'string' && adminCode !== '0x'

    return {
      upgradeable: true,
      admin_type: isContract ? 'contract' : 'eoa',
      admin_address: adminAddr,
    }
  } catch {
    return { upgradeable: null, admin_type: null, admin_address: null }
  }
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
    const [code, upgrade] = await Promise.all([
      jsonRpcCall(rpcUrl, 'eth_getCode', [pool.pool, 'latest']),
      checkUpgradeAuthority(rpcUrl, pool.pool),
    ])

    if (code === null) {
      return { verified: null, note: 'RPC request failed', ...upgrade }
    }

    const hasCode = typeof code === 'string' && code !== '0x'
    const parts: string[] = []
    if (hasCode) parts.push('contract verified on-chain')
    else parts.push('no contract found at pool address')

    if (upgrade.upgradeable) {
      parts.push('upgradeable proxy detected')
      if (upgrade.admin_type === 'eoa') {
        parts.push('admin is an EOA (single-key rug risk)')
      } else if (upgrade.admin_type === 'contract') {
        parts.push('admin is a contract (likely multisig/timelock)')
      }
    } else if (upgrade.upgradeable === false) {
      parts.push('non-upgradeable (no ERC-1967 proxy)')
    }

    return {
      verified: hasCode,
      note: parts.join('; '),
      ...upgrade,
    }
  } catch {
    return { verified: null, note: 'on-chain verification error' }
  }
}
