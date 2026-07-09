import createError from '@fastify/error'

export const DefiLlamaError = createError(
  'DEFILLAMA_ERROR',
  'DefiLlama API error: %s',
  502
)

export const ExternalServiceError = createError(
  'EXTERNAL_SERVICE_ERROR',
  'External service error: %s',
  502
)

export const PoolScanError = createError(
  'POOL_SCAN_ERROR',
  'Pool scan failed: %s',
  500
)
