// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ReportsPage } from './ReportsPage'
import type { ReportSources } from '../services/reportSources'
import type { ReportsExportService } from '../services/reportsService'

const dashboard = {
  filters: { startDate: '', endDate: '', country: '' }, interval: 'month' as const, currencyCode: 'IDR',
  metrics: { salesValue: { value: 250000, definition: 'Transaction value' }, uniqueInvoices: { value: 12, definition: 'Unique invoices' }, unitsSold: { value: 20, definition: 'Units sold' }, identifiedCustomers: { value: 8, definition: 'Identified customers' } },
  trend: [{ period: '2026-01', label: 'Jan 2026', salesValue: 250000, uniqueInvoices: 12, unitsSold: 20 }],
  products: [{ productId: 'P-2', description: 'Second item', salesValue: 200000, unitsSold: 4, uniqueInvoices: 3 }, { productId: 'P-1', description: 'First item', salesValue: 50000, unitsSold: 16, uniqueInvoices: 9 }], countries: [], countryOptions: ['France', 'Germany'], customerSummary: { identifiedCustomers: 8, rfmStatus: 'unavailable' as const }, source: 'demo' as const, status: { dataset: 'Illustrative fixture' },
}

const customerSnapshot = { source: 'api' as const, currencyCode: 'IDR', summary: { eligibleCustomers: 1, customersWithRfmProfiles: 1, observationDate: '2026-04-01', analysisPeriod: { start: '2026-01-01', end: '2026-03-31' } }, customers: [{ customerId: 'CUS-100', recency: 8, frequency: 3, monetary: 800000 }] }
const experiment = { id: 'run-4', timestamp: '2026-04-01T09:00:00Z', k: 3, randomSeed: 42, preprocessingVersion: 'v2', status: 'succeeded' as const }
const evaluation = { experiment: { ...experiment, customersEvaluated: 1, clusterCount: 1 }, metrics: { inertia: 1.5, silhouette: { status: 'valid' as const, value: 0.72 } }, clusters: [{ clusterId: 'A', customerCount: 1, profile: { statistic: 'mean' as const, recency: 8, frequency: 3, monetary: 800000 } }], monetaryUnit: 'IDR transaction value' }

function makeSources(overrides: Partial<ReportSources> = {}): ReportSources {
  return {
    analytics: { getDashboard: vi.fn().mockResolvedValue(dashboard) },
    customers: { getSnapshot: vi.fn().mockResolvedValue(customerSnapshot) },
    mlStudio: { getWorkspace: vi.fn().mockResolvedValue({ rfm: { status: 'available', features: { recency: { status: 'available' }, frequency: { status: 'available' }, monetary: { status: 'available' } } }, preprocessing: { status: 'available', version: 'v2' }, history: [experiment] }) },
    evaluation: { getEvaluation: vi.fn().mockResolvedValue(evaluation) },
    ...overrides,
  } as ReportSources
}

function renderReports(sources = makeSources(), exportService: ReportsExportService = { exportReport: vi.fn().mockRejectedValue(new Error('Export backend is not connected.')) }) {
  return render(<MemoryRouter initialEntries={['/reports']}><Routes><Route path="/reports" element={<ReportsPage sources={sources} exportService={exportService} />} /></Routes></MemoryRouter>)
}

describe('Reports page', () => {
  it('lets the user select a report and shows only relevant configuration', async () => {
    const user = userEvent.setup()
    renderReports()
    await user.click(screen.getByRole('radio', { name: /Sales Summary/ }))
    expect((await screen.findAllByText(/250\.000/)).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Start date')).toBeTruthy()
    expect(screen.getByLabelText('Country')).toBeTruthy()
    expect(screen.queryByLabelText('Experiment')).toBeNull()
    expect(screen.getAllByText('Demo Data').length).toBeGreaterThan(0)
  })

  it('validates date ranges, keeps sales filters between related report types, and resets configuration', async () => {
    const user = userEvent.setup()
    renderReports()
    await user.click(screen.getByRole('radio', { name: /Sales Summary/ }))
    await user.type(screen.getByLabelText('Start date'), '2026-04-10')
    expect((await screen.findAllByText(/Enter both dates/i)).length).toBeGreaterThan(0)
    expect((screen.getByRole('button', { name: 'Export Report' }) as HTMLButtonElement).disabled).toBe(true)
    await user.type(screen.getByLabelText('End date'), '2026-04-01')
    expect((await screen.findAllByText(/End date must be on or after start date/i)).length).toBeGreaterThan(0)
    await user.clear(screen.getByLabelText('End date'))
    await user.type(screen.getByLabelText('End date'), '2026-04-15')
    await user.selectOptions(screen.getByLabelText('Country'), 'France')
    await user.click(screen.getByRole('radio', { name: /Product Performance/ }))
    expect((screen.getByLabelText('Start date') as HTMLInputElement).value).toBe('2026-04-10')
    expect((screen.getByLabelText('Country') as HTMLSelectElement).value).toBe('France')
    expect(screen.getByLabelText('Ranking metric')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Reset configuration' }))
    expect((screen.getByLabelText('Start date') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Country') as HTMLSelectElement).value).toBe('')
  })

  it('sorts only returned products by selected metric and updates the preview format', async () => {
    const user = userEvent.setup()
    renderReports()
    await user.click(screen.getByRole('radio', { name: /Product Performance/ }))
    await screen.findByText('P-2')
    const table = screen.getByRole('table', { name: 'Product preview' })
    expect(within(table).getAllByRole('row')[1].textContent).toContain('P-2')
    await user.selectOptions(screen.getByLabelText('Ranking metric'), 'unitsSold')
    expect(within(table).getAllByRole('row')[1].textContent).toContain('P-1')
    await user.selectOptions(screen.getByLabelText('Output format'), 'xlsx')
    expect((await screen.findAllByText(/Excel workbook/i)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText(/Demo Data/i)).length).toBeGreaterThan(0)
  })

  it('previews only supplied RFM records and metadata', async () => {
    const user = userEvent.setup()
    const sources = makeSources()
    renderReports(sources)
    await user.click(screen.getByRole('radio', { name: /Customer RFM/ }))
    expect(await screen.findByText('CUS-100')).toBeTruthy()
    expect(screen.getByText('2026-04-01')).toBeTruthy()
    expect((await screen.findAllByText(/800\.000/)).length).toBeGreaterThan(0)
    expect(sources.customers.getSnapshot).toHaveBeenCalledOnce()
  })

  it('requires a supplied experiment and renders its returned evaluation metadata', async () => {
    const user = userEvent.setup()
    const sources = makeSources()
    renderReports(sources)
    await user.click(screen.getByRole('radio', { name: /Model Evaluation/ }))
    await user.selectOptions(await screen.findByLabelText('Experiment'), 'run-4')
    expect((await screen.findAllByText(/0[,.]72/)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('run-4')).length).toBeGreaterThan(0)
    expect(screen.getByRole('table', { name: 'Cluster profile preview' }).textContent).toContain('800.000 IDR transaction value')
    expect(sources.evaluation.getEvaluation).toHaveBeenCalledWith('run-4', expect.any(AbortSignal))
  })

  it('reports export unavailability and preserves the current configuration', async () => {
    const user = userEvent.setup()
    const exportService: ReportsExportService = { exportReport: vi.fn().mockRejectedValue(new Error('Ekspor hasil analitik belum tersedia karena backend belum terhubung.')) }
    renderReports(makeSources(), exportService)
    await user.click(screen.getByRole('radio', { name: /Sales Summary/ }))
    await user.selectOptions(screen.getByLabelText('Output format'), 'xlsx')
    fireEvent.click(screen.getByRole('button', { name: 'Export Report' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/backend belum terhubung/i)
    expect((screen.getByLabelText('Output format') as HTMLSelectElement).value).toBe('xlsx')
    expect(screen.queryByText(/Export succeeded/i)).toBeNull()
  })

  it('downloads and reports success only after the exporter returns a real file', async () => {
    const user = userEvent.setup()
    const blob = new Blob(['report data'], { type: 'text/csv' })
    const exportService: ReportsExportService = { exportReport: vi.fn().mockResolvedValue({ blob, filename: 'sales-summary.csv' }) }
    const createObjectURL = vi.fn().mockReturnValue('blob:report-file')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderReports(makeSources(), exportService)
    await user.click(screen.getByRole('radio', { name: /Sales Summary/ }))
    await user.click(screen.getByRole('button', { name: 'Export Report' }))
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(exportService.exportReport).toHaveBeenCalledWith({ reportType: 'sales-summary', format: 'csv', filters: {} })
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledOnce()
    expect((await screen.findAllByText(/Download started: sales-summary\.csv/)).length).toBeGreaterThan(0)
    click.mockRestore()
  })

  it('shows source errors without inventing preview rows', async () => {
    const user = userEvent.setup()
    renderReports(makeSources({ analytics: { getDashboard: vi.fn().mockRejectedValue(new Error('Request failed (503).')) } }))
    await user.click(screen.getByRole('radio', { name: /Sales Summary/ }))
    expect((await screen.findByRole('alert')).textContent).toContain('Request failed (503).')
    expect(screen.queryByRole('table', { name: 'Sales trend preview' })).toBeNull()
  })
})
