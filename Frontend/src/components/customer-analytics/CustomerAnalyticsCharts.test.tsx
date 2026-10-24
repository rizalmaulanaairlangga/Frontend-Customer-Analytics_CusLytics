// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CustomerAnalyticsCharts } from './CustomerAnalyticsCharts'
import type { CustomerAnalyticsSnapshot } from '../../types/customerAnalytics'

const snapshot: CustomerAnalyticsSnapshot = {
  summary: { eligibleCustomers: 2, customersWithRfmProfiles: 2, segmentationStatus: 'unavailable' },
  distributions: { recency: [{ label: '0–30 days', count: 2, rangeStart: 0, rangeEnd: 30 }], frequency: [], monetary: [] },
  customers: [{ customerId: '0008', recency: 5, frequency: 3, monetary: 20 }, { customerId: 'C-9', recency: 20, frequency: 1, monetary: 10 }],
}

describe('CustomerAnalyticsCharts', () => {
  it('switches the distribution metric and keeps scatter axes distinct', () => {
    render(<CustomerAnalyticsCharts snapshot={snapshot} />)
    fireEvent.change(screen.getByLabelText('Distribution metric'), { target: { value: 'frequency' } })
    expect((screen.getByLabelText('Distribution metric') as HTMLSelectElement).value).toBe('frequency')
    expect(screen.getByText(/Distribution data for Frequency is not available/i)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Scatter X axis'), { target: { value: 'monetary' } })
    expect((screen.getByLabelText('Scatter X axis') as HTMLSelectElement).value).toBe('monetary')
    expect((screen.getByLabelText('Scatter Y axis') as HTMLSelectElement).value).toBe('recency')
  })

  it('shows definitions and source-provided distribution bins without inventing chart data', () => {
    render(<CustomerAnalyticsCharts snapshot={{ ...snapshot, customers: [], distributions: { ...snapshot.distributions, frequency: [{ label: '1–2 invoices', count: 4 }] } }} />)
    expect(screen.getByText(/Monetary bukan laba atau profit/i)).toBeTruthy()
    expect(screen.getByText('0–30 days: 2 observations')).toBeTruthy()
    expect(screen.getByText(/Customer points are not available/i)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Distribution metric'), { target: { value: 'frequency' } })
    expect(screen.getByText('1–2 invoices: 4 observations')).toBeTruthy()
  })
})
