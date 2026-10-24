export type MLExperimentStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'blocked'
export type MLMetadataStatus = 'available' | 'unavailable' | 'pending'

export interface MLStudioFeature {
  status: MLMetadataStatus
  sampleCount?: number | null
  minimum?: number | null
  maximum?: number | null
  mean?: number | null
  standardDeviation?: number | null
}

export interface MLStudioExperiment {
  id: string
  timestamp: string
  k: number
  randomSeed: number
  preprocessingVersion?: string | null
  status: MLExperimentStatus
  primaryMetric?: { label: string; value: number } | null
  message?: string | null
  startedAt?: string | null
  completedAt?: string | null
  evaluationAvailable?: boolean
}

export interface MLStudioWorkspace {
  rfm: {
    status: MLMetadataStatus
    message?: string
    features: { recency: MLStudioFeature; frequency: MLStudioFeature; monetary: MLStudioFeature }
  }
  preprocessing: { status: MLMetadataStatus; name?: string | null; version?: string | null }
  history: MLStudioExperiment[]
}

export interface MLExperimentConfiguration {
  k: number
  randomSeed: number
}

export interface MLStudioService {
  getWorkspace(signal?: AbortSignal): Promise<MLStudioWorkspace>
  runExperiment(configuration: MLExperimentConfiguration, signal?: AbortSignal): Promise<MLStudioExperiment>
}
