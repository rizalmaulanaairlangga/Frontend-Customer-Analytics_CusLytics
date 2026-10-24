// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SalesProductsPage } from './SalesProductsPage'
import type { AnalyticsService, DashboardFilters, DashboardSnapshot } from '../types/analytics'

const filters: DashboardFilters = { startDate: '', endDate: '', country: '' }
const snapshot: DashboardSnapshot = {
  filters, interval: 'month', currencyCode: 'USD', source: 'api',
  metrics: {
    salesValue: { value: 1200, definition: 'Transaction value for included rows; not profit.' },
    uniqueInvoices: { value: 12, definition: 'Unique invoices under the supplied inclusion rules.' },
    unitsSold: { value: 38, definition: 'Units supplied by the analytics service.' },
    identifiedCustomers: { value: 7, definition: 'Customers with an identifier.' },
  },
  trend: [
    { period: '2026-01', label: 'Jan 2026', salesValue: 500, uniqueInvoices: 5, unitsSold: 15 },
    { period: '2026-02', label: 'Feb 2026', salesValue: 700, uniqueInvoices: 7, unitsSold: 23 },
  ],
  products: Array.from({ length: 12 }, (_, index) => ({
    productId: `ST-${String(index + 1).padStart(2, '0')}`, description: `Product ${index + 1}`,
    salesValue: 1200 - index * 20, unitsSold: 38 - index, uniqueInvoices: 12 - index,
  })),
  countries: [
    { country: 'Indonesia', transactionValue: 700, uniqueInvoices: 7 },
    { country: 'Malaysia', transactionValue: 500, uniqueInvoices: 5 },
  ],
  countryOptions: ['Indonesia', 'Malaysia'],
  customerSummary: { identifiedCustomers: 7, rfmStatus: 'pending' }, status: {},
}

const makeService = (resolve: (filters: DashboardFilters, interval: 'day' | 'week' | 'month') => DashboardSnapshot | Promise<DashboardSnapshot>): AnalyticsService => ({
  getDashboard: vi.fn(async (nextFilters, interval) => resolve(nextFilters, interval)),
})

describe('Sales & Products page', () => {
  it('shows an explicit loading state and recovers from a request error', async () => {
    let rejectRequest!: (error: Error) => void
    const pending = new Promise<DashboardSnapshot>((_resolve, reject) => { rejectRequest = reject })
    const service: AnalyticsService = { getDashboard: vi.fn(() => pending) }
    render(<SalesProductsPage service={service} />)
    expect(screen.getByLabelText('Sales and Products loading')).toBeTruthy()
    rejectRequest(new Error('Backend unavailable.'))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText('Backend unavailable.')).toBeTruthy()
  })

  it('shows only supplied figures, source state, and separate trend series', async () => {
    render(<SalesProductsPage service={makeService(() => snapshot)} />)
    expect(await screen.findByRole('heading', { name: 'Sales & Products' })).toBeTruthy()
    expect(screen.getByText('Backend Data')).toBeTruthy()
    expect(screen.getByLabelText(/^Transaction Value: US\$1,200\.00$/)).toBeTruthy()
    expect(screen.getByText(/^Transaction Value is not profit\.$/)).toBeTruthy()
    expect(screen.getByRole('region', { name: /sales trend/i })).toBeTruthy()
    expect(screen.getByRole('region', { name: /invoice & units trend/i })).toBeTruthy()
    expect(screen.getByLabelText('Show invoice or unit trend')).toBeTruthy()
  })

  it('applies and resets one shared filter set and changes aggregation on the service', async () => {
    const service = makeService((nextFilters) => ({ ...snapshot, filters: nextFilters }))
    render(<SalesProductsPage service={service} />)
    await screen.findByText('Backend Data')
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Indonesia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    await waitFor(() => expect(service.getDashboard).toHaveBeenLastCalledWith({ startDate: '2026-01-01', endDate: '', country: 'Indonesia' }, 'month', expect.any(AbortSignal)))
    expect(await screen.findByText(/2026-01-01.*Indonesia/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }))
    await waitFor(() => expect(service.getDashboard).toHaveBeenLastCalledWith({ startDate: '2026-01-01', endDate: '', country: 'Indonesia' }, 'week', expect.any(AbortSignal)))
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    await waitFor(() => expect(service.getDashboard).toHaveBeenLastCalledWith(filters, 'week', expect.any(AbortSignal)))
  })

  it('supports ranking metric, chart selection, search, sorting, and pagination', async () => {
    render(<SalesProductsPage service={makeService(() => snapshot)} />)
    await screen.findByText('Backend Data')
    fireEvent.click(screen.getByRole('button', { name: 'Units Sold' }))
    expect(screen.getByRole('button', { name: 'Units Sold' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.change(screen.getByLabelText('Products in ranking'), { target: { value: '10' } })
    expect(screen.getAllByRole('button', { name: /ST-/ }).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /ST-01.*Product 1/i }))
    expect(screen.getByRole('button', { name: /Show all products/i })).toBeTruthy()
    expect(screen.getByText('Selected product: ST-01')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Show all products/i }))

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), { target: { value: 'ST-12' } })
    expect(screen.getByText('ST-12')).toBeTruthy()
    expect(screen.queryByText('ST-01')).toBeNull()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Sort products by'), { target: { value: 'unitsSold' } })
    expect((screen.getByLabelText('Sort products by') as HTMLSelectElement).value).toBe('unitsSold')
    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '5' } })
    expect(screen.getByText('Showing 1 to 5 of 12 products')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Showing 6 to 10 of 12 products')).toBeTruthy()
  })

  it('applies a country selection through the shared page filters and handles absent aggregates', async () => {
    const service = makeService((nextFilters) => ({ ...snapshot, filters: nextFilters }))
    render(<SalesProductsPage service={service} />)
    await screen.findByText('Backend Data')
    fireEvent.click(screen.getByRole('button', { name: /Indonesia.*700/i }))
    await waitFor(() => expect(service.getDashboard).toHaveBeenLastCalledWith({ ...filters, country: 'Indonesia' }, 'month', expect.any(AbortSignal)))

    const noAggregates = { ...snapshot, trend: snapshot.trend.map(({ period, label, salesValue }) => ({ period, label, salesValue })), countries: [], products: [] }
    cleanup()
    render(<SalesProductsPage service={makeService(() => noAggregates)} />)
    expect(await screen.findByText(/Country aggregates are not available/i)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Show invoice or unit trend'), { target: { value: 'uniqueInvoices' } })
    expect(screen.getByText(/Invoice trend is not available/i)).toBeTruthy()
  })

  it('distinguishes missing backend configuration from a read failure', async () => {
    const service: AnalyticsService = { getDashboard: vi.fn().mockRejectedValue(new Error('Set VITE_API_BASE_URL before using API mode.')) }
    render(<SalesProductsPage service={service} />)
    expect(await screen.findByText(/Belum terhubung ke backend/i)).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect((screen.getByLabelText('Country') as HTMLSelectElement).options.length).toBe(1)
  })

  it('keeps a successful empty result distinct from unavailable data and never substitutes zero', async () => {
    const emptySnapshot: DashboardSnapshot = {
      ...snapshot,
      metrics: {
        salesValue: { value: null, definition: 'No value reported.' },
        uniqueInvoices: { value: null, definition: 'No invoice count reported.' },
        unitsSold: { value: null, definition: 'No unit count reported.' },
        identifiedCustomers: { value: null, definition: 'No customer count reported.' },
      },
      trend: [], products: [], countries: [], countryOptions: [],
    }
    cleanup()
    render(<SalesProductsPage service={makeService(() => emptySnapshot)} />)
    expect(await screen.findByText(/No analytics results are available for these filters/i)).toBeTruthy()
    expect(screen.getByText('Backend Data')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.getByText(/Product rows are not available/i)).toBeTruthy()
  })
})
