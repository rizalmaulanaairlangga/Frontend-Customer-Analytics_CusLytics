import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Database, FileSearch, Rows3, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DataQualitySections } from '../components/data-quality/DataQualitySections'
import { dataQualityService, DataQualityConfigurationError, type DataQualityService } from '../services/dataQualityService'
import type { DataQualitySnapshot } from '../types/dataQuality'

type LoadState = 'loading' | 'connected' | 'unconnected' | 'error'

interface DataQualityPageProps {
  service?: DataQualityService
}

function formatCount(value?: number): string {
  return value === undefined ? 'Belum tersedia' : new Intl.NumberFormat('id-ID').format(value)
}

function formatDateRange(snapshot?: DataQualitySnapshot | null): string {
  const range = snapshot?.dataset.transactionDateRange
  return range ? `${range.start} to ${range.end}` : 'Belum tersedia'
}

function formatTimestamp(value?: string): string {
  if (!value) return 'Belum dilaporkan'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function statusText(snapshot?: DataQualitySnapshot): string {
  if (!snapshot) return 'Menunggu data dari backend'
  if (snapshot.dataset.readStatus === 'pending') return 'Menunggu data dari backend'
  if (snapshot.dataset.readStatus === 'failed') return 'Gagal membaca dataset'
  if (snapshot.dataset.validationStatus === 'pending') return 'Menunggu validasi backend'
  if (snapshot.dataset.validationStatus === 'passed') return 'Validasi dilaporkan selesai'
  if (snapshot.dataset.validationStatus === 'warning') return 'Temuan perlu ditinjau'
  return 'Validasi melaporkan masalah'
}

function SummaryCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent: string }) {
  return (
    <article className={`quality-summary-card quality-accent-${accent}`}>
      <div className="quality-summary-icon"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></div>
      <div className="quality-summary-copy"><span>{label}</span><strong>{value}</strong></div>
    </article>
  )
}

export function DataQualityPage({ service = dataQualityService }: DataQualityPageProps) {
  const [request, setRequest] = useState<{ service: DataQualityService; state: LoadState; snapshot?: DataQualitySnapshot | null; error?: string } | null>(null)
  const currentRequest = request?.service === service ? request : null
  const loadState = currentRequest?.state ?? 'loading'
  const snapshot = currentRequest?.snapshot ?? null
  const error = currentRequest?.error ?? ''

  useEffect(() => {
    const controller = new AbortController()
    service.getSnapshot(controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setRequest({ service, snapshot: result, state: result ? 'connected' : 'unconnected' })
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      setRequest({ service, error: reason instanceof Error ? reason.message : 'Profil kualitas data gagal dimuat.', state: reason instanceof DataQualityConfigurationError ? 'unconnected' : 'error' })
    })
    return () => controller.abort()
  }, [service])

  const readFailed = loadState === 'error' || snapshot?.dataset.readStatus === 'failed'
  const validationLabel = snapshot ? statusText(snapshot) : 'Menunggu data dari backend'

  return (
    <div className="data-quality-page">
      <header className="quality-page-heading">
        <div>
          <p className="eyebrow">Dataset observability</p>
          <h1>Data Status / Quality</h1>
          <p className="quality-page-description">Pantau kondisi dataset dan tinjau dampak aturan pembersihan sebelum menggunakan hasil analitik.</p>
        </div>
        <a className="source-link" href="https://archive.ics.uci.edu/dataset/502/online+retail+ii" target="_blank" rel="noreferrer">
          <span>Sumber dataset UCI</span><ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </header>

      <section className={`connection-banner connection-${readFailed ? 'error' : loadState}`} role={readFailed ? 'alert' : 'status'} aria-live="polite">
        <span className="connection-icon" aria-hidden="true">
          {readFailed ? <AlertTriangle size={18} /> : loadState === 'connected' ? <CheckCircle2 size={18} /> : loadState === 'loading' ? <Clock3 size={18} /> : <Database size={18} />}
        </span>
        <div className="connection-copy">
          <strong>{loadState === 'loading' ? 'Memuat profil dataset' : loadState === 'connected' ? snapshot?.dataset.readStatus === 'failed' ? 'Gagal membaca dataset' : 'Profil diterima dari backend' : loadState === 'error' ? 'Profil dataset gagal dibaca' : 'Belum terhubung'}</strong>
          <span>{error || snapshot?.dataset.errorMessage || (loadState === 'connected' ? `Pemeriksaan terakhir: ${formatTimestamp(snapshot?.dataset.lastCheckedAt)}` : 'Menunggu data dari backend. Status ini bukan hasil pemeriksaan dataset.')}</span>
        </div>
        {loadState === 'connected' && snapshot?.source === 'api' && <span className="quality-source-badge">Data backend</span>}
      </section>

      {loadState === 'loading' && <div className="quality-loading" role="status" aria-label="Loading data quality profile"><span /><span /><span /><span /></div>}

      <section className="dataset-identity panel" aria-labelledby="dataset-name">
        <div className="dataset-identity-icon"><Database size={20} aria-hidden="true" /></div>
        <div className="dataset-identity-copy">
          <p className="eyebrow">Dataset reference</p>
          <h2 id="dataset-name">UCI Online Retail II</h2>
          <p>Identitas file: {snapshot?.dataset.fileIdentity ?? 'Belum dilaporkan oleh sumber data'}</p>
        </div>
        <div className="dataset-read-status"><span>Status pembacaan</span><strong>{snapshot?.dataset.readStatus === 'available' ? 'Tersedia' : snapshot?.dataset.readStatus === 'failed' ? 'Gagal dibaca' : 'Belum terhubung'}</strong></div>
      </section>

      <section className="quality-summary-grid" aria-label="Dataset summary">
        <SummaryCard icon={Rows3} label="Jumlah baris" value={formatCount(snapshot?.dataset.rowCount)} accent="blue" />
        <SummaryCard icon={Database} label="Jumlah kolom" value={formatCount(snapshot?.dataset.columnCount)} accent="teal" />
        <SummaryCard icon={CalendarDays} label="Rentang tanggal transaksi" value={formatDateRange(snapshot)} accent="indigo" />
        <SummaryCard icon={ShieldCheck} label="Status validasi" value={validationLabel} accent={snapshot?.dataset.validationStatus === 'failed' ? 'red' : snapshot?.dataset.validationStatus === 'warning' ? 'amber' : 'violet'} />
      </section>

      <DataQualitySections snapshot={snapshot} />

      {readFailed && snapshot?.dataset.errorMessage && <p className="quality-error-note">Detail pembacaan: {snapshot.dataset.errorMessage}</p>}
      {readFailed && !error && snapshot?.dataset.readStatus === 'failed' && <p className="quality-error-note">Backend melaporkan dataset gagal dibaca. Periksa pesan error atau log yang disediakan backend.</p>}
      <p className="quality-last-checked"><FileSearch size={14} aria-hidden="true" /> Waktu pemeriksaan terakhir: {formatTimestamp(snapshot?.dataset.lastCheckedAt)}</p>
    </div>
  )
}
