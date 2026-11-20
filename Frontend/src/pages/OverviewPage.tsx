import { useEffect, useState } from 'react'
import { FilterBar } from '../components/dashboard/FilterBar'
import { CustomerSummary } from '../components/dashboard/CustomerSummary'
import { KpiCard, MetricIcon } from '../components/dashboard/KpiCard'
import { ProductPerformance } from '../components/dashboard/ProductPerformance'
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart'
import { SystemStatus } from '../components/dashboard/SystemStatus'
import { PageSkeleton } from '../components/PageSkeleton'
import { StateMessage } from '../components/StateMessage'
import { NoticeBanner } from '../components/NoticeBanner'
import { SlidersHorizontal } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { analyticsService } from '../services/analyticsService'
import type { AnalyticsService, DashboardFilters, DashboardSnapshot, DateInterval } from '../types/analytics'
import { getUserFacingError } from '../services/userFacingError'

const initialFilters: DashboardFilters = { startDate: '', endDate: '', country: '' }
type RequestState = 'loading' | 'success' | 'error'
interface RequestStatus { key: string; state: RequestState; error?: string }

interface OverviewPageProps { service?: AnalyticsService }

export function OverviewPage({ service = analyticsService }: OverviewPageProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
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
      setRequest({ key: requestKey, state: 'error', error: getUserFacingError(error) })
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
  const activeFilterCount = Number(Boolean(appliedFilters.startDate || appliedFilters.endDate)) + Number(Boolean(appliedFilters.country))
  const formatFilterDate = (iso: string) => {
    const parsed = new Date(`${iso}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? iso : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed)
  }
  const handleApplyFilters = (filters: DashboardFilters) => { applyFilters(filters); setFiltersOpen(false) }

  return (
    <div className="overview-page">
      <div className="overview-title-row reveal reveal-0">
        <div>
          <h1>Overview Dashboard</h1>
          <p className="page-description">Ringkasan performa penjualan dan perilaku pelanggan dari dataset referensi.</p>
        </div>
        <div className="overview-filter-actions">
          <button className="button button-secondary overview-filter-button" type="button" aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} aria-hidden="true"/>Filter{activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}</button>
          {activeFilterCount > 0 && <div className="overview-filter-chips" aria-label="Applied filters">{(appliedFilters.startDate || appliedFilters.endDate) && <span className="filter-chip">{appliedFilters.startDate ? formatFilterDate(appliedFilters.startDate) : 'Any date'} – {appliedFilters.endDate ? formatFilterDate(appliedFilters.endDate) : 'Any date'}</span>}{appliedFilters.country && <span className="filter-chip">{appliedFilters.country}</span>}</div>}
        </div>
      </div>
      <Modal open={filtersOpen} titleId="overview-filter-title" onClose={() => setFiltersOpen(false)}>
        <div className="overview-filter-dialog-heading"><h2 id="overview-filter-title">Analysis filters</h2><p>Choose a date range and country for the dashboard.</p></div>
        <FilterBar value={draftFilters} countries={snapshot?.countryOptions ?? []} onChange={setDraftFilters} onApply={handleApplyFilters} />
        <p className="historical-note">Historical transactions, not live sales</p>
      </Modal>

      {snapshot?.source === 'demo' && (
        <NoticeBanner severity="info" className="demo-notice reveal reveal-2"><span><strong>Demo fixture:</strong> these values are illustrative, do not represent actual dataset results, and do not recalculate when filters change.</span></NoticeBanner>
      )}

      {requestState === 'loading' && !snapshot ? <PageSkeleton variant="overview" /> : requestState === 'error' ? (
        <StateMessage kind="error" title="Dashboard data could not be loaded" detail={request.error ?? 'Unable to load dashboard data.'} action={{ label: 'Coba lagi', onClick: () => setRetryCount((count) => count + 1) }} />
      ) : hasNoResults && requestState === 'success' ? (
        <StateMessage title="No results for these filters" detail="Try another date range or choose all countries." />
      ) : snapshot ? (
        <>
          {requestState === 'loading' && <p className="refreshing-note" role="status">Updating results for the applied filters…</p>}
          {!snapshot.currencyCode && <p className="currency-note">Currency unit not provided by this source</p>}
          <section className="kpi-grid reveal reveal-3" aria-label="Overview metrics">
            <KpiCard label="Sales Value" metricKey="salesValue" value={snapshot.metrics.salesValue.value} definition={snapshot.metrics.salesValue.definition} icon={<MetricIcon kind="sales" />} currencyCode={snapshot.currencyCode} />
            <KpiCard label="Unique Invoices" metricKey="uniqueInvoices" value={snapshot.metrics.uniqueInvoices.value} definition={snapshot.metrics.uniqueInvoices.definition} icon={<MetricIcon kind="invoice" />} />
            <KpiCard label="Units Sold" metricKey="unitsSold" value={snapshot.metrics.unitsSold.value} definition={snapshot.metrics.unitsSold.definition} icon={<MetricIcon kind="units" />} />
            <KpiCard label="Identified Customers" metricKey="identifiedCustomers" value={snapshot.metrics.identifiedCustomers.value} definition={snapshot.metrics.identifiedCustomers.definition} icon={<MetricIcon kind="customers" />} />
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
