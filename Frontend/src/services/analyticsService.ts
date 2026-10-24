import { createApiAnalyticsService } from './apiAnalyticsService'
import { demoAnalyticsService } from './demoAnalyticsService'
import type { AnalyticsService } from '../types/analytics'

export interface AnalyticsServiceConfig {
  mode: string
  baseUrl?: string
  resourcePath?: string
  demoService?: AnalyticsService
  apiService?: AnalyticsService
}

export function createAnalyticsService(config: AnalyticsServiceConfig): AnalyticsService {
  const demoService = config.demoService ?? demoAnalyticsService
  const apiService = config.apiService ?? createApiAnalyticsService(
    config.baseUrl ?? '', config.resourcePath ?? '',
  )

  if (config.mode === 'demo') return demoService
  if (config.mode === 'api') return apiService
  throw new Error('Set VITE_DATA_MODE to either "demo" or "api".')
}

const env = import.meta.env
export const analyticsService: AnalyticsService = {
  async getDashboard(filters, interval, signal) {
    const service = createAnalyticsService({
      mode: env.VITE_DATA_MODE ?? (import.meta.env.DEV ? 'demo' : ''),
      baseUrl: env.VITE_API_BASE_URL ?? '',
      resourcePath: env.VITE_ANALYTICS_RESOURCE_PATH ?? '',
    })
    return service.getDashboard(filters, interval, signal)
  },
}
