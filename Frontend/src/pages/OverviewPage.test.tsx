// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { OverviewPage } from './OverviewPage'
import type { AnalyticsService, DashboardSnapshot } from '../types/analytics'

const snapshot: DashboardSnapshot = {
  source: 'demo', filters: { startDate: '', endDate: '', country: '' }, interval: 'month',
  metrics: {
    salesValue: { value: 100, definition: 'Qualifying transaction value, not profit.' },
    uniqueInvoices: { value: 10, definition: 'Unique qualifying invoices.' },
    unitsSold: { value: 20, definition: 'Qualifying units.' },
    identifiedCustomers: { value: 5, definition: 'Customers with valid identifiers.' },
  },
  trend: [{ period: '2025-01', label: 'Jan', salesValue: 100 }],
  products: [], countryOptions: ['France'],
  customerSummary: { identifiedCustomers: 5, rfmStatus: 'pending', rfmMessage: 'Not available in demo.' }, status: {},
}

function renderPage(service: AnalyticsService) {
  return render(<MemoryRouter><OverviewPage service={service} /></MemoryRouter>)
}

describe('OverviewPage', () => {
  it('shows KPI values and identifies the demo source', async () => {
    const service = { getDashboard: vi.fn().mockResolvedValue(snapshot) }
    renderPage(service)

    expect(await screen.findByText('Demo Data')).toBeTruthy()
    expect(screen.getByRole('article', { name: 'Sales Value: 100' }).textContent).toContain('Sales Value')
    expect(screen.getByRole('article', { name: 'Unique Invoices: 10' }).textContent).toContain('10')
    expect(screen.getByText(/illustrative demo fixture/i)).toBeTruthy()
  })

  it('applies the same date and country filter to the dashboard request', async () => {
    const service = { getDashboard: vi.fn().mockResolvedValue(snapshot) }
    renderPage(service)
    await screen.findByText('Demo Data')
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2025-01-31' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'France' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(service.getDashboard).toHaveBeenLastCalledWith(
      { startDate: '2025-01-01', endDate: '2025-01-31', country: 'France' }, 'month', expect.any(AbortSignal),
    ))
  })

  it('shows a retryable error without replacing it with demo values', async () => {
    const service = { getDashboard: vi.fn().mockRejectedValue(new Error('Service unavailable')) }
    renderPage(service)

    expect(await screen.findByText('Service unavailable')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
    expect(screen.queryByText('Demo Data')).toBeNull()
  })

  it('shows loading and empty states from the selected service', async () => {
    const loadingService = { getDashboard: vi.fn(() => new Promise<DashboardSnapshot>(() => {})) }
    const loadingView = renderPage(loadingService)
    expect(screen.getByRole('status', { name: 'Loading dashboard' })).toBeTruthy()
    loadingView.unmount()

    const emptySnapshot: DashboardSnapshot = {
      ...snapshot,
      metrics: {
        salesValue: { value: null, definition: 'Not available.' },
        uniqueInvoices: { value: null, definition: 'Not available.' },
        unitsSold: { value: null, definition: 'Not available.' },
        identifiedCustomers: { value: null, definition: 'Not available.' },
      },
      trend: [], products: [],
      customerSummary: { identifiedCustomers: null, rfmStatus: 'unavailable' },
    }
    renderPage({ getDashboard: vi.fn().mockResolvedValue(emptySnapshot) })
    expect(await screen.findByText('No results for these filters')).toBeTruthy()
  })

  it('retries a failed request without changing the source mode', async () => {
    const service = { getDashboard: vi.fn()
      .mockRejectedValueOnce(new Error('Temporary connection error'))
      .mockResolvedValue(snapshot) }
    renderPage(service)
    await screen.findByText('Temporary connection error')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Demo Data')).toBeTruthy()
    expect(service.getDashboard).toHaveBeenCalledTimes(2)
  })
})
