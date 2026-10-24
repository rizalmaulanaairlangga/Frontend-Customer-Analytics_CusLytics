import { describe, expect, it, vi } from 'vitest'
import { createApiDataQualityService, createDataQualityService, DataQualityConfigurationError, parseDataQualitySnapshot } from './dataQualityService'
import type { DataQualitySnapshot } from '../types/dataQuality'

const snapshot: DataQualitySnapshot = {
  dataset: { readStatus: 'available', validationStatus: 'warning', fileIdentity: 'retail-v2.csv', rowCount: 100, columnCount: 8, transactionDateRange: { start: '2010-12-01', end: '2011-12-09' }, lastCheckedAt: '2012-01-01T00:00:00Z' },
  columns: [{ sourceName: 'Invoice', conceptualName: 'Invoice', detectedType: 'string', role: 'Transaction identifier', validationStatus: 'passed' }],
  indicators: {
    missing_values: { count: 4, details: 'Four missing cells.' }, duplicate_rows: { count: 2 }, cancellation_invoices: { count: null }, negative_quantity: { count: null }, nonpositive_price: { count: null }, invalid_dates: { count: null }, missing_customer_id: { count: null }, missing_product_id: { count: null },
  },
  findingCategories: [{ category: 'missing', count: 4, label: 'Missing values', detail: 'Four cells' }],
  cleaningAudit: { rowCounts: { before: 100, retained: null, excluded: null }, exclusionReasons: [], rules: [{ id: 'returns', topic: 'Returns', description: 'Awaiting policy.', impact: 'Not applied.', affectedRows: null, status: 'pending' }] },
  warnings: [],
}

describe('data quality service', () => {
  it('accepts structurally valid backend values without making them up', () => {
    expect(parseDataQualitySnapshot(snapshot)).toEqual(snapshot)
  })

  it('rejects malformed snapshots and invalid identifiers', () => {
    expect(() => parseDataQualitySnapshot({ ...snapshot, indicators: { ...snapshot.indicators, missing_values: { count: -3 } } })).toThrow(/quality response/i)
    expect(() => parseDataQualitySnapshot({ ...snapshot, columns: [{ ...snapshot.columns[0], conceptualName: 7 }] })).toThrow(/quality response/i)
    expect(() => parseDataQualitySnapshot({ ...snapshot, findingCategories: [...snapshot.findingCategories, ...snapshot.findingCategories] })).toThrow(/quality response/i)
  })

  it('preserves source column aliases when a conceptual mapping is not provided', () => {
    const aliased = { ...snapshot, columns: [{ ...snapshot.columns[0], sourceName: 'Invoice No', conceptualName: undefined }] }
    expect(parseDataQualitySnapshot(aliased).columns[0].sourceName).toBe('Invoice No')
  })

  it('requires a configured path in API mode and does not assume an endpoint', async () => {
    await expect(createApiDataQualityService('', '').getSnapshot()).rejects.toBeInstanceOf(DataQualityConfigurationError)
    await expect(createApiDataQualityService('', '/quality').getSnapshot()).rejects.toThrow(/VITE_API_BASE_URL/)
  })

  it('returns an unconnected state in demo mode without a quality fixture', async () => {
    const service = createDataQualityService({ mode: 'demo', baseUrl: '', resourcePath: '' })
    await expect(service.getSnapshot()).resolves.toBeNull()
  })

  it('uses the configured resource path and marks the response as backend data', async () => {
    const getJson = vi.fn().mockResolvedValue(snapshot)
    const service = createApiDataQualityService('https://example.test/api', '/quality', getJson)
    await expect(service.getSnapshot()).resolves.toEqual({ ...snapshot, source: 'api' })
    expect(getJson).toHaveBeenCalledWith('/quality', 'https://example.test/api', {}, { signal: undefined })
  })
})
