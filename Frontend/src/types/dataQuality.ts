export const qualityIndicatorIds = [
  'missing_values', 'duplicate_rows', 'cancellation_invoices', 'negative_quantity',
  'nonpositive_price', 'invalid_dates', 'missing_customer_id', 'missing_product_id',
] as const

export type QualityIndicatorId = (typeof qualityIndicatorIds)[number]
export type QualityCategory = 'missing' | 'duplicate' | 'anomaly' | 'identity'
export type ValidationStatus = 'passed' | 'warning' | 'failed' | 'pending'
export type RuleStatus = 'pending' | 'planned' | 'configured' | 'executed'
export type ConceptualColumn = 'Invoice' | 'StockCode' | 'Description' | 'Quantity' | 'InvoiceDate' | 'Price' | 'Customer ID' | 'Country'

export interface QualityDatasetMetadata {
  readStatus: 'available' | 'pending' | 'failed'
  validationStatus: ValidationStatus
  fileIdentity?: string
  rowCount?: number
  columnCount?: number
  transactionDateRange?: { start: string; end: string }
  lastCheckedAt?: string
  errorMessage?: string
}

export interface QualityColumn {
  sourceName?: string | null
  conceptualName?: string | null
  detectedType?: string
  role: string
  validationStatus: ValidationStatus
  note?: string
  details?: string
}

export interface QualityIndicatorResult {
  count: number | null
  details?: string
}

export interface QualityFindingCategory {
  category: QualityCategory
  count: number
  label: string
  detail?: string
}

export interface CleaningRule {
  id: string
  topic: string
  description: string
  impact: string
  affectedRows: number | null
  status: RuleStatus
}

export interface DataQualitySnapshot {
  dataset: QualityDatasetMetadata
  columns: QualityColumn[]
  indicators: Record<QualityIndicatorId, QualityIndicatorResult>
  findingCategories: QualityFindingCategory[]
  cleaningAudit: {
    rowCounts: { before: number | null; retained: number | null; excluded: number | null }
    exclusionReasons: Array<{ reason: string; affectedRows: number | null }>
    rules: CleaningRule[]
  }
  warnings: Array<{ title: string; impact: string; action: string; affectedRows?: number | null }>
  source?: 'api'
}
