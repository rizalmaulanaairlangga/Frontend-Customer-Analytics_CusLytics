import { getJson, type Query } from './apiClient'
import type { ActionCenterEvidence, ActionCenterPeriod, ActionCenterService, ActionCenterSnapshot, ActionRecommendation, ActionRecommendationCategory } from '../types/actionCenter'
import { actionRecommendationCategories } from '../types/actionCenter'

export class ActionCenterConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionCenterConfigurationError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalText(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string'
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isPeriod(value: unknown): value is ActionCenterPeriod {
  return isRecord(value) && typeof value.start === 'string' && typeof value.end === 'string'
}

function isEvidenceMetric(value: unknown): boolean {
  return isRecord(value) && isOptionalNumber(value.value) && isOptionalText(value.unit) && isOptionalText(value.source)
}

function isEvidence(value: unknown): value is ActionCenterEvidence {
  if (value === undefined || value === null) return true
  if (!isRecord(value)) return false
  const validCluster = value.cluster === undefined || value.cluster === null || (isRecord(value.cluster) &&
    ((typeof value.cluster.clusterId === 'string' && value.cluster.clusterId.length > 0) || (typeof value.cluster.clusterId === 'number' && Number.isFinite(value.cluster.clusterId))) &&
    isOptionalText(value.cluster.experimentId))
  const validCustomerCount = value.customersAnalyzed === undefined || value.customersAnalyzed === null || (Number.isInteger(value.customersAnalyzed) && (value.customersAnalyzed as number) >= 0)
  return ['recency', 'frequency', 'monetary'].every((metric) => value[metric] === undefined || value[metric] === null || isEvidenceMetric(value[metric])) &&
    validCluster && (value.analysisPeriod === undefined || value.analysisPeriod === null || isPeriod(value.analysisPeriod)) && validCustomerCount && isOptionalText(value.sourceLabel)
}

function isRecommendation(value: unknown): value is ActionRecommendation {
  if (!isRecord(value)) return false
  const validCategory = actionRecommendationCategories.includes(value.category as ActionRecommendationCategory)
  const validSource = ['rfm', 'cluster', 'product'].includes(String(value.source))
  const validCreatedAt = isOptionalText(value.createdAt)
  const validLimitations = value.limitations === undefined || value.limitations === null || (Array.isArray(value.limitations) && value.limitations.every((item) => typeof item === 'string'))
  const validCustomers = value.customerIds === undefined || value.customerIds === null || (Array.isArray(value.customerIds) && value.customerIds.every((item) => typeof item === 'string'))
  return typeof value.id === 'string' && value.id.trim().length > 0 && typeof value.title === 'string' && value.title.trim().length > 0 && validCategory && validSource &&
    typeof value.finding === 'string' && value.finding.trim().length > 0 && isOptionalText(value.interpretation) && typeof value.reasoning === 'string' && value.reasoning.trim().length > 0 && isOptionalText(value.ruleReference) &&
    typeof value.suggestedAction === 'string' && value.suggestedAction.trim().length > 0 && validLimitations && isEvidence(value.evidence) && isOptionalText(value.segment) && validCustomers && validCreatedAt
}

export function parseActionCenterSnapshot(value: unknown): ActionCenterSnapshot {
  if (!isRecord(value) || !Array.isArray(value.recommendations) || !value.recommendations.every(isRecommendation)) {
    throw new Error('The Action Center recommendation response is missing required fields. Confirm the backend contract.')
  }
  const validStatus = value.dataStatus === undefined || value.dataStatus === null || ['available', 'partial', 'unavailable'].includes(String(value.dataStatus))
  const validPeriod = value.analysisPeriod === undefined || value.analysisPeriod === null || isPeriod(value.analysisPeriod)
  const ids = value.recommendations.map((recommendation) => recommendation.id)
  if (!validStatus || !validPeriod || !isOptionalText(value.sourceLabel) || new Set(ids).size !== ids.length) {
    throw new Error('The Action Center recommendation response is missing required fields. Confirm the backend contract.')
  }
  return value as unknown as ActionCenterSnapshot
}

type JsonRequest = (path: string, baseUrl: string, query?: Query, options?: { signal?: AbortSignal }) => Promise<unknown>

export function createApiActionCenterService(baseUrl: string, resourcePath: string, request: JsonRequest = getJson): ActionCenterService {
  return {
    async getSnapshot(signal) {
      if (!baseUrl.trim()) throw new ActionCenterConfigurationError('Set VITE_API_BASE_URL before connecting to Action Center.')
      if (!resourcePath.trim()) throw new ActionCenterConfigurationError('Action Center resource path is not configured. Confirm the backend contract and set VITE_ACTION_CENTER_RESOURCE_PATH.')
      return parseActionCenterSnapshot(await request(resourcePath, baseUrl, {}, signal ? { signal } : undefined))
    },
  }
}

const env = import.meta.env
export const actionCenterService = createApiActionCenterService(env.VITE_API_BASE_URL ?? '', env.VITE_ACTION_CENTER_RESOURCE_PATH ?? '')
