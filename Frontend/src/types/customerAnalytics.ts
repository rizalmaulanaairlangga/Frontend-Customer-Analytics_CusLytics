export const rfmMetrics = ['recency', 'frequency', 'monetary'] as const

export type RfmMetric = (typeof rfmMetrics)[number]
export type SegmentationStatus = 'available' | 'unavailable' | 'pending'

export interface CustomerHistoryPoint {
  period: string
  label: string
  transactionValue?: number | null
  uniqueInvoices?: number | null
}

export interface CustomerRfmRecord {
  customerId: string
  recency: number | null
  frequency: number | null
  monetary: number | null
  clusterLabel?: string | null
  profile?: string | null
  history?: CustomerHistoryPoint[]
}

export interface CustomerAnalyticsSnapshot {
  summary: {
    eligibleCustomers?: number | null
    customersWithRfmProfiles?: number | null
    observationDate?: string
    analysisPeriod?: { start: string; end: string }
    segmentationStatus?: SegmentationStatus
    segmentationMessage?: string
  }
  distributions?: Partial<Record<RfmMetric, Array<{ label: string; count: number; rangeStart?: number; rangeEnd?: number }>>>
  customers: CustomerRfmRecord[]
  currencyCode?: string
  source?: 'api'
}

export interface CustomerAnalyticsService {
  getSnapshot(signal?: AbortSignal): Promise<CustomerAnalyticsSnapshot | null>
}
