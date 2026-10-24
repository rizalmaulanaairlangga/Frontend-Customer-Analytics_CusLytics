// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CustomerDirectory } from './CustomerDirectory'
import type { CustomerRfmRecord } from '../../types/customerAnalytics'

const customers: CustomerRfmRecord[] = Array.from({ length: 8 }, (_, index) => ({ customerId: `C-${String(index + 1).padStart(2, '0')}`, recency: index + 1, frequency: 8 - index, monetary: 80 - index, clusterLabel: null, profile: null }))

describe('CustomerDirectory', () => {
  it('searches string IDs, sorts, paginates, and resets presentation filters', () => {
    const onSelect = vi.fn()
    render(<CustomerDirectory customers={customers} currencyCode="USD" onSelect={onSelect} />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search customers' }), { target: { value: 'C-08' } })
    expect(screen.getByText('C-08')).toBeTruthy()
    expect(screen.queryByText('C-01')).toBeNull()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search customers' }), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Sort customers by'), { target: { value: 'recency' } })
    expect(screen.getAllByRole('row')[1].textContent).toContain('C-08')
    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '5' } })
    expect(screen.getByText('Showing 1 to 5 of 8 customers')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Showing 6 to 8 of 8 customers')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByText('Showing 1 to 8 of 8 customers')).toBeTruthy()
  })

  it('opens customer details, labels unavailable clusters, and supports Escape and focus restoration', () => {
    render(<CustomerDirectory customers={customers.slice(0, 1)} onSelect={() => undefined} />)
    const row = screen.getByRole('button', { name: /View customer C-01/i })
    row.focus()
    fireEvent.click(row)
    expect(screen.getByRole('dialog', { name: 'Customer C-01' })).toBeTruthy()
    expect(screen.getAllByText('Belum tersedia').length).toBeGreaterThan(0)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close customer details' }), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(row)
  })

  it('shows a query empty state without converting unavailable metrics to zero', () => {
    render(<CustomerDirectory customers={[]} onSelect={() => undefined} />)
    expect(screen.getByText(/Customer records are not available/i)).toBeTruthy()
    expect(screen.queryByText('0.00')).toBeNull()
  })
})
