import { getJson } from './apiClient'
import { createApiMLStudioService, MLStudioConfigurationError } from './mlStudioService'
import type { ModelEvaluationExperimentSource, ModelEvaluationService, ModelEvaluationSnapshot } from '../types/modelEvaluation'

export class ModelEvaluationConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelEvaluationConfigurationError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isClusterId(value: unknown): value is string | number {
  return (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && Number.isFinite(value))
}

function isProfile(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (!isRecord(value) || !['mean', 'median'].includes(String(value.statistic))) return false
  return ['recency', 'frequency', 'monetary'].every((metric) => isOptionalFiniteNumber(value[metric]))
}

function isCluster(value: unknown): boolean {
  return isRecord(value) && isClusterId(value.clusterId) && Number.isInteger(value.customerCount) && (value.customerCount as number) >= 0 &&
    (value.percentage === undefined || value.percentage === null || (typeof value.percentage === 'number' && Number.isFinite(value.percentage) && value.percentage >= 0 && value.percentage <= 100)) && isProfile(value.profile)
}

function isPoint(value: unknown): boolean {
  return isRecord(value) && typeof value.customerId === 'string' && value.customerId.length > 0 && isClusterId(value.clusterId) &&
    ['recency', 'frequency', 'monetary'].every((metric) => isOptionalFiniteNumber(value[metric]))
}

function isSilhouette(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (!isRecord(value) || !['valid', 'invalid', 'unavailable'].includes(String(value.status))) return false
  if (value.status === 'valid') return typeof value.value === 'number' && Number.isFinite(value.value) && value.value >= -1 && value.value <= 1
  return isOptionalFiniteNumber(value.value) && (value.reason === undefined || value.reason === null || typeof value.reason === 'string')
}

export function parseModelEvaluation(value: unknown): ModelEvaluationSnapshot {
  if (!isRecord(value) || !isRecord(value.experiment) || !isRecord(value.metrics) || !Array.isArray(value.clusters)) {
    throw new Error('The model evaluation response is missing required fields. Confirm the backend contract.')
  }
  const experiment = value.experiment
  const metrics = value.metrics
  const clusters = value.clusters
  const points = value.points
  const validExperiment = typeof experiment.id === 'string' && experiment.id.length > 0 && typeof experiment.timestamp === 'string' &&
    Number.isInteger(experiment.k) && (experiment.k as number) >= 2 && (experiment.k as number) <= 8 && Number.isInteger(experiment.randomSeed) &&
    Number.isInteger(experiment.customersEvaluated) && (experiment.customersEvaluated as number) >= 0 &&
    Number.isInteger(experiment.clusterCount) && (experiment.clusterCount as number) >= 0 && experiment.status === 'succeeded' &&
    (experiment.preprocessingVersion === undefined || experiment.preprocessingVersion === null || typeof experiment.preprocessingVersion === 'string')
  const validMetrics = (metrics.inertia === undefined || metrics.inertia === null || (typeof metrics.inertia === 'number' && Number.isFinite(metrics.inertia) && metrics.inertia >= 0)) && isSilhouette(metrics.silhouette)
  const clusterIds = clusters.filter(isCluster).map((cluster) => `${typeof cluster.clusterId}:${cluster.clusterId}`)
  const validClusters = clusters.every(isCluster) && new Set(clusterIds).size === clusters.length && clusters.length === experiment.clusterCount &&
    clusters.reduce((sum, cluster) => sum + (isRecord(cluster) && typeof cluster.customerCount === 'number' ? cluster.customerCount : 0), 0) === experiment.customersEvaluated
  const validPoints = points === undefined || points === null || (Array.isArray(points) && points.every(isPoint) &&
    new Set(points.filter(isPoint).map((point) => point.customerId)).size === points.length && points.every((point) => isClusterId(point.clusterId) && clusters.some((cluster) => isRecord(cluster) && cluster.clusterId === point.clusterId)))
  const validUnit = value.monetaryUnit === undefined || value.monetaryUnit === null || typeof value.monetaryUnit === 'string'
  if (!validExperiment || !validMetrics || !validClusters || !validPoints || !validUnit) {
    if (validExperiment && !validClusters) throw new Error('The cluster counts do not match the evaluated customer total.')
    throw new Error('The model evaluation response is missing required fields. Confirm the backend contract.')
  }
  return value as unknown as ModelEvaluationSnapshot
}

type JsonRequest = (path: string, baseUrl: string, query?: Record<string, string | undefined>, options?: { signal?: AbortSignal }) => Promise<unknown>

const mlStudioExperimentSource = (baseUrl: string, workspacePath: string): ModelEvaluationExperimentSource => {
  const studioService = createApiMLStudioService(baseUrl, workspacePath, '')
  return {
    async getExperiments(signal) {
      try {
        const workspace = await studioService.getWorkspace(signal)
        return workspace.history.filter((experiment) => experiment.status === 'succeeded')
      } catch (error) {
        if (error instanceof MLStudioConfigurationError) throw new ModelEvaluationConfigurationError(error.message)
        throw error
      }
    },
  }
}

export function createApiModelEvaluationService(
  baseUrl: string,
  workspacePath: string,
  evaluationPath: string,
  experimentSource: ModelEvaluationExperimentSource = mlStudioExperimentSource(baseUrl, workspacePath),
  request: JsonRequest = getJson,
): ModelEvaluationService {
  return {
    async getExperiments(signal) {
      return experimentSource.getExperiments(signal)
    },
    async getEvaluation(experimentId: string, signal) {
      if (!baseUrl.trim()) throw new ModelEvaluationConfigurationError('Set VITE_API_BASE_URL before connecting to Model Evaluation.')
      if (!evaluationPath.trim()) throw new ModelEvaluationConfigurationError('Model Evaluation path is not configured. Confirm the backend contract and set VITE_MODEL_EVALUATION_RESOURCE_PATH.')
      const snapshot = parseModelEvaluation(await request(evaluationPath, baseUrl, { experimentId }, signal ? { signal } : undefined))
      if (snapshot.experiment.id !== experimentId) throw new Error('The evaluation response does not match the selected experiment ID.')
      return snapshot
    },
  }
}

export const modelEvaluationService: ModelEvaluationService = createApiModelEvaluationService(
  import.meta.env.VITE_API_BASE_URL ?? '',
  import.meta.env.VITE_ML_STUDIO_RESOURCE_PATH ?? '',
  import.meta.env.VITE_MODEL_EVALUATION_RESOURCE_PATH ?? '',
)
