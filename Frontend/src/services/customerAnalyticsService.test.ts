import { describe, expect, it, vi } from 'vitest'
import { createApiCustomerAnalyticsService, createCustomerAnalyticsService, CustomerAnalyticsConfigurationError, parseCustomerAnalyticsSnapshot } from './customerAnalyticsService'

const snapshot = {
  summary: { eligibleCustomers: 3, customersWithRfmProfiles: 2, observationDate: '2026-08-01', analysisPeriod: { start: '2026-01-01', end: '2026-07-31' }, segmentationStatus: 'unavailable' },
  distributions: { recency: [{ label: '0–30 days', count: 1, rangeStart: 0, rangeEnd: 30 }], frequency: [], monetary: [] },
  customers: [{ customerId: '0007-A', recency: 12, frequency: 4, monetary: 45.5, clusterLabel: null, profile: null }],
}

describe('customer analytics service', () => {
  it('validates source values and keeps customer IDs as strings', () => {
    expect(parseCustomerAnalyticsSnapshot(snapshot)).toEqual(snapshot)
  })

  it('rejects missing required fields and fabricated invalid counts', () => {
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, customers: [{ ...snapshot.customers[0], customerId: 7 }] })).toThrow(/customer analytics response/i)
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, customers: [{ ...snapshot.customers[0], frequency: -1 }] })).toThrow(/customer analytics response/i)
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, customers: [{ ...snapshot.customers[0], recency: 2.5 }] })).toThrow(/customer analytics response/i)
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, customers: [snapshot.customers[0], snapshot.customers[0]] })).toThrow(/customer analytics response/i)
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, customers: [{ ...snapshot.customers[0], history: [{ period: 'p1', label: 'P1', uniqueInvoices: 1.5 }] }] })).toThrow(/customer analytics response/i)
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, distributions: { ...snapshot.distributions, recency: [{ label: 'bad', count: -1 }] } })).toThrow(/customer analytics response/i)
    expect(parseCustomerAnalyticsSnapshot({ ...snapshot, summary: { ...snapshot.summary, eligibleCustomers: undefined }, distributions: undefined }).summary.eligibleCustomers).toBeUndefined()
    expect(() => parseCustomerAnalyticsSnapshot({ ...snapshot, summary: { ...snapshot.summary, eligibleCustomers: -1 } })).toThrow(/customer analytics response/i)
  })

  it('returns no fixture in demo mode', async () => {
    await expect(createCustomerAnalyticsService({ mode: 'demo', baseUrl: '', resourcePath: '' }).getSnapshot()).resolves.toBeNull()
  })

  it('requires an agreed resource path and base URL in API mode', async () => {
    await expect(createApiCustomerAnalyticsService('', '').getSnapshot()).rejects.toBeInstanceOf(CustomerAnalyticsConfigurationError)
    await expect(createApiCustomerAnalyticsService('', '/customers').getSnapshot()).rejects.toThrow(/VITE_API_BASE_URL/)
    await expect(createApiCustomerAnalyticsService('https://api.example.test', '').getSnapshot()).rejects.toThrow(/Confirm the backend contract/)
  })

  it('uses the configured path and marks validated values as API data', async () => {
    const request = vi.fn().mockResolvedValue(snapshot)
    const service = createApiCustomerAnalyticsService('https://api.example.test', '/agreed/customer-rfm', request)
    await expect(service.getSnapshot()).resolves.toMatchObject({ source: 'api', customers: [{ customerId: '0007-A' }] })
    expect(request).toHaveBeenCalledWith('/agreed/customer-rfm', 'https://api.example.test', {}, { signal: undefined })
  })

  it('preserves request errors for the page to report', async () => {
    const failure = new Error('Customer endpoint unavailable.')
    const request = vi.fn().mockRejectedValue(failure)
    await expect(createApiCustomerAnalyticsService('https://api.example.test', '/customer-rfm', request).getSnapshot()).rejects.toBe(failure)
  })
})
