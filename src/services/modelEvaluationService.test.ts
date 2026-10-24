import { describe, expect, it, vi } from 'vitest'
import { createApiModelEvaluationService, ModelEvaluationConfigurationError, parseModelEvaluation } from './modelEvaluationService'

const evaluation = {
  experiment: { id: 'exp-1', timestamp: '2026-10-24T08:00:00Z', k: 2, randomSeed: 42, preprocessingVersion: 'v1', customersEvaluated: 5, clusterCount: 2, status: 'succeeded' },
  metrics: { inertia: 18.5, silhouette: { status: 'valid', value: 0.42 } },
  clusters: [
    { clusterId: 'c0', customerCount: 2, profile: { statistic: 'median', recency: 4, frequency: 7, monetary: 240 } },
    { clusterId: 'c1', customerCount: 3, profile: { statistic: 'median', recency: 20, frequency: 2, monetary: 80 } },
  ],
  points: [{ customerId: 'customer-a', clusterId: 'c0', recency: 4, frequency: 7, monetary: 240 }],
}

describe('Model Evaluation service', () => {
  it('accepts only consistent, backend-reported evaluation data', () => {
    expect(parseModelEvaluation(evaluation)).toEqual(evaluation)
    expect(() => parseModelEvaluation({ ...evaluation, experiment: { ...evaluation.experiment, customersEvaluated: 7 } })).toThrow(/cluster counts/i)
  })

  it('does not accept an invalid silhouette score as displayable', () => {
    const invalidScore = { ...evaluation, metrics: { inertia: 18.5, silhouette: { status: 'valid', value: 1.2 } } }
    expect(() => parseModelEvaluation(invalidScore)).toThrow(/contract/i)
  })

  it('requires an explicitly configured evaluation resource', async () => {
    const service = createApiModelEvaluationService('', '', '', { getExperiments: vi.fn().mockResolvedValue([]) })
    await expect(service.getEvaluation('exp-1')).rejects.toBeInstanceOf(ModelEvaluationConfigurationError)
  })

  it('requests a selected experiment by ID from the configured evaluation resource', async () => {
    const request = vi.fn().mockResolvedValue(evaluation)
    const service = createApiModelEvaluationService('https://api.example.test', '/studio', '/model-evaluation', { getExperiments: vi.fn().mockResolvedValue([]) }, request)
    await expect(service.getEvaluation('exp-1')).resolves.toMatchObject({ experiment: { id: 'exp-1' } })
    expect(request).toHaveBeenCalledWith('/model-evaluation', 'https://api.example.test', { experimentId: 'exp-1' }, undefined)
  })
})
