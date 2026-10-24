import { describe, expect, it, vi } from 'vitest'
import { ActionCenterConfigurationError, createApiActionCenterService, parseActionCenterSnapshot } from './actionCenterService'

const snapshot = {
  dataStatus: 'available',
  analysisPeriod: { start: '2026-01-01', end: '2026-03-31' },
  recommendations: [{
    id: 'rec-1', title: 'Review repeat-purchase timing', category: 'repeat-purchase', source: 'rfm',
    finding: 'The supplied profile reports a shorter Recency and low Frequency.',
    reasoning: 'This pattern may justify reviewing when a second purchase reminder is useful.',
    suggestedAction: 'Consider testing a relevant reminder with a small audience.',
    limitations: ['Purchase history does not establish that a reminder will increase sales.'],
    segment: 'segment A', customerIds: ['C-1'], createdAt: '2026-04-01T09:00:00Z',
    evidence: { recency: { value: 8, unit: 'days', source: 'RFM profile' }, frequency: { value: 1, unit: 'invoices', source: 'RFM profile' }, customersAnalyzed: 12, analysisPeriod: { start: '2026-01-01', end: '2026-03-31' } },
  }],
}

describe('Action Center service', () => {
  it('accepts complete supplied recommendations and evidence', () => {
    expect(parseActionCenterSnapshot(snapshot)).toEqual(snapshot)
  })

  it('rejects unknown categories instead of displaying an unrecognized rule', () => {
    const invalid = { ...snapshot, recommendations: [{ ...snapshot.recommendations[0], category: 'vip-score' }] }
    expect(() => parseActionCenterSnapshot(invalid)).toThrow(/recommendation response/i)
  })

  it('rejects evidence values with invalid numbers', () => {
    const invalid = { ...snapshot, recommendations: [{ ...snapshot.recommendations[0], evidence: { recency: { value: Number.NaN, unit: 'days' } } }] }
    expect(() => parseActionCenterSnapshot(invalid)).toThrow(/recommendation response/i)
  })

  it('requires a configured resource without inventing a default path', async () => {
    const service = createApiActionCenterService('', '', vi.fn())
    await expect(service.getSnapshot()).rejects.toBeInstanceOf(ActionCenterConfigurationError)
  })

  it('requests the configured resource with GET and validates the returned snapshot', async () => {
    const request = vi.fn().mockResolvedValue(snapshot)
    const service = createApiActionCenterService('https://api.example.test', '/configured-resource', request)
    await expect(service.getSnapshot()).resolves.toEqual(snapshot)
    expect(request).toHaveBeenCalledWith('/configured-resource', 'https://api.example.test', {}, undefined)
  })
})
