// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ActionCenterPage } from './ActionCenterPage'
import type { ActionCenterService } from '../types/actionCenter'

const records = [
  { id: 'rec-a', title: 'Win-back review', category: 'win-back' as const, source: 'cluster' as const, finding: 'The supplied cluster has higher historical Monetary and a longer Recency.', reasoning: 'This pattern may warrant reviewing a low-cost win-back test.', ruleReference: 'Rule reference supplied by the service', suggestedAction: 'Consider a small win-back test.', limitations: ['Past transaction value does not prove an incentive will be profitable.'], segment: 'Cluster 3', createdAt: '2026-04-03T09:00:00Z', evidence: { cluster: { clusterId: 3, experimentId: 'exp-7' }, customersAnalyzed: 20, analysisPeriod: { start: '2026-01-01', end: '2026-03-31' } } },
  { id: 'rec-b', title: 'Repeat-purchase review', category: 'repeat-purchase' as const, source: 'rfm' as const, finding: 'The supplied RFM profile reports low Frequency.', reasoning: 'This may be worth reviewing alongside the purchase period.', suggestedAction: 'Consider testing a relevant second-purchase reminder.', limitations: ['The profile does not establish why customers have not returned.'], segment: 'Segment B', customerIds: ['CUS-22'], createdAt: '2026-04-02T09:00:00Z', evidence: { recency: { value: 11, unit: 'days', source: 'RFM profile' }, frequency: { value: 1, unit: 'invoices', source: 'RFM profile' }, monetary: { value: 82, unit: 'transaction value', source: 'RFM profile' }, customersAnalyzed: 8, analysisPeriod: { start: '2026-01-01', end: '2026-03-31' } } },
]

function renderPage(service: ActionCenterService) {
  return render(<MemoryRouter initialEntries={['/action-center']}><Routes><Route path="/action-center" element={<ActionCenterPage service={service} />} /></Routes></MemoryRouter>)
}

describe('Action Center page', () => {
  it('shows an honest empty state and keeps filters disabled when the backend returns no records', async () => {
    const { container } = renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: [] }) })
    expect(await screen.findByRole('heading', { name: 'Belum ada rekomendasi' })).toBeTruthy()
    expect((screen.getByLabelText('Filter by category') as HTMLSelectElement).disabled).toBe(true)
    expect(screen.queryByText(/0 recommendations/i)).toBeNull()
    expect(container.querySelector('.action-recommendation-card')).toBeNull()
  })

  it('filters by category and updates the visible summary counts', async () => {
    const user = userEvent.setup()
    renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: records }) })
    await screen.findByText('Win-back review')
    await user.selectOptions(screen.getByLabelText('Filter by category'), 'repeat-purchase')
    expect(screen.getByText('Repeat-purchase review')).toBeTruthy()
    expect(screen.queryByText('Win-back review')).toBeNull()
    expect(screen.getByText('Showing 1 of 2 recommendations')).toBeTruthy()
  })

  it('searches supplied customer IDs and segments and supports reset', async () => {
    const user = userEvent.setup()
    renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: records }) })
    await screen.findByText('Win-back review')
    await user.type(screen.getByLabelText('Search recommendations'), 'CUS-22')
    expect(screen.getByText('Repeat-purchase review')).toBeTruthy()
    expect(screen.queryByText('Win-back review')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByText('Win-back review')).toBeTruthy()
    expect(screen.getByLabelText('Search recommendations')).toHaveProperty('value', '')
  })

  it('sorts by title or supplied timestamp and does not invent a priority score', async () => {
    const user = userEvent.setup()
    renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: records }) })
    await screen.findByText('Win-back review')
    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(titles.indexOf('Repeat-purchase review')).toBeLessThan(titles.indexOf('Win-back review'))
    await user.selectOptions(screen.getByLabelText('Sort recommendations'), 'newest')
    const newestTitles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(newestTitles.indexOf('Win-back review')).toBeLessThan(newestTitles.indexOf('Repeat-purchase review'))
    expect(screen.queryByText(/priority score/i)).toBeNull()
  })

  it('opens supplied evidence and contextual links, then closes the drawer with Escape', async () => {
    const user = userEvent.setup()
    renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: records }) })
    await screen.findByText('Win-back review')
    await user.click(screen.getByRole('button', { name: 'View Evidence for Win-back review' }))
    const drawer = screen.getByRole('dialog', { name: 'Win-back review' })
    expect(within(drawer).getByText('The supplied cluster has higher historical Monetary and a longer Recency.')).toBeTruthy()
    expect(within(drawer).getByText('Rule reference supplied by the service')).toBeTruthy()
    expect(within(drawer).getByRole('link', { name: 'View Model Evaluation' }).getAttribute('href')).toBe('/model-evaluation?experimentId=exp-7')
    expect(within(drawer).getByRole('link', { name: 'Open Reports' }).getAttribute('href')).toBe('/reports')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('reports missing evidence without inventing cluster evaluation links', async () => {
    const user = userEvent.setup()
    const recommendation = { ...records[0], evidence: null }
    renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: [recommendation] }) })
    await screen.findByText('Win-back review')
    await user.click(screen.getByRole('button', { name: 'View Evidence for Win-back review' }))
    const drawer = screen.getByRole('dialog', { name: 'Win-back review' })
    expect(within(drawer).getByText('Bukti belum disediakan oleh sumber rekomendasi.')).toBeTruthy()
    expect(within(drawer).getByText(/Experiment ID belum disediakan/i)).toBeTruthy()
    expect(within(drawer).queryByRole('link', { name: 'View Model Evaluation' })).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(within(drawer).getByRole('link', { name: 'Open Reports' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('links RFM evidence to Customer Analytics and Reports', async () => {
    const user = userEvent.setup()
    renderPage({ getSnapshot: vi.fn().mockResolvedValue({ recommendations: [records[1]] }) })
    await screen.findByText('Repeat-purchase review')
    await user.click(screen.getByRole('button', { name: 'View Evidence for Repeat-purchase review' }))
    const drawer = screen.getByRole('dialog', { name: 'Repeat-purchase review' })
    expect(within(drawer).getByRole('link', { name: 'View Customer Analytics' }).getAttribute('href')).toBe('/customers')
    expect(within(drawer).getByRole('link', { name: 'Open Reports' }).getAttribute('href')).toBe('/reports')
  })

  it('shows unavailable configuration separately from request errors and retries errors', async () => {
    const getSnapshot = vi.fn().mockRejectedValueOnce(new Error('Set VITE_ACTION_CENTER_RESOURCE_PATH after backend confirmation.')).mockRejectedValueOnce(new Error('Request failed (503).')).mockResolvedValueOnce({ recommendations: [] })
    renderPage({ getSnapshot })
    expect((await screen.findAllByText(/VITE_ACTION_CENTER_RESOURCE_PATH/i)).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect((await screen.findAllByText(/Request failed \(503\)/i)).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Belum ada rekomendasi' })).toBeTruthy()
  })
})
