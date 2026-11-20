import { describe, expect, it } from 'vitest'
import { getUserFacingError } from './userFacingError'

describe('getUserFacingError', () => {
  it('maps statuses and never exposes backend messages', () => {
    expect(getUserFacingError(Object.assign(new Error('AttributeError: private detail'), { status: 503 }))).toBe('Terjadi kesalahan pada layanan. Silakan coba kembali.')
    expect(getUserFacingError(Object.assign(new Error('raw response'), { status: 422 }))).toBe('Periksa kembali informasi yang Anda masukkan.')
    expect(getUserFacingError(new Error('Set VITE_API_BASE_URL'))).toBe('Layanan belum tersedia saat ini.')
    expect(getUserFacingError({ detail: 'SQL query failure' })).toBe('Terjadi kesalahan yang tidak terduga. Silakan coba kembali beberapa saat lagi.')
  })

  it('recognizes unavailable services and transport failures', () => {
    expect(getUserFacingError(Object.assign(new Error('internal'), { name: 'ActionCenterConfigurationError' }))).toBe('Layanan belum tersedia saat ini.')
    expect(getUserFacingError(Object.assign(new Error('internal'), { code: 'TIMEOUT' }))).toBe('Permintaan membutuhkan waktu terlalu lama.')
    expect(getUserFacingError(Object.assign(new Error('internal'), { code: 'NETWORK_ERROR' }))).toBe('Tidak dapat terhubung ke layanan. Periksa koneksi internet Anda.')
  })

  it.each([
    [400, 'Periksa kembali informasi yang Anda masukkan.'],
    [401, 'Sesi Anda tidak valid atau telah berakhir.'],
    [403, 'Anda tidak memiliki izin untuk melakukan tindakan ini.'],
    [404, 'Data yang diminta tidak ditemukan.'],
    [422, 'Periksa kembali informasi yang Anda masukkan.'],
    [500, 'Terjadi kesalahan pada layanan. Silakan coba kembali.'],
    [502, 'Terjadi kesalahan pada layanan. Silakan coba kembali.'],
    [503, 'Terjadi kesalahan pada layanan. Silakan coba kembali.'],
    [504, 'Terjadi kesalahan pada layanan. Silakan coba kembali.'],
    [418, 'Terjadi kesalahan yang tidak terduga. Silakan coba kembali beberapa saat lagi.'],
  ])('maps HTTP %i to a controlled message', (status, message) => {
    expect(getUserFacingError(Object.assign(new Error('private backend exception'), { status }))).toBe(message)
  })
})
