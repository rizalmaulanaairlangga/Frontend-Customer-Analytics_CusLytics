import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiAnalyticsService } from './apiAnalyticsService'
import type { DashboardFilters } from '../types/analytics'

afterEach(() => vi.unstubAllGlobals())

const filters: DashboardFilters = { startDate: '', endDate: '', country: '' }

describe('createApiAnalyticsService', () => {
  it('refuses to guess an unconfirmed dashboard endpoint', async () => {
    const service = createApiAnalyticsService('https://api.example.test', '')
    await expect(service.getDashboard(filters, 'month')).rejects.toThrow('Confirm the backend contract')
  })

  it('rejects a malformed metric response instead of displaying invalid numbers', async () => {
    const response = {
      filters, interval: 'month',
      metrics: {
        salesValue: { value: 'profit', definition: 'Bad metric' },
        uniqueInvoices: { value: 10, definition: 'Invoices' },
        unitsSold: { value: 20, definition: 'Units' },
        identifiedCustomers: { value: 5, definition: 'Customers' },
      },
      trend: [], products: [], countryOptions: [], customerSummary: { identifiedCustomers: 5, rfmStatus: 'pending' }, status: {},
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 })))
    const service = createApiAnalyticsService('https://api.example.test', '/dashboard')

    await expect(service.getDashboard(filters, 'month')).rejects.toThrow('missing required dashboard fields')
  })

  it('preserves optional country, product invoice, and separate invoice/unit trend values', async () => {
    const response = {
      filters, interval: 'month',
      metrics: {
        salesValue: { value: 120, definition: 'Transaction value, not profit.' },
        uniqueInvoices: { value: 12, definition: 'Distinct invoice count.' },
        unitsSold: { value: 38, definition: 'Unit total.' },
        identifiedCustomers: { value: 7, definition: 'Customer identifiers.' },
      },
      trend: [{ period: '2026-01', label: 'Jan 2026', salesValue: 120, uniqueInvoices: 12, unitsSold: 38 }],
      products: [{ productId: 'P-1', description: 'Blue mug', salesValue: 120, unitsSold: 38, uniqueInvoices: 12 }],
      countries: [{ country: 'Indonesia', transactionValue: 120, uniqueInvoices: 12 }],
      countryOptions: ['Indonesia'], customerSummary: { identifiedCustomers: 7, rfmStatus: 'pending' }, status: {},
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 })))
    const service = createApiAnalyticsService('https://api.example.test', '/dashboard')

    await expect(service.getDashboard(filters, 'month')).resolves.toMatchObject({
      source: 'api', trend: [{ uniqueInvoices: 12, unitsSold: 38 }], products: [{ uniqueInvoices: 12 }],
      countries: [{ country: 'Indonesia', transactionValue: 120 }],
    })
  })

  it('rejects malformed optional analytical series instead of coercing values', async () => {
    const response = {
      filters, interval: 'month',
      metrics: {
        salesValue: { value: 120, definition: 'Transaction value.' },
        uniqueInvoices: { value: 12, definition: 'Invoices.' }, unitsSold: { value: 38, definition: 'Units.' }, identifiedCustomers: { value: 7, definition: 'Customers.' },
      },
      trend: [{ period: '2026-01', label: 'Jan', salesValue: 120, unitsSold: 'many' }], products: [], countries: [], countryOptions: [],
      customerSummary: { identifiedCustomers: 7, rfmStatus: 'pending' }, status: {},
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 })))
    const service = createApiAnalyticsService('https://api.example.test', '/dashboard')
    await expect(service.getDashboard(filters, 'month')).rejects.toThrow('missing required dashboard fields')
  })

  it('rejects malformed country aggregates but allows explicitly unavailable optional counts', async () => {
    const response = {
      filters, interval: 'month',
      metrics: {
        salesValue: { value: null, definition: 'Transaction value.' },
        uniqueInvoices: { value: null, definition: 'Invoices.' }, unitsSold: { value: null, definition: 'Units.' }, identifiedCustomers: { value: null, definition: 'Customers.' },
      },
      trend: [{ period: '2026-01', label: 'Jan', salesValue: 0, uniqueInvoices: null, unitsSold: null }],
      products: [{ productId: 'P-1', description: 'Item', salesValue: 0, unitsSold: 0, uniqueInvoices: null }],
      countries: [{ country: 'Indonesia', transactionValue: 0, uniqueInvoices: null }], countryOptions: ['Indonesia'],
      customerSummary: { identifiedCustomers: null, rfmStatus: 'pending' }, status: {},
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 })))
    const service = createApiAnalyticsService('https://api.example.test', '/dashboard')
    await expect(service.getDashboard(filters, 'month')).resolves.toMatchObject({ countries: [{ uniqueInvoices: null }] })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...response, countries: [{ country: '', transactionValue: 'unknown' }] }), { status: 200 })))
    await expect(service.getDashboard(filters, 'month')).rejects.toThrow('missing required dashboard fields')
  })
})
