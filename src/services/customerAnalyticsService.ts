import { getJson, type Query } from './apiClient'
import { rfmMetrics, type CustomerAnalyticsService, type CustomerAnalyticsSnapshot, type CustomerHistoryPoint, type CustomerRfmRecord } from '../types/customerAnalytics'

export class CustomerAnalyticsConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomerAnalyticsConfigurationError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOptionalFinite(value: unknown): boolean {
  return value === undefined || value === null || isFiniteNumber(value)
}

function isHistory(value: unknown): value is CustomerHistoryPoint[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.period === 'string' && typeof item.label === 'string' && isOptionalFinite(item.transactionValue) &&
    (item.uniqueInvoices === undefined || item.uniqueInvoices === null || (Number.isInteger(item.uniqueInvoices) && (item.uniqueInvoices as number) >= 0)))
}

function isCustomer(value: unknown): value is CustomerRfmRecord {
  return isRecord(value) && typeof value.customerId === 'string' &&
    isOptionalFinite(value.monetary) && ['recency', 'frequency'].every((metric) => value[metric] === undefined || value[metric] === null || (Number.isInteger(value[metric]) && (value[metric] as number) >= 0)) &&
    (value.clusterLabel === undefined || value.clusterLabel === null || typeof value.clusterLabel === 'string') &&
    (value.profile === undefined || value.profile === null || typeof value.profile === 'string') &&
    (value.history === undefined || isHistory(value.history))
}

export function parseCustomerAnalyticsSnapshot(value: unknown): CustomerAnalyticsSnapshot {
  if (!isRecord(value) || !isRecord(value.summary) || (value.distributions !== undefined && !isRecord(value.distributions)) || !Array.isArray(value.customers)) {
    throw new Error('The customer analytics response is missing required fields. Confirm the backend contract.')
  }
  const summary = value.summary
  const period = summary.analysisPeriod
  const validPeriod = period === undefined || (isRecord(period) && typeof period.start === 'string' && typeof period.end === 'string')
  const validCount = (item: unknown) => item === undefined || item === null || (Number.isInteger(item) && (item as number) >= 0)
  const validStatus = summary.segmentationStatus === undefined || ['available', 'unavailable', 'pending'].includes(String(summary.segmentationStatus))
  const validSummary = validCount(summary.eligibleCustomers) && validCount(summary.customersWithRfmProfiles) && validStatus &&
    (summary.observationDate === undefined || typeof summary.observationDate === 'string') && validPeriod &&
    (summary.segmentationMessage === undefined || typeof summary.segmentationMessage === 'string')
  const distributions = value.distributions
  const validDistributions = distributions === undefined || (isRecord(distributions) && rfmMetrics.every((metric) => distributions[metric] === undefined || (Array.isArray(distributions[metric]) && (distributions[metric] as unknown[]).every((bin) =>
    isRecord(bin) && typeof bin.label === 'string' && Number.isInteger(bin.count) && (bin.count as number) >= 0 && isOptionalFinite(bin.rangeStart) && isOptionalFinite(bin.rangeEnd)))))
  const validCurrency = value.currencyCode === undefined || typeof value.currencyCode === 'string'
  const customerIds = value.customers.filter(isCustomer).map((customer) => customer.customerId)
  if (!validSummary || !validDistributions || !validCurrency || !value.customers.every(isCustomer) || new Set(customerIds).size !== value.customers.length) {
    throw new Error('The customer analytics response is missing required fields. Confirm the backend contract.')
  }
  return value as unknown as CustomerAnalyticsSnapshot
}

type JsonRequest = (path: string, baseUrl: string, query?: Query, options?: { signal?: AbortSignal }) => Promise<unknown>

export function createApiCustomerAnalyticsService(baseUrl: string, resourcePath: string, request: JsonRequest = getJson): CustomerAnalyticsService {
  return {
    async getSnapshot(signal) {
      if (!resourcePath.trim()) throw new CustomerAnalyticsConfigurationError('Customer analytics path is not configured. Confirm the backend contract and set VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH.')
      if (!baseUrl.trim()) throw new CustomerAnalyticsConfigurationError('Set VITE_API_BASE_URL before connecting to customer analytics.')
      const result = parseCustomerAnalyticsSnapshot(await request(resourcePath, baseUrl, {}, { signal }))
      return { ...result, source: 'api' }
    },
  }
}

export function createCustomerAnalyticsService(config: { mode: string; baseUrl: string; resourcePath: string }): CustomerAnalyticsService {
  if (config.mode === 'demo') return { async getSnapshot() { return null } }
  if (config.mode === 'api') return createApiCustomerAnalyticsService(config.baseUrl, config.resourcePath)
  throw new CustomerAnalyticsConfigurationError('Set VITE_DATA_MODE to either "demo" or "api".')
}

const env = import.meta.env
export const customerAnalyticsService: CustomerAnalyticsService = {
  async getSnapshot(signal) {
    const service = createCustomerAnalyticsService({
      mode: env.VITE_DATA_MODE ?? (import.meta.env.DEV ? 'demo' : ''),
      baseUrl: env.VITE_API_BASE_URL ?? '',
      resourcePath: env.VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH ?? '',
    })
    return service.getSnapshot(signal)
  },
}

