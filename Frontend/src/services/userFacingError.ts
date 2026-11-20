export type UserFacingErrorCategory = 'unavailable' | 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'notFound' | 'validation' | 'server' | 'unknown'

const messages: Record<UserFacingErrorCategory, string> = {
  unavailable: 'Layanan belum tersedia saat ini.',
  network: 'Tidak dapat terhubung ke layanan. Periksa koneksi internet Anda.',
  timeout: 'Permintaan membutuhkan waktu terlalu lama.',
  unauthorized: 'Sesi Anda tidak valid atau telah berakhir.',
  forbidden: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  notFound: 'Data yang diminta tidak ditemukan.',
  validation: 'Periksa kembali informasi yang Anda masukkan.',
  server: 'Terjadi kesalahan pada layanan. Silakan coba kembali.',
  unknown: 'Terjadi kesalahan yang tidak terduga. Silakan coba kembali beberapa saat lagi.',
}

export function getUserFacingError(error: unknown): string {
  if (error instanceof Error && /not configured|VITE_|resource path|backend.*not connected|belum terhubung/i.test(error.message)) return messages.unavailable
  if (error instanceof Error && /service unavailable|backend unavailable/i.test(error.message)) return messages.unavailable
  if (error instanceof Error && /could not reach|failed to fetch|network error|not reachable/i.test(error.message)) return messages.network
  if (error instanceof Error && /timed out|timeout/i.test(error.message)) return messages.timeout
  if (error && typeof error === 'object') {
    const candidate = error as { status?: unknown; code?: unknown; name?: unknown }
    const name = typeof candidate.name === 'string' ? candidate.name : ''
    const code = typeof candidate.code === 'string' ? candidate.code : ''
    const status = typeof candidate.status === 'number' ? candidate.status : undefined
    if (/configurationerror|unavailableerror/i.test(name) || code === 'API_UNAVAILABLE') return messages.unavailable
    if (code === 'TIMEOUT' || name === 'TimeoutError') return messages.timeout
    if (code === 'NETWORK_ERROR') return messages.network
    if (status === 401) return messages.unauthorized
    if (status === 403) return messages.forbidden
    if (status === 404) return messages.notFound
    if (status === 400 || status === 422) return messages.validation
    if (status === 500 || status === 502 || status === 503 || status === 504 || (status !== undefined && status >= 500)) return messages.server
  }
  return messages.unknown
}
