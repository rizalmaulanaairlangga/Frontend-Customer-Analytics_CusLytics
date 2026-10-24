import { useEffect, useState } from 'react'
import { FilterBar } from '../components/dashboard/FilterBar'
import { CustomerSummary } from '../components/dashboard/CustomerSummary'
import { KpiCard, MetricIcon } from '../components/dashboard/KpiCard'
import { ProductPerformance } from '../components/dashboard/ProductPerformance'
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart'
import { SystemStatus } from '../components/dashboard/SystemStatus'
import { LoadingState } from '../components/LoadingState'
import { StateMessage } from '../components/StateMessage'
import { StatusBadge } from '../components/StatusBadge'
import { History } from 'lucide-react'
import { analyticsService } from '../services/analyticsService'
import type { AnalyticsService, DashboardFilters, DashboardSnapshot, DateInterval } from '../types/analytics'

const initialFilters: DashboardFilters = { startDate: '', endDate: '', country: '' }
type RequestState = 'loading' | 'success' | 'error'
interface RequestStatus { key: string; state: RequestState; error?: string }

interface OverviewPageProps { service?: AnalyticsService }

export function OverviewPage({ service = analyticsService }: OverviewPageProps) {
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [interval, setInterval] = useState<DateInterval>('month')
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [request, setRequest] = useState<RequestStatus>({ key: '', state: 'loading' })
  const [retryCount, setRetryCount] = useState(0)
  const requestKey = `${JSON.stringify(appliedFilters)}:${interval}:${retryCount}`
  const requestState = request.key === requestKey ? request.state : 'loading'

  useEffect(() => {
    const controller = new AbortController()
    service.getDashboard(appliedFilters, interval, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setSnapshot(result)
      setRequest({ key: requestKey, state: 'success' })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setRequest({ key: requestKey, state: 'error', error: error instanceof Error ? error.message : 'Unable to load dashboard data.' })
    })
    return () => controller.abort()
  }, [service, appliedFilters, interval, retryCount, requestKey])

  function applyFilters(filters: DashboardFilters) {
    setDraftFilters(filters)
    setAppliedFilters(filters)
  }

  const hasNoResults = snapshot !== null && snapshot.metrics.salesValue.value === null &&
    snapshot.metrics.uniqueInvoices.value === null && snapshot.metrics.unitsSold.value === null &&
    snapshot.metrics.identifiedCustomers.value === null && snapshot.trend.length === 0 && snapshot.products.length === 0

  return (
    <div className="overview-page">
      <div className="overview-title-row">
        <div>
          <p className="eyebrow">Customer analytics</p>
          <h1>Overview Dashboard</h1>
          <p className="page-description">Ringkasan performa penjualan dan perilaku pelanggan dari dataset referensi.</p>
        </div>
        {snapshot && <StatusBadge tone={snapshot.source === 'demo' ? 'demo' : 'success'}>{snapshot.source === 'demo' ? 'Demo Data' : 'Backend Data'}</StatusBadge>}
      </div>

      <section className="filter-section" aria-labelledby="filters-title">
        <div className="filter-section-heading">
          <div><h2 id="filters-title">Analysis filters</h2><p>Use one filter set across the dashboard.</p></div>
          <span className="historical-note"><span className="historical-mark" aria-hidden="true"><History size={13} /></span> Historical transactions, not live sales</span>
        </div>
        <FilterBar value={draftFilters} countries={snapshot?.countryOptions ?? []} onChange={setDraftFilters} onApply={applyFilters} />
      </section>

      {snapshot?.source === 'demo' && (
        <div className="demo-notice" role="note">
          <span className="demo-notice-mark" aria-hidden="true">D</span>
          <p><strong>Illustrative demo fixture.</strong> These values are not actual dataset results and are not recalculated for selected filters. Applied filters are passed through the demo service interface for integration preview.</p>
        </div>
      )}

      {requestState === 'loading' && !snapshot ? <LoadingState /> : requestState === 'error' ? (
        <StateMessage kind="error" title="Dashboard data could not be loaded" detail={request.error ?? 'Unable to load dashboard data.'} action={{ label: 'Retry', onClick: () => setRetryCount((count) => count + 1) }} />
      ) : hasNoResults && requestState === 'success' ? (
        <StateMessage title="No results for these filters" detail="Try another date range or choose all countries." />
      ) : snapshot ? (
        <>
          {requestState === 'loading' && <p className="refreshing-note" role="status">Updating results for the applied filters…</p>}
          <div className="active-filter-summary"><span className="active-filter-dot" />
            <span>Applied: {snapshot.filters.startDate || snapshot.filters.endDate ? `${snapshot.filters.startDate || 'Any date'} to ${snapshot.filters.endDate || 'Any date'}` : 'All available dates'} · {snapshot.filters.country || 'All countries'}</span>
            {!snapshot.currencyCode && <span className="currency-note">Currency unit not provided by this source</span>}
          </div>
          <section className="kpi-grid" aria-label="Overview metrics">
            <KpiCard label="Sales Value" value={snapshot.metrics.salesValue.value} definition={snapshot.metrics.salesValue.definition} icon={<MetricIcon kind="sales" />} currencyCode={snapshot.currencyCode} />
            <KpiCard label="Unique Invoices" value={snapshot.metrics.uniqueInvoices.value} definition={snapshot.metrics.uniqueInvoices.definition} icon={<MetricIcon kind="invoice" />} />
            <KpiCard label="Units Sold" value={snapshot.metrics.unitsSold.value} definition={snapshot.metrics.unitsSold.definition} icon={<MetricIcon kind="units" />} />
            <KpiCard label="Identified Customers" value={snapshot.metrics.identifiedCustomers.value} definition={snapshot.metrics.identifiedCustomers.definition} icon={<MetricIcon kind="customers" />} />
          </section>

          <SalesTrendChart data={snapshot.trend} interval={interval} onIntervalChange={setInterval} currencyCode={snapshot.currencyCode} />

          <div className="secondary-grid">
            <ProductPerformance products={snapshot.products} currencyCode={snapshot.currencyCode} />
            <CustomerSummary summary={snapshot.customerSummary} />
          </div>

          <SystemStatus status={snapshot.status} />
        </>
      ) : null}
    </div>
  )
}
