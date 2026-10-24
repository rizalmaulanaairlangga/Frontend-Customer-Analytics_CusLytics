import { getJson, type Query } from './apiClient'
import { qualityIndicatorIds, type DataQualitySnapshot, type QualityCategory, type QualityDatasetMetadata, type ValidationStatus } from '../types/dataQuality'

export interface DataQualityService {
  getSnapshot(signal?: AbortSignal): Promise<DataQualitySnapshot | null>
}

export class DataQualityConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataQualityConfigurationError'
  }
}

const categories: QualityCategory[] = ['missing', 'duplicate', 'anomaly', 'identity']
const validationStatuses: ValidationStatus[] = ['passed', 'warning', 'failed', 'pending']
const ruleStatuses = ['pending', 'planned', 'configured', 'executed'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0)
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isDataset(value: unknown): value is QualityDatasetMetadata {
  if (!isRecord(value)) return false
  const range = value.transactionDateRange
  const validRange = range === undefined || (isRecord(range) && typeof range.start === 'string' && typeof range.end === 'string')
  return ['available', 'pending', 'failed'].includes(String(value.readStatus)) &&
    validationStatuses.includes(value.validationStatus as ValidationStatus) &&
    ['rowCount', 'columnCount'].every((key) => value[key] === undefined || isCount(value[key])) &&
    validRange && ['fileIdentity', 'lastCheckedAt', 'errorMessage'].every((key) => isOptionalString(value[key]))
}

function isColumn(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (value.sourceName === null || isOptionalString(value.sourceName)) &&
    (value.conceptualName === undefined || value.conceptualName === null || typeof value.conceptualName === 'string') &&
    isOptionalString(value.detectedType) && typeof value.role === 'string' &&
    validationStatuses.includes(value.validationStatus as ValidationStatus) &&
    isOptionalString(value.note) && isOptionalString(value.details)
}

export function parseDataQualitySnapshot(value: unknown): DataQualitySnapshot {
  if (!isRecord(value) || !isDataset(value.dataset) || !Array.isArray(value.columns) || !value.columns.every(isColumn) || !isRecord(value.indicators)) {
    throw new Error('The data quality response is missing required profile fields. Confirm the backend contract.')
  }
  const indicators = value.indicators
  const validIndicators = qualityIndicatorIds.every((id) => {
    const item = indicators[id]
    return isRecord(item) && isCount(item.count) && isOptionalString(item.details)
  })
  const validCategories = Array.isArray(value.findingCategories) && value.findingCategories.every((item) =>
    isRecord(item) && categories.includes(item.category as QualityCategory) && isCount(item.count) && typeof item.label === 'string' && isOptionalString(item.detail)) &&
    new Set((value.findingCategories as Array<{ category: QualityCategory }>).map((item) => item.category)).size === (value.findingCategories as unknown[]).length
  const audit = value.cleaningAudit
  const validAudit = isRecord(audit) && isRecord(audit.rowCounts) &&
    ['before', 'retained', 'excluded'].every((key) => isCount((audit.rowCounts as Record<string, unknown>)[key])) &&
    Array.isArray(audit.exclusionReasons) && audit.exclusionReasons.every((item) => isRecord(item) && typeof item.reason === 'string' && isCount(item.affectedRows)) &&
    Array.isArray(audit.rules) && audit.rules.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.topic === 'string' && typeof item.description === 'string' && typeof item.impact === 'string' && isCount(item.affectedRows) && ruleStatuses.includes(item.status as (typeof ruleStatuses)[number])) &&
    new Set((audit.rules as Array<{ id: string }>).map((item) => item.id)).size === (audit.rules as unknown[]).length
  const validWarnings = Array.isArray(value.warnings) && value.warnings.every((item) =>
    isRecord(item) && typeof item.title === 'string' && typeof item.impact === 'string' && typeof item.action === 'string' && (item.affectedRows === undefined || isCount(item.affectedRows)))

  if (!validIndicators || !validCategories || !validAudit || !validWarnings) {
    throw new Error('The data quality response is missing required profile fields. Confirm the backend contract.')
  }

  return value as unknown as DataQualitySnapshot
}

type JsonRequest = (path: string, baseUrl: string, query?: Query, options?: { signal?: AbortSignal }) => Promise<unknown>

export function createApiDataQualityService(baseUrl: string, resourcePath: string, request: JsonRequest = getJson): DataQualityService {
  return {
    async getSnapshot(signal) {
      if (!resourcePath.trim()) {
        throw new DataQualityConfigurationError('Data quality profile path is not configured. Confirm the backend contract and set VITE_DATA_QUALITY_RESOURCE_PATH.')
      }
      if (!baseUrl.trim()) throw new DataQualityConfigurationError('Set VITE_API_BASE_URL before connecting to the data quality profile.')
      const result = parseDataQualitySnapshot(await request(resourcePath, baseUrl, {}, { signal }))
      return { ...result, source: 'api' }
    },
  }
}

export function createDataQualityService(config: { mode: string; baseUrl: string; resourcePath: string }): DataQualityService {
  if (config.mode === 'demo') return { async getSnapshot() { return null } }
  if (config.mode === 'api') return createApiDataQualityService(config.baseUrl, config.resourcePath)
  throw new DataQualityConfigurationError('Set VITE_DATA_MODE to either "demo" or "api".')
}

const env = import.meta.env
export const dataQualityService: DataQualityService = {
  async getSnapshot(signal) {
    const service = createDataQualityService({
      mode: env.VITE_DATA_MODE ?? (import.meta.env.DEV ? 'demo' : ''),
      baseUrl: env.VITE_API_BASE_URL ?? '',
      resourcePath: env.VITE_DATA_QUALITY_RESOURCE_PATH ?? '',
    })
    return service.getSnapshot(signal)
  },
}
