// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MLStudioPage } from './MLStudioPage'
import type { MLStudioService } from '../types/mlStudio'

function renderPage(service: MLStudioService, entry = '/') {
  return render(<MemoryRouter initialEntries={[entry]}><MLStudioPage service={service} /></MemoryRouter>)
}

describe('ML Studio page', () => {
  it('keeps the configuration summary in sync with K and seed controls', async () => {
    const user = userEvent.setup()
    renderPage({ getWorkspace: vi.fn().mockRejectedValue(new Error('not configured')), runExperiment: vi.fn() })
    await screen.findAllByText('Belum terhubung ke backend')
    await user.selectOptions(screen.getByLabelText('Number of Clusters (K)'), '5')
    await user.clear(screen.getByLabelText('Random Seed'))
    await user.type(screen.getByLabelText('Random Seed'), '123')
    expect(screen.getByText('K-Means · K = 5')).toBeTruthy()
    expect(screen.getByLabelText('Random Seed')).toHaveProperty('value', '123')
  })

  it('does not call the experiment service when the backend is unavailable', async () => {
    const user = userEvent.setup()
    const runExperiment = vi.fn()
    renderPage({ getWorkspace: vi.fn().mockRejectedValue(new Error('resource path not configured')), runExperiment })
    await screen.findAllByText('Belum terhubung ke backend')
    await user.click(screen.getByRole('button', { name: 'Run K-Means Experiment' }))
    expect(await screen.findByText(/Eksperimen belum dapat dijalankan karena backend belum terhubung/i)).toBeTruthy()
    expect(runExperiment).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Number of Clusters (K)')).toHaveProperty('value', '3')
  })

  it('blocks invalid integer seeds and marks missing prerequisites', async () => {
    const user = userEvent.setup()
    const runExperiment = vi.fn()
    renderPage({ getWorkspace: vi.fn().mockResolvedValue({ rfm: { status: 'unavailable', features: { recency: { status: 'unavailable' }, frequency: { status: 'unavailable' }, monetary: { status: 'unavailable' } } }, preprocessing: { status: 'pending' }, history: [] }), runExperiment })
    await screen.findAllByText('Data RFM belum tersedia')
    await user.clear(screen.getByLabelText('Random Seed'))
    await user.type(screen.getByLabelText('Random Seed'), 'bad')
    fireEvent.blur(screen.getByLabelText('Random Seed'))
    expect((await screen.findByRole('alert')).textContent).toMatch(/bilangan bulat/i)
    await user.click(screen.getByRole('button', { name: 'Run K-Means Experiment' }))
    expect(runExperiment).not.toHaveBeenCalled()
  })

  it('shows experiment results and an evaluation link only when supplied by the service', async () => {
    const service: MLStudioService = {
      getWorkspace: vi.fn().mockResolvedValue({ rfm: { status: 'available', features: { recency: { status: 'available' }, frequency: { status: 'available' }, monetary: { status: 'available' } } }, preprocessing: { status: 'available', name: 'Scaler', version: 'v2' }, history: [] }),
      runExperiment: vi.fn().mockResolvedValue({ id: 'exp-21', timestamp: '2026-10-24T08:00:00Z', k: 3, randomSeed: 42, preprocessingVersion: 'v2', status: 'succeeded', evaluationAvailable: true }),
    }
    renderPage(service)
    await screen.findAllByText('Data RFM tersedia')
    fireEvent.click(screen.getByRole('button', { name: 'Run K-Means Experiment' }))
    expect((await screen.findByRole('link', { name: /View evaluation/i })).getAttribute('href')).toBe('/model-evaluation?experimentId=exp-21')
    expect(screen.getAllByText('exp-21').length).toBeGreaterThan(0)
  })

  it('opens the related history row from an experiment query link without running it again', async () => {
    const experiment = { id: 'exp-21', timestamp: '2026-10-24T08:00:00Z', k: 3, randomSeed: 42, status: 'succeeded' as const, evaluationAvailable: true }
    const runExperiment = vi.fn()
    renderPage({ getWorkspace: vi.fn().mockResolvedValue({ rfm: { status: 'pending', features: { recency: { status: 'pending' }, frequency: { status: 'pending' }, monetary: { status: 'pending' } } }, preprocessing: { status: 'pending' }, history: [experiment] }), runExperiment }, '/ml-studio?experimentId=exp-21')
    const historyButton = await screen.findByRole('button', { name: 'exp-21' })
    expect(historyButton.getAttribute('aria-expanded')).toBe('true')
    expect(runExperiment).not.toHaveBeenCalled()
  })

  it('keeps history empty when the backend returns no experiments', async () => {
    renderPage({ getWorkspace: vi.fn().mockResolvedValue({ rfm: { status: 'pending', features: { recency: { status: 'pending' }, frequency: { status: 'pending' }, monetary: { status: 'pending' } } }, preprocessing: { status: 'pending' }, history: [] }), runExperiment: vi.fn() })
    expect(await screen.findByText('Belum ada riwayat eksperimen')).toBeTruthy()
    expect(screen.getAllByText('Not Run').length).toBeGreaterThan(0)
  })

  it('does not mark an unconfirmed submission as a failed or blocked experiment', async () => {
    const service: MLStudioService = {
      getWorkspace: vi.fn().mockResolvedValue({ rfm: { status: 'available', features: { recency: { status: 'available' }, frequency: { status: 'available' }, monetary: { status: 'available' } } }, preprocessing: { status: 'available' }, history: [] }),
      runExperiment: vi.fn().mockRejectedValue(new Error('run resource is not configured')),
    }
    const user = userEvent.setup()
    renderPage(service)
    await screen.findAllByText('Data RFM tersedia')
    await user.click(screen.getByRole('button', { name: 'Run K-Means Experiment' }))
    expect((await screen.findAllByText('Backend Unavailable')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Blocked')).toBeNull()
    expect(screen.queryByText('Failed')).toBeNull()
  })

  it('filters and sorts actual experiment history and opens selected details without rerunning', async () => {
    const user = userEvent.setup()
    const service: MLStudioService = {
      getWorkspace: vi.fn().mockResolvedValue({
        rfm: { status: 'available', features: { recency: { status: 'available' }, frequency: { status: 'available' }, monetary: { status: 'available' } } },
        preprocessing: { status: 'available', name: 'Scaler', version: 'v1' },
        history: [
          { id: 'exp-a', timestamp: '2026-10-24T08:00:00Z', k: 3, randomSeed: 42, status: 'succeeded', primaryMetric: { label: 'Silhouette', value: 0.85 }, evaluationAvailable: true },
          { id: 'exp-b', timestamp: '2026-10-24T09:00:00Z', k: 4, randomSeed: 15, status: 'failed', primaryMetric: { label: 'Silhouette', value: 0.4 }, message: 'Reported failure' },
        ],
      }),
      runExperiment: vi.fn(),
    }
    renderPage(service)
    await screen.findByRole('button', { name: 'exp-a' })
    await user.selectOptions(screen.getByLabelText('Sort experiment history'), 'metric')
    expect(document.querySelector('.ml-history-table tbody tr:first-child .ml-id-button')?.textContent).toBe('exp-a')
    await user.click(screen.getByRole('button', { name: 'exp-a' }))
    expect(screen.getByLabelText('Experiment details exp-a')).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Filter experiment status'), 'failed')
    expect(screen.getByRole('button', { name: 'exp-b' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'exp-a' })).toBeNull()
    expect(service.runExperiment).not.toHaveBeenCalled()
  })

  it('shows an error state and retries metadata loading', async () => {
    const user = userEvent.setup()
    const workspace = { rfm: { status: 'pending' as const, features: { recency: { status: 'pending' as const }, frequency: { status: 'pending' as const }, monetary: { status: 'pending' as const } } }, preprocessing: { status: 'pending' as const }, history: [] }
    const getWorkspace = vi.fn().mockRejectedValueOnce(new Error('Metadata request failed.')).mockResolvedValueOnce(workspace)
    renderPage({ getWorkspace, runExperiment: vi.fn() })
    expect((await screen.findAllByText('Metadata RFM gagal dimuat')).length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Retry' })[0])
    expect(await screen.findByText('Belum ada riwayat eksperimen')).toBeTruthy()
    expect(getWorkspace).toHaveBeenCalledTimes(2)
  })
})
