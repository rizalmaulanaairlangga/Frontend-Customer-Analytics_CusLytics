export const actionRecommendationCategories = ['retention', 'repeat-purchase', 'win-back', 'low-cost-reengagement', 'product-recommendation'] as const

export type ActionRecommendationCategory = (typeof actionRecommendationCategories)[number]
export type ActionRecommendationSource = 'rfm' | 'cluster' | 'product'
export type ActionCenterDataStatus = 'available' | 'partial' | 'unavailable'

export interface ActionEvidenceMetric {
  value?: number | null
  unit?: string | null
  source?: string | null
}

export interface ActionCenterPeriod {
  start: string
  end: string
}

export interface ActionCenterEvidence {
  recency?: ActionEvidenceMetric | null
  frequency?: ActionEvidenceMetric | null
  monetary?: ActionEvidenceMetric | null
  cluster?: { clusterId: string | number; experimentId?: string | null } | null
  analysisPeriod?: ActionCenterPeriod | null
  customersAnalyzed?: number | null
  sourceLabel?: string | null
}

export interface ActionRecommendation {
  id: string
  title: string
  category: ActionRecommendationCategory
  source: ActionRecommendationSource
  finding: string
  interpretation?: string | null
  reasoning: string
  ruleReference?: string | null
  suggestedAction: string
  limitations?: string[] | null
  evidence?: ActionCenterEvidence | null
  segment?: string | null
  customerIds?: string[] | null
  createdAt?: string | null
}

export interface ActionCenterSnapshot {
  recommendations: ActionRecommendation[]
  dataStatus?: ActionCenterDataStatus | null
  analysisPeriod?: ActionCenterPeriod | null
  sourceLabel?: string | null
}

export interface ActionCenterService {
  getSnapshot(signal?: AbortSignal): Promise<ActionCenterSnapshot>
}
