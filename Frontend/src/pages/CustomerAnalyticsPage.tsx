import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Layers3, UsersRound, UserRoundCheck, ArrowUpRight } from 'lucide-react'
import { CustomerAnalyticsCharts } from '../components/customer-analytics/CustomerAnalyticsCharts'
import { getUserFacingError } from '../services/userFacingError'
import { CustomerDirectory } from '../components/customer-analytics/CustomerDirectory'
import { customerAnalyticsService } from '../services/customerAnalyticsService'
import type { CustomerAnalyticsService, CustomerAnalyticsSnapshot } from '../types/customerAnalytics'
import { formatNumber } from '../utils/format'
import { StateBlock } from '../components/StateBlock'
import { InfoTip } from '../components/InfoTip'

type LoadState = 'loading' | 'success' | 'unavailable' | 'error'
interface RequestState { service: CustomerAnalyticsService; retry: number; state: LoadState; message?: string }

function isConfigurationError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : ''
  return message.includes('VITE_API_BASE_URL') || message.includes('VITE_CUSTOMER_ANALYTICS_RESOURCE_PATH') || message.includes('VITE_DATA_MODE')
}

function MetricCard({ label, value, definition, icon: Icon, accent }: { label: string; value: string; definition: string; icon: typeof UsersRound; accent: string }) {
  return <article className={`customer-kpi ${accent}`} aria-label={`${label}: ${value}`}><div className="customer-kpi-heading"><span className="customer-kpi-icon"><Icon size={18} aria-hidden="true" /></span><span>{label}</span><InfoTip label={`${label} definition`}>{definition}</InfoTip></div><strong>{value}</strong></article>
}

function suppliedNumber(value: number | null | undefined): string {
  return value == null ? '—' : formatNumber(value, { maximumFractionDigits: 0 })
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
      setRequest({ service, retry, state: isConfigurationError(reason) ? 'unavailable' : 'error', message: getUserFacingError(reason) })
    })
    return () => controller.abort()
  }, [service, retry])

  const ready = loadState === 'success' ? snapshot : null
  const observationDate = ready?.summary.observationDate ?? '—'
  const segmentation = segmentationLabel(ready?.summary.segmentationStatus)

  return (
    <div className="customer-analytics-page">
      <header className="customer-page-heading"><div><h1>Customer Analytics</h1><p className="page-description">Eksplorasi perilaku pembelian pelanggan melalui Recency, Frequency, dan Monetary.</p>{ready?.summary.analysisPeriod && <p className="customer-period"><CalendarDays size={14} aria-hidden="true" /><span>Periode analisis: <strong>{ready.summary.analysisPeriod.start} — {ready.summary.analysisPeriod.end}</strong></span></p>}</div></header>

      {loadState === 'loading' && <StateBlock kind="loading" title="Memuat customer analytics" detail="Menunggu respons sumber data." />}{loadState === 'unavailable' && <StateBlock kind="unavailable" title="Belum terhubung ke backend" detail={message ?? 'Mode demo tidak menyediakan data RFM. Tidak ada fixture pelanggan pada halaman ini.'} />}{loadState === 'error' && <StateBlock kind="error" title="Customer analytics gagal dimuat" detail={message ?? 'Periksa koneksi lalu coba lagi.'} action={<button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Coba lagi</button>} />}

      <section className="customer-kpi-grid" aria-label="Customer and segmentation summary">
        <MetricCard label="Eligible Customers" value={suppliedNumber(ready?.summary.eligibleCustomers)} definition="Jumlah pelanggan yang memenuhi kriteria dan dilaporkan oleh sumber data." icon={UsersRound} accent="summary-neutral" />
        <MetricCard label="Customers with RFM Profiles" value={suppliedNumber(ready?.summary.customersWithRfmProfiles)} definition="Jumlah pelanggan dengan profil Recency, Frequency, dan Monetary yang dilaporkan sumber." icon={UserRoundCheck} accent="rfm-frequency" />
        <MetricCard label="RFM Observation Date" value={observationDate} definition="Tanggal acuan yang digunakan sumber untuk interpretasi Recency." icon={CalendarDays} accent="rfm-recency" />
        <MetricCard label="Segmentation Status" value={segmentation} definition="Status hasil segmentasi yang dilaporkan. Profil RFM tidak otomatis berarti K-Means telah dijalankan." icon={Layers3} accent="summary-cluster" />
      </section>

      {loadState === 'loading' && <div className="customer-loading" role="status" aria-label="Customer analytics loading"><span /><span /><span /><span /></div>}
      {loadState === 'success' && ready && ready.customers.length === 0 && <StateBlock kind="empty" title="Belum ada baris pelanggan" detail="Backend menerima permintaan, tetapi belum mengirim data pelanggan. Ini berbeda dari jumlah nol yang dilaporkan." />}

      <CustomerAnalyticsCharts snapshot={ready} />

      <section className={`cluster-notice ${ready?.summary.segmentationStatus === 'available' ? 'cluster-notice-available' : ''}`} aria-labelledby="cluster-note-title"><span className="cluster-notice-icon" aria-hidden="true"><Layers3 size={18} /></span><div><h2 id="cluster-note-title">Profil RFM dan cluster adalah hal berbeda</h2><p>Nilai Recency, Frequency, dan Monetary menggambarkan riwayat transaksi. Label cluster hanya ditampilkan jika respons sumber memang menyediakannya; halaman ini tidak menjalankan K-Means.</p>{ready?.summary.segmentationMessage && <p>{ready.summary.segmentationMessage}</p>}</div><Link className="button button-secondary cluster-link" to="/ml-studio">Go to ML Studio <ArrowUpRight size={14} aria-hidden="true" /></Link></section>

      <CustomerDirectory customers={ready?.customers ?? []} currencyCode={ready?.currencyCode} observationDate={ready?.summary.observationDate} analysisPeriod={ready?.summary.analysisPeriod} />
    </div>
  )
}
