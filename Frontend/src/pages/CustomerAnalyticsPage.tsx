import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, Database, Layers3, UsersRound, UserRoundCheck, ArrowUpRight } from 'lucide-react'
import { CustomerAnalyticsCharts } from '../components/customer-analytics/CustomerAnalyticsCharts'
import { CustomerDirectory } from '../components/customer-analytics/CustomerDirectory'
import { customerAnalyticsService } from '../services/customerAnalyticsService'
import type { CustomerAnalyticsService, CustomerAnalyticsSnapshot } from '../types/customerAnalytics'

type LoadState = 'loading' | 'success' | 'unavailable' | 'error'
interface RequestState { service: CustomerAnalyticsService; retry: number; state: LoadState; message?: string }

function isConfigurationError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : ''
  return message.includes('VITE_API_BASE_URL') || message.includes('VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH') || message.includes('VITE_DATA_MODE')
}

function MetricCard({ label, value, definition, icon: Icon, accent }: { label: string; value: string; definition: string; icon: typeof UsersRound; accent: string }) {
  return <article className={`customer-kpi ${accent}`} aria-label={`${label}: ${value}`}><div className="customer-kpi-heading"><span className="customer-kpi-icon"><Icon size={18} aria-hidden="true" /></span><span>{label}</span><button className="customer-kpi-info" type="button" aria-label={`${label} definition`} title={definition}>i</button></div><strong>{value}</strong><p>{definition}</p></article>
}

function suppliedNumber(value: number | null | undefined): string {
  return value == null ? 'Data belum tersedia' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)
}

function segmentationLabel(status: CustomerAnalyticsSnapshot['summary']['segmentationStatus'] | undefined): string {
  if (!status) return 'Data belum tersedia'
  if (status === 'available') return 'Tersedia'
  if (status === 'pending') return 'Menunggu'
  return 'Belum tersedia'
}

export function CustomerAnalyticsPage({ service = customerAnalyticsService }: { service?: CustomerAnalyticsService }) {
  const [snapshot, setSnapshot] = useState<CustomerAnalyticsSnapshot | null>(null)
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState<RequestState | null>(null)
  const matchesRequest = request?.service === service && request.retry === retry
  const loadState = matchesRequest ? request.state : 'loading'
  const message = matchesRequest ? request.message : undefined

  useEffect(() => {
    const controller = new AbortController()
    service.getSnapshot(controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setSnapshot(result)
      setRequest({ service, retry, state: result ? 'success' : 'unavailable' })
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      setRequest({ service, retry, state: isConfigurationError(reason) ? 'unavailable' : 'error', message: reason instanceof Error ? reason.message : 'Customer analytics could not be loaded.' })
    })
    return () => controller.abort()
  }, [service, retry])

  const ready = loadState === 'success' ? snapshot : null
  const observationDate = ready?.summary.observationDate ?? 'Data belum tersedia'
  const segmentation = segmentationLabel(ready?.summary.segmentationStatus)

  return (
    <div className="customer-analytics-page">
      <header className="customer-page-heading"><div><p className="eyebrow">Customer intelligence</p><h1>Customer Analytics</h1><p className="page-description">Eksplorasi perilaku pembelian pelanggan melalui Recency, Frequency, dan Monetary.</p>{ready?.summary.analysisPeriod && <p className="customer-period"><CalendarDays size={14} aria-hidden="true" /><span>Periode analisis: <strong>{ready.summary.analysisPeriod.start} — {ready.summary.analysisPeriod.end}</strong></span></p>}</div>{ready?.source === 'api' && <span className="status-badge status-success">Backend Data</span>}</header>

      <div className={`customer-source-state customer-source-${loadState}`} role={loadState === 'error' ? 'alert' : 'status'} aria-live="polite"><span aria-hidden="true">{loadState === 'loading' ? <Clock3 size={16} /> : <Database size={16} />}</span><div><strong>{loadState === 'loading' ? 'Memuat customer analytics' : loadState === 'unavailable' ? 'Belum terhubung ke backend' : loadState === 'error' ? 'Customer analytics gagal dimuat' : 'Data customer analytics diterima dari backend'}</strong><p>{loadState === 'loading' ? 'Menunggu respons sumber data.' : loadState === 'unavailable' ? message ?? 'Mode demo tidak menyediakan data RFM. Halaman ini tidak menggunakan fixture pelanggan.' : loadState === 'error' ? message : 'Nilai pada halaman ini berasal dari respons service yang terhubung.'}</p>{loadState === 'error' && <button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button>}</div></div>

      <section className="customer-kpi-grid" aria-label="Customer and segmentation summary">
        <MetricCard label="Eligible Customers" value={suppliedNumber(ready?.summary.eligibleCustomers)} definition="Jumlah pelanggan yang memenuhi kriteria dan dilaporkan oleh sumber data." icon={UsersRound} accent="summary-neutral" />
        <MetricCard label="Customers with RFM Profiles" value={suppliedNumber(ready?.summary.customersWithRfmProfiles)} definition="Jumlah pelanggan dengan profil Recency, Frequency, dan Monetary yang dilaporkan sumber." icon={UserRoundCheck} accent="rfm-frequency" />
        <MetricCard label="RFM Observation Date" value={observationDate} definition="Tanggal acuan yang digunakan sumber untuk interpretasi Recency." icon={CalendarDays} accent="rfm-recency" />
        <MetricCard label="Segmentation Status" value={segmentation} definition="Status hasil segmentasi yang dilaporkan. Profil RFM tidak otomatis berarti K-Means telah dijalankan." icon={Layers3} accent="summary-cluster" />
      </section>

      {loadState === 'loading' && <div className="customer-loading" role="status" aria-label="Customer analytics loading"><span /><span /><span /><span /></div>}
      {loadState === 'success' && ready && ready.customers.length === 0 && <p className="customer-no-results" role="status">Respons backend berhasil diterima, tetapi belum menyediakan baris pelanggan. Ini berbeda dari jumlah nol yang tidak dilaporkan.</p>}

      <CustomerAnalyticsCharts snapshot={ready} />

      <section className={`cluster-notice ${ready?.summary.segmentationStatus === 'available' ? 'cluster-notice-available' : ''}`} aria-labelledby="cluster-note-title"><span className="cluster-notice-icon" aria-hidden="true"><Layers3 size={18} /></span><div><h2 id="cluster-note-title">Profil RFM dan cluster adalah hal berbeda</h2><p>Nilai Recency, Frequency, dan Monetary menggambarkan riwayat transaksi. Label cluster hanya ditampilkan jika respons sumber memang menyediakannya; halaman ini tidak menjalankan K-Means.</p>{ready?.summary.segmentationMessage && <p>{ready.summary.segmentationMessage}</p>}</div><Link className="button button-secondary cluster-link" to="/ml-studio">Go to ML Studio <ArrowUpRight size={14} aria-hidden="true" /></Link></section>

      <CustomerDirectory customers={ready?.customers ?? []} currencyCode={ready?.currencyCode} observationDate={ready?.summary.observationDate} analysisPeriod={ready?.summary.analysisPeriod} />
      {ready && <div className="customer-observation-note"><CalendarDays size={14} aria-hidden="true" /><span>{ready.summary.observationDate ? `Tanggal observasi RFM: ${ready.summary.observationDate}` : 'Tanggal observasi RFM belum dilaporkan.'}</span>{ready.summary.analysisPeriod && <span>Periode: {ready.summary.analysisPeriod.start} — {ready.summary.analysisPeriod.end}</span>}</div>}
      {loadState === 'unavailable' && <p className="customer-integration-note">Atur `VITE_API_BASE_URL` dan resource path setelah kontrak endpoint disepakati. Tidak ada nilai demo yang ditampilkan di halaman ini.</p>}
    </div>
  )
}
