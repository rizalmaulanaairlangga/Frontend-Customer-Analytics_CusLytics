import { describe, expect, it, vi } from 'vitest'
import { createApiMLStudioService, MLStudioConfigurationError, parseMLStudioWorkspace } from './mlStudioService'

const workspace = {
  rfm: { status: 'available', features: { recency: { status: 'available' }, frequency: { status: 'available' }, monetary: { status: 'available' } } },
  preprocessing: { status: 'available', name: 'Backend supplied scaler', version: 'v2' },
  history: [{ id: 'exp-7', timestamp: '2026-10-24T08:00:00Z', k: 3, randomSeed: 42, preprocessingVersion: 'v2', status: 'succeeded', primaryMetric: { label: 'Silhouette score', value: 0.41 }, evaluationAvailable: true }],
}

describe('ML Studio service', () => {
  it('rejects connection attempts when the backend resource is not configured', async () => {
    const service = createApiMLStudioService('', '', '')
    await expect(service.getWorkspace()).rejects.toBeInstanceOf(MLStudioConfigurationError)
    await expect(service.runExperiment({ k: 3, randomSeed: 42 })).rejects.toBeInstanceOf(MLStudioConfigurationError)
  })

  it('accepts only backend supplied workspace metadata and experiment history', () => {
    expect(parseMLStudioWorkspace(workspace)).toEqual(workspace)
    expect(() => parseMLStudioWorkspace({ ...workspace, history: [{ id: 'x', k: 1 }] })).toThrow(/contract/i)
  })

  it('sends the selected configuration to the explicitly configured run resource', async () => {
    const request = vi.fn().mockResolvedValue({ id: 'exp-8', timestamp: '2026-10-24T09:00:00Z', k: 4, randomSeed: 73, status: 'queued' })
    const service = createApiMLStudioService('https://api.example.test', '/studio', '/experiments/run', undefined, request)
    await expect(service.runExperiment({ k: 4, randomSeed: 73 })).resolves.toMatchObject({ id: 'exp-8', status: 'queued' })
    expect(request).toHaveBeenCalledWith('/experiments/run', 'https://api.example.test', { k: 4, randomSeed: 73 }, undefined)
  })
})
