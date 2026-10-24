import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Download } from 'lucide-react'
import { ReportTypeSelector } from '../components/reports/ReportTypeSelector'
import { reportTypeOptions } from '../components/reports/reportOptions'
import { ReportPreview } from '../components/reports/ReportPreview'
import { reportSources, type ReportSources } from '../services/reportSources'
import { reportsExportService, type ReportFormat, type ReportType, type ReportsExportService } from '../services/reportsService'
import type { DashboardSnapshot } from '../types/analytics'
import type { CustomerAnalyticsSnapshot } from '../types/customerAnalytics'
import type { MLStudioWorkspace } from '../types/mlStudio'
import type { ModelEvaluationSnapshot } from '../types/modelEvaluation'

type Status = 'idle' | 'loading' | 'success' | 'empty' | 'unavailable' | 'error'
type Resource<T> = { key: string; status: Status; data?: T; message?: string }
const noSource = <T,>(): Resource<T> => ({ key: '', status: 'idle' })

function isUnavailable(error: unknown): boolean {
  return error instanceof Error && /not configured|VITE_|backend.*not connected|resource path|belum terhubung/i.test(error.message)
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Sumber laporan gagal dimuat.'
}

function dateRangeError(startDate: string, endDate: string): string {
  if (Boolean(startDate) !== Boolean(endDate)) return 'Enter both dates or leave both dates empty.'
  if (startDate && endDate && endDate < startDate) return 'End date must be on or after start date.'
  return ''
}

function statusText(status: Status): string {
  return status === 'loading' ? 'Memuat sumber data' : status === 'success' ? 'Preview available' : status === 'empty' ? 'Data unavailable' : status === 'unavailable' ? 'Backend unavailable' : status === 'error' ? 'Source error' : 'Ready to configure'
}

export function ReportsPage({ sources = reportSources, exportService = reportsExportService }: { sources?: ReportSources; exportService?: ReportsExportService }) {
  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [format, setFormat] = useState<ReportFormat>('csv')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [country, setCountry] = useState('')
  const [rankingMetric, setRankingMetric] = useState<'salesValue' | 'unitsSold' | 'uniqueInvoices'>('salesValue')
  const [experimentId, setExperimentId] = useState('')
  const [exportState, setExportState] = useState<'idle' | 'preparing' | 'succeeded' | 'failed'>('idle')
  const [exportMessage, setExportMessage] = useState('')
  const [analytics, setAnalytics] = useState<Resource<DashboardSnapshot>>(noSource())
  const [customers, setCustomers] = useState<Resource<CustomerAnalyticsSnapshot>>(noSource())
  const [workspace, setWorkspace] = useState<Resource<MLStudioWorkspace>>(noSource())
  const [evaluation, setEvaluation] = useState<Resource<ModelEvaluationSnapshot>>(noSource())

  const rangeError = dateRangeError(startDate, endDate)
  const isSalesReport = reportType === 'sales-summary' || reportType === 'product-performance'
  const isMlReport = reportType === 'kmeans-segmentation' || reportType === 'model-evaluation'
  const analyticsKey = `${reportType ?? ''}|${startDate}|${endDate}|${country}`
  const analyticsView: Resource<DashboardSnapshot> = rangeError && isSalesReport ? { key: analyticsKey, status: 'idle', message: rangeError } : isSalesReport && analytics.key === analyticsKey ? analytics : isSalesReport ? { key: analyticsKey, status: 'loading' } : noSource()
  const customerView = reportType === 'customer-rfm' && customers.key === reportType ? customers : reportType === 'customer-rfm' ? { key: reportType, status: 'loading' as const } : noSource<CustomerAnalyticsSnapshot>()
  const workspaceView = isMlReport && workspace.key === 'ml' ? workspace : isMlReport ? { key: 'ml', status: 'loading' as const } : noSource<MLStudioWorkspace>()
  const evaluationView = isMlReport && experimentId && evaluation.key === experimentId ? evaluation : isMlReport && experimentId ? { key: experimentId, status: 'loading' as const } : noSource<ModelEvaluationSnapshot>()

  useEffect(() => {
    if (!isSalesReport || !reportType) return
    if (rangeError) return
    const controller = new AbortController()
    sources.analytics.getDashboard({ startDate, endDate, country }, 'month', controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setAnalytics({ key: analyticsKey, status: 'success', data })
      setRankingMetric((current) => current === 'uniqueInvoices' && !data.products.some((product) => product.uniqueInvoices != null) ? 'salesValue' : current)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setAnalytics({ key: analyticsKey, status: isUnavailable(error) ? 'unavailable' : 'error', message: messageFrom(error) })
    })
    return () => controller.abort()
  }, [sources, isSalesReport, reportType, analyticsKey, startDate, endDate, country, rangeError])

  useEffect(() => {
    if (reportType !== 'customer-rfm') return
    const controller = new AbortController()
    sources.customers.getSnapshot(controller.signal).then((data) => {
      if (controller.signal.aborted) return
      if (!data) setCustomers({ key: reportType, status: 'unavailable', message: 'Customer RFM preview menunggu data backend yang memenuhi syarat.' })
      else setCustomers({ key: reportType, status: 'success', data })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setCustomers({ key: reportType, status: isUnavailable(error) ? 'unavailable' : 'error', message: messageFrom(error) })
    })
    return () => controller.abort()
  }, [sources, reportType])

  useEffect(() => {
    if (!isMlReport) return
    const controller = new AbortController()
    sources.mlStudio.getWorkspace(controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setWorkspace({ key: 'ml', status: data.history.some((item) => item.status === 'succeeded') ? 'success' : 'empty', data })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setWorkspace({ key: 'ml', status: isUnavailable(error) ? 'unavailable' : 'error', message: messageFrom(error) })
    })
    return () => controller.abort()
  }, [sources, isMlReport])

  useEffect(() => {
    if (!isMlReport || !experimentId) return
    const controller = new AbortController()
    sources.evaluation.getEvaluation(experimentId, controller.signal).then((data) => {
      if (controller.signal.aborted) return
      if (data.experiment.id !== experimentId) throw new Error('Evaluation response does not match the selected experiment.')
      setEvaluation({ key: experimentId, status: 'success', data })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setEvaluation({ key: experimentId, status: isUnavailable(error) ? 'unavailable' : 'error', message: messageFrom(error) })
    })
    return () => controller.abort()
  }, [sources, isMlReport, experimentId])

  const successfulExperiments = useMemo(() => workspaceView.data?.history.filter((item) => item.status === 'succeeded') ?? [], [workspaceView.data])
  const activeState = isSalesReport ? analyticsView : reportType === 'customer-rfm' ? customerView : isMlReport ? !workspaceView.data ? workspaceView : experimentId ? evaluationView : workspaceView : noSource<never>()
  const selectedOption = reportType ? reportTypeOptions.find((option) => option.id === reportType) : null
  const reportFilters: Record<string, string> = {}
  if (isSalesReport) {
    if (startDate) reportFilters.startDate = startDate
    if (endDate) reportFilters.endDate = endDate
    if (country) reportFilters.country = country
  }
  if (reportType === 'product-performance') reportFilters.rankingMetric = rankingMetric
  if (isMlReport && experimentId) reportFilters.experimentId = experimentId
  const experimentError = isMlReport && !experimentId && workspaceView.status === 'success' ? 'Select a successful experiment before exporting.' : ''
  const configurationError = rangeError || experimentError

  function selectReport(next: ReportType) {
    const keepSalesFilters = isSalesReport && (next === 'sales-summary' || next === 'product-performance')
    const keepExperiment = isMlReport && (next === 'kmeans-segmentation' || next === 'model-evaluation')
    setReportType(next)
    if (!keepSalesFilters) { setStartDate(''); setEndDate(''); setCountry(''); setRankingMetric('salesValue') }
    if (!keepExperiment) setExperimentId('')
    setExportState('idle'); setExportMessage('')
  }

  function resetConfiguration() {
    setStartDate(''); setEndDate(''); setCountry(''); setRankingMetric('salesValue'); setFormat('csv'); setExperimentId(''); setExportState('idle'); setExportMessage('')
  }

  async function exportReport() {
    if (!reportType || configurationError || exportState === 'preparing') return
    setExportState('preparing'); setExportMessage('')
    try {
      const result = await exportService.exportReport({ reportType, format, filters: reportFilters, ...(isMlReport && experimentId ? { experimentId } : {}) })
      if (!(result.blob instanceof Blob) || !result.filename.trim()) throw new Error('Export service did not return a valid file.')
      const objectUrl = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl; anchor.download = result.filename; anchor.hidden = true
      document.body.append(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
      setExportState('succeeded'); setExportMessage(`Download started: ${result.filename}`)
    } catch (error) {
      setExportState('failed'); setExportMessage(messageFrom(error))
    }
  }

  const analyticsStatus = analyticsView.status
  const status = reportType ? activeState.status : 'idle'
  const sourceLabel = reportType === 'sales-summary' || reportType === 'product-performance'
    ? analyticsView.data?.source === 'demo' ? 'Demo Data' : analyticsView.data?.source === 'api' ? 'Analytics API' : 'Analytics source'
    : reportType === 'customer-rfm' ? 'Customer Analytics API' : isMlReport ? 'ML Studio and Model Evaluation' : 'Not selected'
  const activeFilterCount = (isSalesReport ? Number(Boolean(startDate || endDate)) + Number(Boolean(country)) + Number(Boolean(reportType === 'product-performance' && rankingMetric !== 'salesValue')) : 0) + Number(Boolean(isMlReport && experimentId))

  return <div className="page-content reports-page">
    <header className="page-heading reports-heading"><div><span className="eyebrow">DOCUMENTATION WORKSPACE</span><h1>Reports</h1><p>Siapkan dan ekspor hasil analitik untuk dokumentasi dan pemeriksaan lanjutan.</p></div><div className="reports-header-status"><span className="reports-status-dot"/><span>Ekspor memerlukan data dan layanan backend yang tersedia.</span></div></header>

    <ReportTypeSelector reportType={reportType} onSelect={selectReport} options={reportTypeOptions} selectedStatus={statusText(status)} selectedSource={sourceLabel}/>

    {reportType && <div className="reports-builder-grid">
      <section className="panel reports-configuration" aria-label="Report configuration">
        <div className="reports-section-heading"><div><span className="eyebrow">CONFIGURE</span><h2>{selectedOption?.title}</h2><p>{selectedOption?.description}</p></div>{activeFilterCount > 0 && <span className="reports-filter-count">{activeFilterCount} active</span>}</div>
        <div className="reports-form-grid">
          <fieldset className="reports-format-field"><legend>Output format</legend><label htmlFor="report-format">File format</label><select id="report-format" aria-label="Output format" value={format} onChange={(event) => { setFormat(event.target.value as ReportFormat); setExportState('idle'); setExportMessage('') }}><option value="csv">CSV · comma-separated values</option><option value="xlsx">Excel workbook (.xlsx)</option></select><p>{format === 'csv' ? 'CSV is a plain-text table format. Actual report downloads need backend support.' : 'Excel workbook format is selected; actual report downloads need backend support.'}</p></fieldset>
          {isSalesReport && <>
            <div className="reports-date-fields"><label htmlFor="report-start-date">Start date</label><input id="report-start-date" aria-label="Start date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); setExportState('idle') }}/><label htmlFor="report-end-date">End date</label><input id="report-end-date" aria-label="End date" type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setExportState('idle') }}/>{rangeError && <p className="reports-validation" role="alert">{rangeError}</p>}</div>
            <div className="reports-select-field"><label htmlFor="report-country">Country</label><select id="report-country" aria-label="Country" value={country} disabled={analyticsStatus !== 'success' || !analyticsView.data?.countryOptions.length} onChange={(event) => { setCountry(event.target.value); setExportState('idle') }}><option value="">All countries</option>{analyticsView.data?.countryOptions.map((item) => <option value={item} key={item}>{item}</option>)}</select><p>{analyticsView.data?.countryOptions.length ? 'Country list supplied by the analytics service.' : 'Country choices will appear when the source provides them.'}</p></div>
          </>}
          {reportType === 'product-performance' && <div className="reports-select-field"><label htmlFor="report-ranking">Ranking metric</label><select id="report-ranking" aria-label="Ranking metric" value={rankingMetric} onChange={(event) => setRankingMetric(event.target.value as typeof rankingMetric)}><option value="salesValue">Transaction value</option><option value="unitsSold">Units sold</option><option value="uniqueInvoices" disabled={!analyticsView.data?.products.some((product) => product.uniqueInvoices != null)}>Unique invoices (when supplied)</option></select><p>Orders the source-provided products by the selected reported metric.</p></div>}
          {isMlReport && <div className="reports-select-field reports-experiment-field"><label htmlFor="report-experiment">Experiment</label><select id="report-experiment" aria-label="Experiment" value={experimentId} disabled={workspaceView.status !== 'success' || successfulExperiments.length === 0} onChange={(event) => { setExperimentId(event.target.value); setExportState('idle') }}><option value="">{workspaceView.status === 'loading' ? 'Loading experiments…' : workspaceView.status === 'error' || workspaceView.status === 'unavailable' ? 'Experiments unavailable' : successfulExperiments.length ? 'Select a successful experiment' : 'No successful experiments available'}</option>{successfulExperiments.map((item) => <option key={item.id} value={item.id}>{item.id} · K={item.k} · {item.timestamp}</option>)}</select><p>Only successful experiments supplied by ML Studio are listed.</p></div>}
        </div>
        <div className="reports-configuration-footer"><span>{activeFilterCount ? `${activeFilterCount} report setting${activeFilterCount === 1 ? '' : 's'} configured.` : 'No additional filters selected.'}</span><button type="button" className="text-button" onClick={resetConfiguration}>Reset configuration</button></div>
        {experimentError && <p className="reports-validation" role="status">{experimentError}</p>}
      </section>

      <ReportPreview reportType={reportType} format={format} filters={reportFilters} rankingMetric={rankingMetric} analytics={analyticsView} customers={customerView} workspace={workspaceView} evaluation={evaluationView} experiment={successfulExperiments.find((item) => item.id === experimentId)}/>
    </div>}

    <section className={`reports-export-panel ${exportState === 'failed' ? 'reports-export-error' : exportState === 'succeeded' ? 'reports-export-success' : ''}`} aria-label="Export report">
      <div className="reports-export-copy"><span className="reports-export-icon"><Download size={17} aria-hidden="true"/></span><div><strong>{exportState === 'preparing' ? 'Checking export availability…' : exportState === 'succeeded' ? 'Export ready' : exportState === 'failed' ? 'Export unavailable' : 'Ready to review'}</strong><p>{exportMessage || (reportType ? `Review ${selectedOption?.title} in ${format.toUpperCase()} before exporting. The export service is not connected yet.` : 'Choose a report type and review its available source data before exporting.')}</p></div></div>
      <button type="button" className="button button-primary reports-export-button" onClick={exportReport} disabled={!reportType || Boolean(configurationError) || exportState === 'preparing'}><Download size={16} aria-hidden="true"/>{exportState === 'preparing' ? 'Checking…' : 'Export Report'}</button>
    </section>
    {exportState === 'failed' && <div className="reports-export-feedback" role="alert"><AlertCircle size={16} aria-hidden="true"/><span>{exportMessage} Pengaturan tetap tersimpan.</span></div>}
    {exportState === 'succeeded' && <div className="reports-export-feedback reports-export-feedback-success" role="status"><CheckCircle2 size={16} aria-hidden="true"/><span>{exportMessage}</span></div>}
    <footer className="reports-integrity-note">Pratinjau memakai data atau metadata yang dikembalikan service. Nilai demo diberi label; ekspor hanya dinyatakan berhasil setelah file nyata diterima.</footer>
  </div>
}
