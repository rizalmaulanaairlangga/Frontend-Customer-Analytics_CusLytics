import { useEffect, useState } from 'react'
import { BarChart3, Clock3, Database, Info, Package, Receipt, UsersRound } from 'lucide-react'
import { FilterBar } from '../components/dashboard/FilterBar'
import { KpiCard } from '../components/dashboard/KpiCard'
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart'
import { CountryRanking, InvoiceUnitsTrend, ProductRanking, type ProductMetric, type TrendMetric } from '../components/sales-products/SalesProductsCharts'
import { ProductTable } from '../components/sales-products/ProductTable'
import { StateMessage } from '../components/StateMessage'
import { StatusBadge } from '../components/StatusBadge'
import { analyticsService } from '../services/analyticsService'
import type { AnalyticsService, DashboardFilters, DashboardSnapshot, DateInterval } from '../types/analytics'

const initialFilters: DashboardFilters = { startDate: '', endDate: '', country: '' }
type LoadState = 'loading' | 'success' | 'unavailable' | 'error'
interface RequestState { key: string; state: LoadState; error?: string }

function isConfigurationError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : ''
  return message.includes('VITE_API_BASE_URL') || message.includes('VITE_ANALYTICS_RESOURCE_PATH') || message.includes('VITE_DATA_MODE')
}

function formatRange(filters: DashboardFilters): string {
  const period = filters.startDate || filters.endDate ? `${filters.startDate || 'Any date'} to ${filters.endDate || 'Any date'}` : 'All available dates'
  return `${period} · ${filters.country || 'All countries'}`
}

export function SalesProductsPage({ service = analyticsService }: { service?: AnalyticsService }) {
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>(initialFilters)
  const [interval, setInterval] = useState<DateInterval>('month')
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [request, setRequest] = useState<RequestState>({ key: '', state: 'loading' })
  const [retry, setRetry] = useState(0)
  const [productMetric, setProductMetric] = useState<ProductMetric>('salesValue')
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('uniqueInvoices')
  const [rankCount, setRankCount] = useState<5 | 10>(5)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const requestKey = `${JSON.stringify(appliedFilters)}:${interval}:${retry}`
  const loadState = request.key === requestKey ? request.state : 'loading'
  const error = request.key === requestKey ? request.error : undefined

  useEffect(() => {
    const controller = new AbortController()
    service.getDashboard(appliedFilters, interval, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setSnapshot(result)
      setRequest({ key: requestKey, state: 'success' })
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      setRequest({ key: requestKey, state: isConfigurationError(reason) ? 'unavailable' : 'error', error: reason instanceof Error ? reason.message : 'Sales and product analytics could not be loaded.' })
    })
    return () => controller.abort()
  }, [service, appliedFilters, interval, retry, requestKey])

  const ready = loadState === 'success' ? snapshot : null
  const hasNoResults = ready !== null && ready.metrics.salesValue.value === null && ready.metrics.uniqueInvoices.value === null &&
    ready.metrics.unitsSold.value === null && ready.metrics.identifiedCustomers.value === null && ready.trend.length === 0 && ready.products.length === 0 && (ready.countries?.length ?? 0) === 0

  function applyFilters(nextFilters: DashboardFilters) {
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setSelectedProduct(null)
  }

  function selectCountry(country: string) {
    applyFilters({ ...appliedFilters, country })
  }

  return (
    <div className="sales-products-page">
      <header className="sales-products-heading">
        <div><p className="eyebrow">Sales intelligence</p><h1>Sales &amp; Products</h1><p className="page-description">Analisis tren penjualan dan performa produk berdasarkan periode dan negara.</p></div>
        {ready && <StatusBadge tone={ready.source === 'demo' ? 'demo' : 'success'}>{ready.source === 'demo' ? 'Demo Data' : 'Backend Data'}</StatusBadge>}
      </header>

      <section className="filter-section sales-filter-section" aria-labelledby="sales-filters-title">
        <div className="filter-section-heading"><div><h2 id="sales-filters-title">Analysis filters</h2><p>One applied filter set drives every section below.</p></div><span className="historical-note"><Clock3 size={14} aria-hidden="true" /> Historical transactions, not live sales</span></div>
        <FilterBar value={draftFilters} countries={snapshot?.countryOptions ?? []} onChange={setDraftFilters} onApply={applyFilters} />
        <div className="interval-toolbar"><span className="interval-label">Time granularity</span><div className="segmented-control" role="group" aria-label="Trend interval">{(['day', 'week', 'month'] as const).map((value) => <button type="button" key={value} aria-pressed={interval === value} onClick={() => setInterval(value)}>{value === 'day' ? 'Daily' : value === 'week' ? 'Weekly' : 'Monthly'}</button>)}</div></div>
      </section>

      {(loadState !== 'success' || ready?.source !== 'demo') && <div className={`sales-source-state sales-source-${loadState}`} role="status" aria-live="polite">
        <span className="sales-source-icon" aria-hidden="true">{loadState === 'loading' ? <Clock3 size={16} /> : <Database size={16} />}</span>
        <span>{loadState === 'loading' ? 'Loading sales and product analytics' : loadState === 'unavailable' ? 'Belum terhubung ke backend' : loadState === 'error' ? 'Analytics request failed. Details are shown below.' : ready?.source === 'demo' ? 'Illustrative demo data, not actual dataset results.' : 'Analytics response received from the connected source.'}</span>
      </div>}
      {loadState === 'unavailable' && <p className="sales-unavailable-detail">{error}. Configure the confirmed API path and base URL to connect this page.</p>}
      {loadState === 'success' && ready?.source === 'demo' && <div className="demo-notice" role="note"><span className="demo-notice-mark" aria-hidden="true">D</span><p><strong>Illustrative demo fixture.</strong> These figures exercise the page controls and are not actual dataset results. Demo filters do not recalculate the fixture.</p></div>}
      <p className="metric-integrity-note"><Info size={14} aria-hidden="true" /> Transaction Value is not profit.</p>
      {loadState === 'loading' ? <div className="sales-loading" role="status" aria-label="Sales and Products loading"><div className="skeleton skeleton-kpi" /><div className="skeleton skeleton-chart" /><div className="skeleton skeleton-panel" /></div> : <div className="sales-analytics-content">
      {hasNoResults && <p className="sales-no-results" role="status">No analytics results are available for these filters. Values and charts remain empty until the source reports results.</p>}

      <section className="sales-kpi-grid" aria-label="Sales performance metrics">
        <KpiCard label="Transaction Value" value={ready?.metrics.salesValue.value ?? null} definition={ready?.metrics.salesValue.definition ?? 'Total transaction value reported by the selected source. Transaction value is not profit.'} icon={<BarChart3 size={19} aria-hidden="true" />} currencyCode={ready?.currencyCode} />
        <KpiCard label="Unique Invoices" value={ready?.metrics.uniqueInvoices.value ?? null} definition={ready?.metrics.uniqueInvoices.definition ?? 'Invoice count reported under the selected source rules.'} icon={<Receipt size={19} aria-hidden="true" />} />
        <KpiCard label="Units Sold" value={ready?.metrics.unitsSold.value ?? null} definition={ready?.metrics.unitsSold.definition ?? 'Unit total reported by the selected source.'} icon={<Package size={19} aria-hidden="true" />} />
        <KpiCard label="Identified Customers" value={ready?.metrics.identifiedCustomers.value ?? null} definition={ready?.metrics.identifiedCustomers.definition ?? 'Customers with identifiers reported by the selected source.'} icon={<UsersRound size={19} aria-hidden="true" />} />
      </section>

      <div className="applied-sales-filters"><span className="active-filter-dot" aria-hidden="true" /><span>Applied: {formatRange(appliedFilters)}</span><span className="applied-interval">{interval === 'day' ? 'Daily' : interval === 'week' ? 'Weekly' : 'Monthly'} view</span>{ready && !ready.currencyCode && <span className="currency-note">Currency unit not provided by this source.</span>}</div>

      <SalesTrendChart data={ready?.trend ?? []} interval={interval} onIntervalChange={setInterval} currencyCode={ready?.currencyCode} showIntervalControls={false} />
      <InvoiceUnitsTrend data={ready?.trend ?? []} metric={trendMetric} onMetricChange={setTrendMetric} interval={interval} />

      <ProductRanking products={ready?.products ?? []} metric={productMetric} count={rankCount} currencyCode={ready?.currencyCode} selectedId={selectedProduct ?? undefined} onMetricChange={setProductMetric} onCountChange={setRankCount} onSelect={setSelectedProduct} />
      <ProductTable products={ready?.products ?? []} currencyCode={ready?.currencyCode} selectedId={selectedProduct} onClearSelection={() => setSelectedProduct(null)} />

      <CountryRanking countries={ready?.countries} currencyCode={ready?.currencyCode} selectedCountry={appliedFilters.country} onSelect={selectCountry} />
      {loadState === 'error' && <StateMessage kind="error" title="Sales analytics could not be loaded" detail={error ?? 'Check the API connection and retry.'} action={{ label: 'Retry', onClick: () => setRetry((count) => count + 1) }} />}
      </div>}
    </div>
  )
}
