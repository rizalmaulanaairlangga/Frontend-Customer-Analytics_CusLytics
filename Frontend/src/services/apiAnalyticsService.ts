import { getJson } from './apiClient'
import type { AnalyticsService, DashboardFilters, DashboardSnapshot, DateInterval } from '../types/analytics'

interface DashboardResponse extends Omit<DashboardSnapshot, 'source'> {
  source?: never
}

function isDashboardResponse(value: unknown): value is DashboardResponse {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<DashboardResponse>
  const isOptionalCount = (count: unknown) => count === null || (typeof count === 'number' && Number.isFinite(count))
  const isMetric = (metric: unknown) => {
    if (!metric || typeof metric !== 'object') return false
    const item = metric as { value?: unknown; definition?: unknown }
    return isOptionalCount(item.value) && typeof item.definition === 'string'
  }
  const isOptionalNumber = (number: unknown) => number === undefined || number === null || (typeof number === 'number' && Number.isFinite(number))
  const isTrendPoint = (point: unknown) => {
    if (!point || typeof point !== 'object') return false
    const item = point as { period?: unknown; label?: unknown; salesValue?: unknown; uniqueInvoices?: unknown; unitsSold?: unknown }
    return typeof item.period === 'string' && typeof item.label === 'string' &&
      typeof item.salesValue === 'number' && Number.isFinite(item.salesValue) &&
      isOptionalNumber(item.uniqueInvoices) && isOptionalNumber(item.unitsSold)
  }
  const isProduct = (product: unknown) => {
    if (!product || typeof product !== 'object') return false
    const item = product as { productId?: unknown; description?: unknown; salesValue?: unknown; unitsSold?: unknown; uniqueInvoices?: unknown }
    return typeof item.productId === 'string' && typeof item.description === 'string' &&
      typeof item.salesValue === 'number' && Number.isFinite(item.salesValue) &&
      typeof item.unitsSold === 'number' && Number.isFinite(item.unitsSold) &&
      isOptionalNumber(item.uniqueInvoices)
  }
  const isCountry = (country: unknown) => {
    if (!country || typeof country !== 'object') return false
    const item = country as { country?: unknown; transactionValue?: unknown; uniqueInvoices?: unknown }
    return typeof item.country === 'string' && item.country.length > 0 &&
      typeof item.transactionValue === 'number' && Number.isFinite(item.transactionValue) &&
      isOptionalNumber(item.uniqueInvoices)
  }
  const summary = data.customerSummary
  const status = data.status
  return Boolean(
    isMetric(data.metrics?.salesValue) && isMetric(data.metrics?.uniqueInvoices) &&
    isMetric(data.metrics?.unitsSold) && isMetric(data.metrics?.identifiedCustomers) &&
    Array.isArray(data.trend) && data.trend.every(isTrendPoint) &&
    Array.isArray(data.products) && data.products.every(isProduct) &&
    (data.countries === undefined || (Array.isArray(data.countries) && data.countries.every(isCountry))) &&
    summary && isOptionalCount(summary.identifiedCustomers) &&
    ['available', 'unavailable', 'pending'].includes(summary.rfmStatus) &&
    (summary.rfmMessage === undefined || typeof summary.rfmMessage === 'string') &&
    status && typeof status === 'object' &&
    ['dataset', 'processing', 'lastProcessedAt', 'lastExperiment'].every((key) =>
      (status as Record<string, unknown>)[key] === undefined || typeof (status as Record<string, unknown>)[key] === 'string') &&
    data.filters && typeof data.filters.startDate === 'string' && typeof data.filters.endDate === 'string' &&
    typeof data.filters.country === 'string' && ['day', 'week', 'month'].includes(data.interval ?? '') &&
    (data.currencyCode === undefined || /^[A-Z]{3}$/.test(data.currencyCode)) &&
    Array.isArray(data.countryOptions) && data.countryOptions.every((country) => typeof country === 'string'),
  )
}

export function createApiAnalyticsService(baseUrl: string, resourcePath: string): AnalyticsService {
  return {
    async getDashboard(filters: DashboardFilters, interval: DateInterval, signal?: AbortSignal) {
      if (!resourcePath.trim()) {
        throw new Error('Analytics API path is not configured. Confirm the backend contract and set VITE_ANALYTICS_RESOURCE_PATH.')
      }
      const data = await getJson<unknown>(resourcePath, baseUrl, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        country: filters.country,
        interval,
      }, { signal })
      if (!isDashboardResponse(data)) {
        throw new Error('The analytics response is missing required dashboard fields. Confirm the API contract.')
      }
      return { ...data, source: 'api' }
    },
  }
}
