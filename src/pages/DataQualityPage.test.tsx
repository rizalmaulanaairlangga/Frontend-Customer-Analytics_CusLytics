// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataQualityPage } from './DataQualityPage'
import { DataQualityConfigurationError, type DataQualityService } from '../services/dataQualityService'
import type { DataQualitySnapshot } from '../types/dataQuality'

const snapshot: DataQualitySnapshot = {
  dataset: { readStatus: 'available', validationStatus: 'warning', fileIdentity: 'retail-v2.csv', rowCount: 100, columnCount: 8, transactionDateRange: { start: '2010-12-01', end: '2011-12-09' }, lastCheckedAt: '2012-01-01T00:00:00Z' },
  columns: [{ sourceName: 'Invoice', conceptualName: 'Invoice', detectedType: 'string', role: 'Transaction identifier', validationStatus: 'passed', details: 'Preserved as an identifier.' }, { sourceName: 'StockCode', conceptualName: 'StockCode', detectedType: 'string', role: 'Product identifier', validationStatus: 'passed' }, { sourceName: null, conceptualName: 'Customer ID', role: 'Customer identifier', validationStatus: 'pending' }],
  indicators: {
    missing_values: { count: 4, details: 'Four cells are reported as missing.' }, duplicate_rows: { count: null }, cancellation_invoices: { count: null }, negative_quantity: { count: null }, nonpositive_price: { count: null }, invalid_dates: { count: null }, missing_customer_id: { count: null }, missing_product_id: { count: null },
  },
  findingCategories: [{ category: 'missing', count: 4, label: 'Missing values', detail: 'Four cells' }],
  cleaningAudit: { rowCounts: { before: 100, retained: null, excluded: null }, exclusionReasons: [], rules: [{ id: 'returns', topic: 'Returns', description: 'Return policy awaits confirmation.', impact: 'No rows have been processed.', affectedRows: null, status: 'pending' }] },
  warnings: [{ title: 'Missing cells reported', impact: 'May affect analyses that use the affected fields.', action: 'Review the field mapping and agreed handling rule.', affectedRows: 4 }],
}

const service = (result: Promise<DataQualitySnapshot | null>): DataQualityService => ({ getSnapshot: vi.fn(() => result) })

describe('Data Status / Quality page', () => {
  it('shows a truthful unconnected state and placeholders without a snapshot', async () => {
    render(<DataQualityPage service={service(Promise.resolve(null))} />)
    expect(await screen.findByText('Belum terhubung')).toBeTruthy()
    expect(screen.getByText('Menunggu data dari backend')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.getByText('Belum ada temuan kualitas data yang tersedia.')).toBeTruthy()
  })

  it('shows only metadata supplied by the service', async () => {
    render(<DataQualityPage service={service(Promise.resolve(snapshot))} />)
    expect(await screen.findByText('Tersedia')).toBeTruthy()
    expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('2010-12-01 to 2011-12-09')).toBeTruthy()
    expect(screen.queryByText('12,345')).toBeNull()
  })

  it('searches mapped columns and expands their details', async () => {
    render(<DataQualityPage service={service(Promise.resolve(snapshot))} />)
    await screen.findByText('Tersedia')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search columns' }), { target: { value: 'invoice' } })
    expect(screen.getAllByText('Invoice').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('Customer ID')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'View Invoice details' }))
    expect(screen.getByText('Preserved as an identifier.')).toBeTruthy()
  })

  it('expands indicator and preprocessing details without treating categories as severity', async () => {
    render(<DataQualityPage service={service(Promise.resolve(snapshot))} />)
    await screen.findByText('Tersedia')
    fireEvent.click(screen.getByRole('button', { name: 'Lihat rincian: Missing values' }))
    expect(screen.getByText('Four cells are reported as missing.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Lihat aturan Returns' }))
    expect(screen.getByText('Return policy awaits confirmation.')).toBeTruthy()
    expect(screen.getByText(/Warna menunjukkan kategori temuan/)).toBeTruthy()
  })

  it('shows backend warnings and a selected chart category detail', async () => {
    render(<DataQualityPage service={service(Promise.resolve(snapshot))} />)
    expect(await screen.findByText('Missing cells reported')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Missing values, 4 findings' }))
    expect(screen.getByText('Four cells')).toBeTruthy()
  })

  it('shows loading and a clear read error', async () => {
    let rejectRequest!: (error: Error) => void
    const pending = new Promise<DataQualitySnapshot | null>((_resolve, reject) => { rejectRequest = reject })
    render(<DataQualityPage service={service(pending)} />)
    expect(screen.getByRole('status', { name: 'Loading data quality profile' })).toBeTruthy()
    rejectRequest(new Error('Could not reach the analytics service.'))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not reach the analytics service.'))
  })

  it('describes missing API configuration as unconnected, not a failed dataset read', async () => {
    const missingConfig = service(Promise.reject(new DataQualityConfigurationError('Set VITE_API_BASE_URL before connecting.')))
    render(<DataQualityPage service={missingConfig} />)
    const status = await screen.findByRole('status')
    expect(status.textContent).toContain('Belum terhubung')
    expect(status.textContent).toContain('Set VITE_API_BASE_URL')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('Profil dataset gagal dibaca')).toBeNull()
  })
})
