export type DateInterval = 'day' | 'week' | 'month'

export interface DashboardFilters {
  startDate: string
  endDate: string
  country: string
}

export interface MetricValue {
  value: number | null
  definition: string
}

export interface TrendPoint {
  period: string
  label: string
  salesValue: number
  uniqueInvoices?: number | null
  unitsSold?: number | null
}

export interface ProductRank {
  productId: string
  description: string
  salesValue: number
  unitsSold: number
  uniqueInvoices?: number | null
}

export interface CountryRank {
  country: string
  transactionValue: number
  uniqueInvoices?: number | null
}

export interface DashboardSnapshot {
  filters: DashboardFilters
  interval: DateInterval
  currencyCode?: string
  metrics: {
    salesValue: MetricValue
    uniqueInvoices: MetricValue
    unitsSold: MetricValue
    identifiedCustomers: MetricValue
  }
  trend: TrendPoint[]
  products: ProductRank[]
  countries?: CountryRank[]
  countryOptions: string[]
  customerSummary: {
    identifiedCustomers: number | null
    rfmStatus: 'available' | 'unavailable' | 'pending'
    rfmMessage?: string
  }
  source: 'demo' | 'api'
  status: {
    dataset?: string
    processing?: string
    lastProcessedAt?: string
    lastExperiment?: string
  }
}

export interface AnalyticsService {
  getDashboard(filters: DashboardFilters, interval: DateInterval, signal?: AbortSignal): Promise<DashboardSnapshot>
}
