// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ModelEvaluationPage } from './ModelEvaluationPage'
import type { ModelEvaluationService } from '../types/modelEvaluation'
import type { MLStudioExperiment } from '../types/mlStudio'

const experiments: MLStudioExperiment[] = [
  { id: 'exp-1', timestamp: '2026-10-24T08:00:00Z', k: 2, randomSeed: 42, preprocessingVersion: 'v1', status: 'succeeded', evaluationAvailable: true },
  { id: 'exp-2', timestamp: '2026-10-24T09:00:00Z', k: 3, randomSeed: 23, preprocessingVersion: 'v2', status: 'succeeded', evaluationAvailable: true },
]

const evaluation = {
  experiment: { id: 'exp-1', timestamp: '2026-10-24T08:00:00Z', k: 2, randomSeed: 42, preprocessingVersion: 'v1', customersEvaluated: 5, clusterCount: 2, status: 'succeeded' as const },
  metrics: { inertia: 18.5, silhouette: { status: 'valid' as const, value: 0.42 } },
  clusters: [
    { clusterId: 'c0', customerCount: 2, profile: { statistic: 'median' as const, recency: 4, frequency: 7, monetary: 240 } },
    { clusterId: 'c1', customerCount: 3, profile: { statistic: 'median' as const, recency: 20, frequency: 2, monetary: 80 } },
  ],
  points: [
    { customerId: 'customer-a', clusterId: 'c0', recency: 4, frequency: 7, monetary: 240 },
    { customerId: 'customer-b', clusterId: 'c1', recency: 20, frequency: 2, monetary: 80 },
  ],
}

function renderPage(service: ModelEvaluationService, entry = '/model-evaluation') {
  return render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/model-evaluation" element={<ModelEvaluationPage service={service} />} /></Routes></MemoryRouter>)
}

function NavigateToSecondExperiment() {
  const [, setSearchParams] = useSearchParams()
  return <button onClick={() => setSearchParams({ experimentId: 'exp-2' })}>Navigate to second experiment</button>
}

describe('Model Evaluation page', () => {
  it('shows the honest empty state when no successful experiments are available', async () => {
    renderPage({ getExperiments: vi.fn().mockResolvedValue([]), getEvaluation: vi.fn() })
    expect(await screen.findByText(/Hasil evaluasi akan tersedia setelah eksperimen K-Means berhasil dijalankan dan backend terhubung/i)).toBeTruthy()
    expect(screen.queryByText('Excellent')).toBeNull()
  })

  it('loads the experiment named in the URL and displays its supplied metrics and cluster profiles', async () => {
    const getEvaluation = vi.fn().mockResolvedValue(evaluation)
    renderPage({ getExperiments: vi.fn().mockResolvedValue(experiments), getEvaluation }, '/model-evaluation?experimentId=exp-1')
    expect(await screen.findByText('18.5')).toBeTruthy()
    expect(screen.getByText('0.42')).toBeTruthy()
    expect(screen.getAllByText('median').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Customers evaluated').length).toBeGreaterThan(0)
    expect(getEvaluation).toHaveBeenCalledWith('exp-1', expect.any(AbortSignal))
  })

  it('uses distinct scatter axes when one axis changes to the currently selected value', async () => {
    const user = userEvent.setup()
    renderPage({ getExperiments: vi.fn().mockResolvedValue(experiments), getEvaluation: vi.fn().mockResolvedValue(evaluation) })
    await screen.findByText('18.5')
    await user.selectOptions(screen.getByLabelText('Scatter X axis'), 'frequency')
    expect(screen.getByLabelText('Scatter X axis')).toHaveProperty('value', 'frequency')
    expect(screen.getByLabelText('Scatter Y axis')).toHaveProperty('value', 'recency')
    expect(screen.getByRole('group', { name: /Scatter chart of 2 supplied customer points/ })).toBeTruthy()
  })

  it('does not show the previous experiment snapshot after browser URL navigation', async () => {
    const user = userEvent.setup()
    const getEvaluation = vi.fn().mockResolvedValueOnce(evaluation).mockImplementationOnce(() => new Promise(() => {}))
    const service = { getExperiments: vi.fn().mockResolvedValue(experiments), getEvaluation }
    render(<MemoryRouter initialEntries={['/model-evaluation?experimentId=exp-1']}><NavigateToSecondExperiment/><Routes><Route path="/model-evaluation" element={<ModelEvaluationPage service={service} />} /></Routes></MemoryRouter>)
    await screen.findByText('18.5')
    await user.click(screen.getByText('Navigate to second experiment'))
    expect(await screen.findByText('Loading results for exp-2…')).toBeTruthy()
    expect(screen.queryByText('18.5')).toBeNull()
  })

  it('loads and removes actual experiment comparisons without retraining', async () => {
    const user = userEvent.setup()
    const getEvaluation = vi.fn().mockImplementation(async (id: string) => ({ ...evaluation, experiment: { ...evaluation.experiment, id, k: id === 'exp-1' ? 2 : 3 } }))
    renderPage({ getExperiments: vi.fn().mockResolvedValue(experiments), getEvaluation })
    await screen.findByText('18.5')
    await user.click(screen.getByLabelText('Compare exp-1'))
    await user.click(screen.getByLabelText('Compare exp-2'))
    expect(await screen.findByText('Compare experiments')).toBeTruthy()
    expect(await screen.findByText('exp-2')).toBeTruthy()
    expect(getEvaluation).toHaveBeenCalledWith('exp-2', expect.any(AbortSignal))
    await user.click(screen.getByLabelText('Compare exp-2'))
    await waitFor(() => expect(screen.queryByText('Preprocessing versions differ')).toBeNull())
  })

  it('shows backend unavailable and retryable error states without sample results', async () => {
    const getExperiments = vi.fn().mockRejectedValueOnce(new Error('Metadata request failed.')).mockResolvedValueOnce([])
    renderPage({ getExperiments, getEvaluation: vi.fn() })
    expect(await screen.findByText(/Metadata request failed/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText(/Hasil evaluasi akan tersedia/i)).toBeTruthy()
  })
})
