import { AlertCircle, Database, FileText } from 'lucide-react'
import { reportTypeOptions } from './reportOptions'
import type { ReportFormat, ReportType } from '../../services/reportsService'
import type { DashboardSnapshot } from '../../types/analytics'
import type { CustomerAnalyticsSnapshot } from '../../types/customerAnalytics'
import type { MLStudioExperiment, MLStudioWorkspace } from '../../types/mlStudio'
import type { ModelEvaluationSnapshot } from '../../types/modelEvaluation'

type ReportResource<T> = { status: 'idle' | 'loading' | 'success' | 'empty' | 'unavailable' | 'error'; data?: T; message?: string }
type RankingMetric = 'salesValue' | 'unitsSold' | 'uniqueInvoices'

function number(value?: number | null, digits = 2): string {
  return value == null ? 'Data belum tersedia' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(value)
}

function money(value?: number | null, currency?: string | null): string {
  if (value == null) return 'Data belum tersedia'
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return `${number(value)} (unit mata uang belum dilaporkan)`
  try { return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value) }
  catch { return `${number(value)} ${currency}` }
}

function valueWithUnit(value: number | null | undefined, unit?: string | null): string {
  if (value == null) return 'Data belum tersedia'
  return unit ? `${number(value)} ${unit}` : number(value)
}

function displayStatus(status: ReportResource<unknown>['status']): string {
  return status === 'loading' ? 'Loading source data' : status === 'success' ? 'Preview available' : status === 'empty' ? 'Data unavailable' : status === 'unavailable' ? 'Backend unavailable' : status === 'error' ? 'Source error' : 'Choose a report'
}

function SourceState({ state, reportType }: { state: ReportResource<unknown>; reportType: ReportType }) {
  const reportName = reportTypeOptions.find((item) => item.id === reportType)?.title ?? 'Report'
  if (state.status === 'loading') return <div className="reports-preview-state" role="status"><span className="reports-preview-spinner"/><div><strong>Loading {reportName} preview</strong><p>Waiting for its configured data source.</p></div></div>
  if (state.status === 'unavailable' || state.status === 'error' || state.status === 'empty') return <div className={`reports-preview-state reports-preview-${state.status}`} role={state.status === 'error' ? 'alert' : 'status'}><AlertCircle size={18} aria-hidden="true"/><div><strong>{state.status === 'empty' ? 'Data unavailable' : state.status === 'unavailable' ? 'Backend unavailable' : 'Source error'}</strong><p>{state.message || (state.status === 'empty' ? 'The source did not return report data for this selection.' : 'No report preview is available from the connected source.')}</p></div></div>
  return null
}

function FilterSummary({ reportType, filters, format, rankingMetric }: { reportType: ReportType; filters: Record<string, string>; format: ReportFormat; rankingMetric: RankingMetric }) {
  const isSales = reportType === 'sales-summary' || reportType === 'product-performance'
  const items = [
    { label: 'Output', value: format === 'csv' ? 'CSV' : 'Excel workbook (.xlsx)' },
    ...(isSales ? [
      { label: 'Requested date range', value: filters.startDate || filters.endDate ? `${filters.startDate || 'Start not set'} – ${filters.endDate || 'End not set'}` : 'No date range selected' },
      { label: 'Requested country', value: filters.country || 'All available countries' },
    ] : []),
    ...(reportType === 'product-performance' ? [{ label: 'Ranking', value: rankingMetric === 'salesValue' ? 'Transaction value' : rankingMetric === 'unitsSold' ? 'Units sold' : 'Unique invoices' }] : []),
    ...(filters.experimentId ? [{ label: 'Experiment', value: filters.experimentId }] : []),
  ]
  return <dl className="reports-config-summary">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
}

function SalesSummary({ snapshot }: { snapshot: DashboardSnapshot }) {
  const metrics = [
    { label: 'Transaction value', value: money(snapshot.metrics.salesValue.value, snapshot.currencyCode) },
    { label: 'Unique invoices', value: number(snapshot.metrics.uniqueInvoices.value, 0) },
    { label: 'Units sold', value: number(snapshot.metrics.unitsSold.value, 0) },
    { label: 'Identified customers', value: number(snapshot.metrics.identifiedCustomers.value, 0) },
  ]
  return <>
    <div className="reports-metric-preview">{metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}</div>
    <div className="reports-table-heading"><div><h3>Sales trend preview</h3><p>Transaction value is not profit.</p></div><span>{snapshot.trend.length} trend points returned</span></div>
    {snapshot.trend.length ? <div className="reports-table-wrap" role="region" aria-label="Sales trend preview; scroll horizontally if needed" tabIndex={0}><table aria-label="Sales trend preview"><thead><tr><th>Period</th><th>Transaction value</th><th>Unique invoices</th><th>Units sold</th></tr></thead><tbody>{snapshot.trend.slice(0, 8).map((point) => <tr key={point.period}><th scope="row">{point.label}</th><td>{money(point.salesValue, snapshot.currencyCode)}</td><td>{number(point.uniqueInvoices, 0)}</td><td>{number(point.unitsSold, 0)}</td></tr>)}</tbody></table></div> : <p className="reports-inline-empty">No trend rows were supplied by the analytics source.</p>}
  </>
}

function ProductSummary({ snapshot, rankingMetric }: { snapshot: DashboardSnapshot; rankingMetric: RankingMetric }) {
  const valueFor = (product: DashboardSnapshot['products'][number]) => product[rankingMetric]
  const products = [...snapshot.products].sort((a, b) => (valueFor(b) ?? -Infinity) - (valueFor(a) ?? -Infinity))
  return <>
    <div className="reports-preview-context"><strong>Ranking metric</strong><span>{rankingMetric === 'salesValue' ? 'Transaction value' : rankingMetric === 'unitsSold' ? 'Units sold' : 'Unique invoices'}</span><small>Product values are source-reported; transaction value is not profit.</small></div>
    <div className="reports-table-heading"><div><h3>Product preview</h3><p>Source-provided product entries in the selected ranking order.</p></div><span>{products.length} product entries returned</span></div>
    {products.length ? <div className="reports-table-wrap" role="region" aria-label="Product preview; scroll horizontally if needed" tabIndex={0}><table aria-label="Product preview"><thead><tr><th>Rank</th><th>StockCode</th><th>Description</th><th>Units sold</th><th>Transaction value</th><th>Unique invoices</th></tr></thead><tbody>{products.slice(0, 8).map((product, index) => <tr key={product.productId}><td>{index + 1}</td><th scope="row">{product.productId}</th><td>{product.description}</td><td>{number(product.unitsSold, 0)}</td><td>{money(product.salesValue, snapshot.currencyCode)}</td><td>{number(product.uniqueInvoices, 0)}</td></tr>)}</tbody></table></div> : <p className="reports-inline-empty">No product rows were supplied by the analytics source.</p>}
  </>
}

function CustomerSummary({ snapshot }: { snapshot: CustomerAnalyticsSnapshot }) {
  const { summary } = snapshot
  return <>
    <dl className="reports-metadata-preview">
      <div><dt>Eligible customers</dt><dd>{number(summary.eligibleCustomers, 0)}</dd></div><div><dt>Customers with RFM profiles</dt><dd>{number(summary.customersWithRfmProfiles, 0)}</dd></div>
      <div><dt>Observation date</dt><dd>{summary.observationDate || 'Not reported'}</dd></div><div><dt>Analysis period</dt><dd>{summary.analysisPeriod ? `${summary.analysisPeriod.start} – ${summary.analysisPeriod.end}` : 'Not reported'}</dd></div>
    </dl>
    <div className="reports-table-heading"><div><h3>Customer RFM preview</h3><p>Monetary represents transaction value, not profit.</p></div><span>{snapshot.customers.length} customer rows returned</span></div>
    {snapshot.customers.length ? <div className="reports-table-wrap" role="region" aria-label="Customer RFM preview; scroll horizontally if needed" tabIndex={0}><table aria-label="Customer RFM preview"><thead><tr><th>Customer ID</th><th>Recency (days)</th><th>Frequency (invoices)</th><th>Monetary (transaction value)</th><th>Profile</th><th>Cluster profile</th></tr></thead><tbody>{snapshot.customers.slice(0, 8).map((customer) => <tr key={customer.customerId}><th scope="row">{customer.customerId}</th><td>{number(customer.recency, 0)}</td><td>{number(customer.frequency, 0)}</td><td>{money(customer.monetary, snapshot.currencyCode)}</td><td>{customer.profile || 'Not reported'}</td><td>{customer.clusterLabel || 'Not reported'}</td></tr>)}</tbody></table></div> : <p className="reports-inline-empty">The source returned no customer records for this preview.</p>}
  </>
}

function ExperimentSummary({ experiment, snapshot, evaluationType }: { experiment: MLStudioExperiment; snapshot: ModelEvaluationSnapshot; evaluationType: boolean }) {
  const { experiment: metadata, metrics, clusters } = snapshot
  return <>
    <dl className="reports-metadata-preview reports-experiment-metadata">
      <div><dt>Experiment ID</dt><dd>{experiment.id}</dd></div><div><dt>Run timestamp</dt><dd>{experiment.timestamp}</dd></div><div><dt>K</dt><dd>{number(experiment.k, 0)}</dd></div><div><dt>Random seed</dt><dd>{number(experiment.randomSeed, 0)}</dd></div>
      <div><dt>Preprocessing version</dt><dd>{experiment.preprocessingVersion || 'Not reported'}</dd></div><div><dt>Customers evaluated</dt><dd>{number(metadata.customersEvaluated, 0)}</dd></div>
      {evaluationType && <><div><dt>Inertia</dt><dd>{number(metrics.inertia)}</dd></div><div><dt>Silhouette</dt><dd>{metrics.silhouette?.status === 'valid' ? number(metrics.silhouette.value) : metrics.silhouette?.reason || 'Valid score unavailable'}</dd></div></>}
    </dl>
    <div className="reports-table-heading"><div><h3>Cluster profile preview</h3><p>Cluster IDs belong to this experiment only. Monetary is transaction value, not profit.</p></div><span>{clusters.length} clusters returned</span></div>
    {clusters.length ? <div className="reports-table-wrap" role="region" aria-label="Cluster profile preview; scroll horizontally if needed" tabIndex={0}><table aria-label="Cluster profile preview"><thead><tr><th>Cluster</th><th>Customers</th><th>Population</th><th>Statistic</th><th>Recency</th><th>Frequency</th><th>Monetary</th></tr></thead><tbody>{clusters.map((cluster) => <tr key={String(cluster.clusterId)}><th scope="row">{String(cluster.clusterId)}</th><td>{number(cluster.customerCount, 0)}</td><td>{cluster.percentage == null ? 'Not reported' : `${number(cluster.percentage, 1)}%`}</td><td>{cluster.profile?.statistic || 'Not reported'}</td><td>{number(cluster.profile?.recency, 1)}</td><td>{number(cluster.profile?.frequency, 1)}</td><td>{valueWithUnit(cluster.profile?.monetary, snapshot.monetaryUnit)}</td></tr>)}</tbody></table></div> : <p className="reports-inline-empty">No cluster rows were supplied for this experiment.</p>}
  </>
}

export function ReportPreview({ reportType, format, filters, rankingMetric, analytics, customers, workspace, evaluation, experiment }: {
  reportType: ReportType
  format: ReportFormat
  filters: Record<string, string>
  rankingMetric: RankingMetric
  analytics: ReportResource<DashboardSnapshot>
  customers: ReportResource<CustomerAnalyticsSnapshot>
  workspace: ReportResource<MLStudioWorkspace>
  evaluation: ReportResource<ModelEvaluationSnapshot>
  experiment?: MLStudioExperiment
}) {
  const reportName = reportTypeOptions.find((item) => item.id === reportType)?.title ?? 'Report'
  const resource = reportType === 'sales-summary' || reportType === 'product-performance' ? analytics : reportType === 'customer-rfm' ? customers : experiment ? evaluation : workspace
  const source = reportType === 'sales-summary' || reportType === 'product-performance' ? analytics.data?.source === 'demo' ? 'Demo Data' : analytics.data ? 'Analytics API' : 'Analytics source' : reportType === 'customer-rfm' ? customers.data ? 'Customer Analytics API' : 'Customer Analytics source' : 'ML Studio and Model Evaluation'
  const payloadReady = reportType === 'sales-summary' || reportType === 'product-performance' ? Boolean(analytics.data) : reportType === 'customer-rfm' ? Boolean(customers.data) : Boolean(experiment && evaluation.data)

  return <section className="panel reports-preview-panel" aria-label="Report Preview">
    <header className="reports-preview-header"><div><span className="eyebrow">PREVIEW</span><h2>Report Preview</h2><p>Review the supplied data and selected output before requesting an export.</p></div><span className={`reports-preview-status reports-preview-status-${resource.status}`}><span className="reports-status-dot"/>{displayStatus(resource.status)}</span></header>
    <div className="reports-preview-report-heading"><span className="reports-preview-report-icon"><FileText size={17} aria-hidden="true"/></span><div><h3>{reportName}</h3><span>Source: {source}</span></div></div>
    <FilterSummary reportType={reportType} filters={filters} format={format} rankingMetric={rankingMetric}/>
    {resource.status !== 'success' && resource.status !== 'empty' && <SourceState state={resource} reportType={reportType}/>}
    {resource.status === 'empty' && <SourceState state={resource} reportType={reportType}/>}
    {resource.status === 'success' && payloadReady && <>
      {source === 'Demo Data' && <div className="reports-demo-notice" role="note"><Database size={15} aria-hidden="true"/><span>Demo Data · illustrative fixture from the existing analytics service. These values do not represent a processed dataset and do not change with selected filters.</span></div>}
      {reportType === 'sales-summary' && analytics.data && <SalesSummary snapshot={analytics.data}/>}
      {reportType === 'product-performance' && analytics.data && <ProductSummary snapshot={analytics.data} rankingMetric={rankingMetric}/>}
      {reportType === 'customer-rfm' && customers.data && <CustomerSummary snapshot={customers.data}/>}
      {(reportType === 'kmeans-segmentation' || reportType === 'model-evaluation') && experiment && evaluation.data && <ExperimentSummary experiment={experiment} snapshot={evaluation.data} evaluationType={reportType === 'model-evaluation'}/>}
    </>}
    {resource.status === 'success' && !payloadReady && <div className="reports-preview-state" role="status"><AlertCircle size={17}/><div><strong>Choose a successful experiment</strong><p>Evaluation preview requires an experiment supplied by ML Studio.</p></div></div>}
    <div className="reports-preview-footer"><span>{payloadReady ? source === 'Demo Data' ? 'Demo preview only · export unavailable' : 'Preview uses returned records/metadata · export depends on backend' : 'Row count and report contents are not available yet.'}</span><strong>{format.toUpperCase()}</strong></div>
  </section>
}
