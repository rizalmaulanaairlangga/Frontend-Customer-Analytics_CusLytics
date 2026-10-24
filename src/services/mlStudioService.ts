import { getJson, postJson } from './apiClient'
import type { MLExperimentConfiguration, MLStudioExperiment, MLStudioService, MLStudioWorkspace } from '../types/mlStudio'

export class MLStudioConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MLStudioConfigurationError'
  }
}

export class MLStudioUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MLStudioUnavailableError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isMetadataStatus(value: unknown): boolean {
  return ['available', 'unavailable', 'pending'].includes(String(value))
}

function isFeature(value: unknown): boolean {
  if (!isRecord(value) || !isMetadataStatus(value.status)) return false
  return ['sampleCount', 'minimum', 'maximum', 'mean', 'standardDeviation'].every((field) => isOptionalNumber(value[field]))
}

function isExperiment(value: unknown): value is MLStudioExperiment {
  if (!isRecord(value)) return false
  const metric = value.primaryMetric
  return typeof value.id === 'string' && value.id.length > 0 && typeof value.timestamp === 'string' &&
    Number.isInteger(value.k) && (value.k as number) >= 2 && (value.k as number) <= 8 &&
    Number.isInteger(value.randomSeed) && ['queued', 'running', 'succeeded', 'failed', 'blocked'].includes(String(value.status)) &&
    (value.preprocessingVersion === undefined || value.preprocessingVersion === null || typeof value.preprocessingVersion === 'string') &&
    (metric === undefined || metric === null || (isRecord(metric) && typeof metric.label === 'string' && typeof metric.value === 'number' && Number.isFinite(metric.value))) &&
    (value.message === undefined || value.message === null || typeof value.message === 'string') &&
    (value.startedAt === undefined || value.startedAt === null || typeof value.startedAt === 'string') &&
    (value.completedAt === undefined || value.completedAt === null || typeof value.completedAt === 'string') &&
    (value.evaluationAvailable === undefined || typeof value.evaluationAvailable === 'boolean')
}

export function parseMLStudioWorkspace(value: unknown): MLStudioWorkspace {
  if (!isRecord(value)) throw new Error('The ML Studio response is missing required fields. Confirm the backend contract.')
  const rfm = value.rfm
  const preprocessing = value.preprocessing
  const history = value.history
  if (!isRecord(rfm) || !isRecord(rfm.features) || !isRecord(preprocessing) || !Array.isArray(history)) {
    throw new Error('The ML Studio response is missing required fields. Confirm the backend contract.')
  }
  const features = rfm.features
  if (!isMetadataStatus(rfm.status) || !isMetadataStatus(preprocessing.status) ||
    !['recency', 'frequency', 'monetary'].every((key) => isFeature(features[key])) ||
    (rfm.message !== undefined && typeof rfm.message !== 'string') ||
    (preprocessing.name !== undefined && preprocessing.name !== null && typeof preprocessing.name !== 'string') ||
    (preprocessing.version !== undefined && preprocessing.version !== null && typeof preprocessing.version !== 'string') ||
    !history.every(isExperiment)) {
    throw new Error('The ML Studio response is missing required fields. Confirm the backend contract.')
  }
  return value as unknown as MLStudioWorkspace
}

export function parseMLStudioExperiment(value: unknown): MLStudioExperiment {
  if (!isExperiment(value)) throw new Error('The experiment response is missing required fields. Confirm the backend contract.')
  return value
}

type JsonGet = (path: string, baseUrl: string, query?: Record<string, string | undefined>, options?: { signal?: AbortSignal }) => Promise<unknown>
type JsonPost = (path: string, baseUrl: string, body: unknown, options?: { signal?: AbortSignal }) => Promise<unknown>

export function createApiMLStudioService(baseUrl: string, workspacePath: string, runPath: string, getRequest: JsonGet = getJson, postRequest: JsonPost = postJson): MLStudioService {
  function requireConnection(path: string, name: string) {
    if (!baseUrl.trim()) throw new MLStudioConfigurationError('Set VITE_API_BASE_URL before connecting to ML Studio.')
    if (!path.trim()) throw new MLStudioConfigurationError(`${name} is not configured. Confirm the backend contract and set the matching VITE_ML_STUDIO resource path.`)
  }

  return {
    async getWorkspace(signal) {
      requireConnection(workspacePath, 'ML Studio workspace path')
      return parseMLStudioWorkspace(await getRequest(workspacePath, baseUrl, {}, { signal }))
    },
    async runExperiment(configuration: MLExperimentConfiguration, signal) {
      requireConnection(runPath, 'ML Studio experiment path')
      return parseMLStudioExperiment(await postRequest(runPath, baseUrl, configuration, signal ? { signal } : undefined))
    },
  }
}

export const mlStudioService: MLStudioService = createApiMLStudioService(
  import.meta.env.VITE_API_BASE_URL ?? '',
  import.meta.env.VITE_ML_STUDIO_RESOURCE_PATH ?? '',
  import.meta.env.VITE_ML_STUDIO_RUN_RESOURCE_PATH ?? '',
)
