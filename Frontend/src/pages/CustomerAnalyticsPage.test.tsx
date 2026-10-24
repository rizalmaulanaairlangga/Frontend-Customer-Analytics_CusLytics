// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CustomerAnalyticsPage } from './CustomerAnalyticsPage'
import type { CustomerAnalyticsService, CustomerAnalyticsSnapshot } from '../types/customerAnalytics'

const snapshot: CustomerAnalyticsSnapshot = {
  summary: { eligibleCustomers: 2, customersWithRfmProfiles: 1, observationDate: '2026-08-31', analysisPeriod: { start: '2026-01-01', end: '2026-08-31' }, segmentationStatus: 'unavailable' },
  distributions: { recency: [{ label: '0–30 days', count: 1, rangeStart: 0, rangeEnd: 30 }], frequency: [], monetary: [] },
  customers: [{ customerId: '0003', recency: 12, frequency: 4, monetary: 72, clusterLabel: null, profile: null }], currencyCode: 'USD', source: 'api',
}

describe('CustomerAnalyticsPage', () => {
  it('shows four source-backed summary cards and keeps RFM distinct from clustering', async () => {
    const service: CustomerAnalyticsService = { getSnapshot: vi.fn().mockResolvedValue(snapshot) }
    render(<MemoryRouter><CustomerAnalyticsPage service={service} /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Customer Analytics' })).toBeTruthy()
    expect(screen.getByText('Backend Data')).toBeTruthy()
    expect(screen.getAllByText('2026-01-01 — 2026-08-31').length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/Eligible Customers: 2/)).toBeTruthy()
    expect(screen.getByLabelText(/Customers with RFM Profiles: 1/)).toBeTruthy()
    expect(screen.getByText(/Profil RFM dan cluster adalah hal berbeda/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Go to ML Studio/i }).getAttribute('href')).toBe('/ml-studio')
    expect(screen.getByText('0003')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'View customer 0003 details' }))
    expect(screen.getByRole('dialog', { name: 'Customer 0003' })).toBeTruthy()
    expect(screen.getAllByText('2026-08-31').length).toBeGreaterThan(0)
    expect(screen.getByText('Periode perhitungan').parentElement?.textContent).toContain('2026-01-01')
    expect(screen.getByText('Periode perhitungan').parentElement?.textContent).toContain('2026-08-31')
  })

  it('shows unavailable, loading, and retryable error states without treating missing data as zero', async () => {
    const unavailable: CustomerAnalyticsService = { getSnapshot: vi.fn().mockResolvedValue(null) }
    const { rerender } = render(<MemoryRouter><CustomerAnalyticsPage service={unavailable} /></MemoryRouter>)
    expect(await screen.findByText(/Belum terhubung ke backend/i)).toBeTruthy()
    expect(screen.queryByText(/^0$/)).toBeNull()

    let rejectRequest!: (reason: Error) => void
    const rejected = new Promise<CustomerAnalyticsSnapshot | null>((_, reject) => { rejectRequest = reject })
    const failed: CustomerAnalyticsService = { getSnapshot: vi.fn().mockReturnValue(rejected) }
    rerender(<MemoryRouter><CustomerAnalyticsPage service={failed} /></MemoryRouter>)
    expect(screen.getByRole('status', { name: 'Customer analytics loading' })).toBeTruthy()
    rejectRequest(new Error('Backend not reachable.'))
    expect(await screen.findByText('Backend not reachable.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(failed.getSnapshot).toHaveBeenCalledTimes(2))
  })
})
