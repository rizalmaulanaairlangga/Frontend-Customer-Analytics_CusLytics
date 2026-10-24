import type { MLStudioExperiment } from './mlStudio'

export type RfmStatistic = 'mean' | 'median'
export type SilhouetteStatus = 'valid' | 'invalid' | 'unavailable'

export interface EvaluationCluster {
  clusterId: string | number
  customerCount: number
  percentage?: number | null
  profile?: {
    statistic: RfmStatistic
    recency?: number | null
    frequency?: number | null
    monetary?: number | null
  } | null
}

export interface EvaluationPoint {
  customerId: string
  clusterId: string | number
  recency?: number | null
  frequency?: number | null
  monetary?: number | null
}

export interface ModelEvaluationSnapshot {
  experiment: Pick<MLStudioExperiment, 'id' | 'timestamp' | 'k' | 'randomSeed' | 'status'> & {
    preprocessingVersion?: string | null
    customersEvaluated: number
    clusterCount: number
  }
  metrics: {
    inertia?: number | null
    silhouette?: { status: SilhouetteStatus; value?: number | null; reason?: string | null } | null
  }
  clusters: EvaluationCluster[]
  points?: EvaluationPoint[] | null
  monetaryUnit?: string | null
}

export interface ModelEvaluationExperimentSource {
  getExperiments(signal?: AbortSignal): Promise<MLStudioExperiment[]>
}

export interface ModelEvaluationService extends ModelEvaluationExperimentSource {
  getEvaluation(experimentId: string, signal?: AbortSignal): Promise<ModelEvaluationSnapshot>
}
