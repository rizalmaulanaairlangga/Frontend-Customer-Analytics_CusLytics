import { describe, expect, it, vi } from 'vitest'
import { createAnalyticsService } from './analyticsService'
import type { DashboardSnapshot } from '../types/analytics'

const demo: DashboardSnapshot = {
  source: 'demo', filters: { startDate: '', endDate: '', country: '' }, interval: 'month',
  metrics: {
    salesValue: { value: null, definition: 'Value of qualifying transactions, not profit.' },
    uniqueInvoices: { value: null, definition: 'Unique qualifying invoices.' },
    unitsSold: { value: null, definition: 'Units from qualifying transactions.' },
    identifiedCustomers: { value: null, definition: 'Customers with a qualifying customer identifier.' },
  }, trend: [], products: [], countryOptions: [],
  customerSummary: { identifiedCustomers: null, rfmStatus: 'pending' }, status: {},
}

describe('createAnalyticsService', () => {
  it('selects demo only when demo mode is explicit', async () => {
    const demoService = { getDashboard: vi.fn().mockResolvedValue(demo) }
    const apiService = { getDashboard: vi.fn() }
    const service = createAnalyticsService({ mode: 'demo', demoService, apiService })

    await service.getDashboard(demo.filters, 'month')

    expect(demoService.getDashboard).toHaveBeenCalledOnce()
    expect(apiService.getDashboard).not.toHaveBeenCalled()
  })

  it('surfaces API errors without falling back to demo', async () => {
    const demoService = { getDashboard: vi.fn() }
    const apiService = { getDashboard: vi.fn().mockRejectedValue(new Error('offline')) }
    const service = createAnalyticsService({ mode: 'api', demoService, apiService })

    await expect(service.getDashboard(demo.filters, 'month')).rejects.toThrow('offline')
    expect(demoService.getDashboard).not.toHaveBeenCalled()
  })

  it('rejects an unconfigured data mode', () => {
    expect(() => createAnalyticsService({ mode: '', demoService: { getDashboard: vi.fn() }, apiService: { getDashboard: vi.fn() } })).toThrow('VITE_DATA_MODE')
  })
})
