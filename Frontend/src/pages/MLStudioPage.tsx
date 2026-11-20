import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, AlertCircle, ArrowUpRight, CheckCircle2, CircleHelp, Clock3, Database, FlaskConical, Layers3, Play, RotateCw, Settings2, ShieldCheck, Sparkles } from 'lucide-react'
import { mlStudioService, MLStudioConfigurationError } from '../services/mlStudioService'
import type { MLExperimentConfiguration, MLExperimentStatus, MLStudioExperiment, MLStudioService, MLStudioWorkspace } from '../types/mlStudio'
import { getUserFacingError } from '../services/userFacingError'
import { NoticeBanner } from '../components/NoticeBanner'
import { StateBlock } from '../components/StateBlock'
import { Select } from '../components/ui/Select'
import { PageSkeleton } from '../components/PageSkeleton'

type LoadState = 'loading' | 'success' | 'unavailable' | 'error'
type StudioStatus = MLExperimentStatus | 'not-run' | 'backend-unavailable'

const featureDefinitions = [
  { key: 'recency', name: 'Recency', description: 'Hari sejak pembelian valid terakhir.' },
  { key: 'frequency', name: 'Frequency', description: 'Jumlah faktur unik yang memenuhi syarat.' },
  { key: 'monetary', name: 'Monetary', description: 'Nilai transaksi yang memenuhi syarat, bukan profit.' },
] as const

const statusLabels: Record<StudioStatus, string> = {
  'not-run': 'Not Run', queued: 'Queued', running: 'Running', succeeded: 'Succeeded', failed: 'Failed', blocked: 'Blocked', 'backend-unavailable': 'Belum tersedia',
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Belum dilaporkan'
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

function featureStatusText(status?: string): string {
  if (status === 'available') return 'Tersedia'
  if (status === 'unavailable') return 'Belum tersedia'
  return 'Menunggu data'
}

function isConfigurationError(error: unknown): boolean {
  return error instanceof MLStudioConfigurationError || (error instanceof Error && /not configured|VITE_API_BASE_URL|resource path/i.test(error.message))
}

function latestExperiment(history: MLStudioExperiment[]): MLStudioExperiment | undefined {
  return [...history].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))[0]
}

function readinessText(workspace: MLStudioWorkspace | null, loadState: LoadState): string {
  if (loadState === 'loading') return 'Memeriksa metadata RFM'
  if (loadState === 'unavailable') return 'Belum terhubung ke backend'
  if (loadState === 'error') return 'Metadata RFM gagal dimuat'
  if (workspace?.rfm.status === 'available' && featureDefinitions.every(({ key }) => workspace.rfm.features[key].status === 'available')) return 'Data RFM tersedia'
  if (workspace?.rfm.status === 'unavailable') return 'Data RFM belum tersedia'
  return 'Data RFM menunggu konfirmasi'
}

function StatusPill({ status }: { status: StudioStatus }) {
  const Icon = status === 'succeeded' ? CheckCircle2 : status === 'failed' || status === 'blocked' ? AlertCircle : status === 'running' ? Activity : status === 'queued' ? Clock3 : status === 'backend-unavailable' ? Database : CircleHelp
  return <span className={`ml-status ml-status-${status}`}><Icon size={14} aria-hidden="true" />{statusLabels[status]}</span>
}

export function MLStudioPage({ service = mlStudioService }: { service?: MLStudioService }) {
  const [searchParams] = useSearchParams()
  const [workspace, setWorkspace] = useState<MLStudioWorkspace | null>(null)
  const [request, setRequest] = useState<{ service: MLStudioService; retry: number; state: LoadState; message?: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const [k, setK] = useState(3)
  const [seed, setSeed] = useState('42')
  const [seedTouched, setSeedTouched] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [runResult, setRunResult] = useState<MLStudioExperiment | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('experimentId'))
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'timestamp' | 'metric'>('timestamp')
  const [blocked, setBlocked] = useState(false)
  const [runUnavailable, setRunUnavailable] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const currentRequest = request?.service === service && request.retry === retry ? request : null
  const loadState = currentRequest?.state ?? 'loading'
  const message = currentRequest?.message

  useEffect(() => {
    const controller = new AbortController()
    service.getWorkspace(controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setWorkspace(result)
      setRequest({ service, retry, state: 'success' })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setRequest({ service, retry, state: isConfigurationError(error) ? 'unavailable' : 'error', message: getUserFacingError(error) })
    })
    return () => controller.abort()
  }, [service, retry])

  const seedValue = seed.trim() === '' ? Number.NaN : Number(seed)
  const seedIsValid = Number.isSafeInteger(seedValue) && seedValue >= 0
  const seedError = seedTouched && !seedIsValid ? 'Random seed harus berupa bilangan bulat nol atau lebih.' : ''
  const featureReady = workspace?.rfm.status === 'available' && featureDefinitions.every(({ key }) => workspace.rfm.features[key].status === 'available')
  const preprocessingReady = workspace?.preprocessing.status === 'available'
  const experimentReady = loadState === 'success' && featureReady && preprocessingReady
  const displayHistory = useMemo(() => {
    const items = [...(workspace?.history ?? [])]
    if (runResult && !items.some((item) => item.id === runResult.id)) items.unshift(runResult)
    const filtered = items.filter((item) => statusFilter === 'all' || item.status === statusFilter)
    return filtered.sort((left, right) => sortBy === 'timestamp'
      ? Date.parse(right.timestamp) - Date.parse(left.timestamp)
      : (right.primaryMetric?.value ?? Number.NEGATIVE_INFINITY) - (left.primaryMetric?.value ?? Number.NEGATIVE_INFINITY))
  }, [workspace?.history, runResult, statusFilter, sortBy])
  const selectedExperiment = displayHistory.find((item) => item.id === selectedId) ?? null
  const activeExperiment = runResult ?? latestExperiment(workspace?.history ?? [])
  const studioStatus: StudioStatus | null = loadState === 'loading' ? null : blocked ? 'blocked' : loadState === 'unavailable' || loadState === 'error' || runUnavailable ? 'backend-unavailable' : activeExperiment?.status ?? 'not-run'

  async function runExperiment() {
    setSeedTouched(true)
    setActionMessage('')
    setBlocked(false)
    setRunUnavailable(false)
    if (!seedIsValid) {
      setActionMessage('Periksa konfigurasi sebelum menjalankan eksperimen.')
      return
    }
    if (loadState === 'unavailable' || loadState === 'error') {
      setActionMessage('Eksperimen belum dapat dijalankan karena backend belum terhubung. Konfigurasi Anda tetap tersimpan.')
      return
    }
    if (!experimentReady) {
      setBlocked(true)
      setActionMessage('Prasyarat belum terpenuhi. Pastikan semua fitur RFM dan konfigurasi preprocessing tersedia dari backend.')
      return
    }
    const configuration: MLExperimentConfiguration = { k, randomSeed: seedValue }
    setSubmitting(true)
    try {
      const result = await service.runExperiment(configuration)
      setRunResult(result)
      setSelectedId(result.id)
      setActionMessage('Respons eksperimen diterima dari backend.')
    } catch (error) {
      setActionMessage(`Permintaan eksperimen belum mendapat konfirmasi dari backend. ${getUserFacingError(error)}`)
      setRunUnavailable(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ml-studio-page">
      <header className="ml-page-heading reveal reveal-0">
        <div className="ml-title-copy"><h1>ML Studio</h1><p className="page-description">Konfigurasikan dan jalankan eksperimen K-Means untuk segmentasi pelanggan berbasis RFM.</p></div>
        <div className="ml-heading-badges"><span className="ml-algorithm-badge"><FlaskConical size={15} aria-hidden="true" />K-Means</span></div>
      </header>

      {(loadState === 'unavailable' || runUnavailable) && <NoticeBanner severity="warning" className="ml-connection-banner"><span>{loadState === 'unavailable' ? getUserFacingError(new MLStudioConfigurationError('unavailable')) : 'Backend belum menerima atau menyelesaikan permintaan eksperimen.'}</span></NoticeBanner>}
      {loadState === 'error' && <StateBlock kind="error" title="ML Studio gagal dimuat" detail={message ?? 'Periksa koneksi lalu coba lagi.'} action={<button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}><RotateCw size={14} aria-hidden="true" />Coba lagi</button>} />}

      <section className="ml-overview panel" aria-labelledby="ml-overview-title">
        <div className="ml-overview-mark" aria-hidden="true"><Sparkles size={19} /></div>
        <div className="ml-overview-main"><div className="panel-heading"><div><h2 id="ml-overview-title">Eksperimen segmentasi pelanggan</h2></div><span className="ml-source-note"><Database size={14} aria-hidden="true" /> Backend prepared features</span></div><p className="panel-subtitle">K-Means mengelompokkan pelanggan dari profil transaksi yang telah disiapkan backend. Membuka atau memfilter halaman ini tidak menjalankan model.</p>
          <div className="ml-overview-facts"><div><span>Tujuan</span><strong>Pola transaksi pelanggan</strong></div><div><span>Fitur</span><strong>Recency · Frequency · Monetary</strong></div><div><span>Algoritma</span><strong>K-Means</strong></div><div><span>Sumber fitur</span><strong>Profil RFM dari backend</strong></div></div>
        </div>
      </section>

      <section className="ml-workspace-grid" aria-label="Experiment configuration and status">
        <div className="ml-configuration panel">
          <div className="panel-heading"><div><h2>Experiment Configuration</h2><p className="panel-subtitle">Atur parameter eksperimen sebelum mengirim permintaan ke backend.</p></div><span className="ml-panel-icon ml-panel-icon-indigo"><Settings2 size={17} aria-hidden="true" /></span></div>

          <div className="ml-field-block"><div className="ml-field-heading"><label htmlFor="ml-cluster-count">Number of Clusters (K)</label><span>{k}</span></div><Select id="ml-cluster-count" value={String(k)} onChange={(value) => { setK(Number(value)); setActionMessage('') }}>{Array.from({ length: 7 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{`K = ${value}`}</option>)}</Select><p>Menentukan jumlah cluster yang diminta. K yang didukung tetap bergantung pada data dan validasi backend.</p></div>

          <div className="ml-field-block"><label htmlFor="ml-random-seed">Random Seed</label><input id="ml-random-seed" type="text" inputMode="numeric" value={seed} aria-invalid={Boolean(seedError)} aria-describedby="ml-seed-hint ml-seed-error" onChange={(event) => { setSeed(event.target.value); setActionMessage('') }} onBlur={() => setSeedTouched(true)} /><p id="ml-seed-hint">Seed membantu eksperimen dapat diulang dengan konfigurasi acak yang sama.</p>{seedError && <p className="ml-field-error" id="ml-seed-error" role="alert">{seedError}</p>}</div>

          <div className="ml-field-block ml-preprocessing"><div><span className="ml-field-label">Preprocessing configuration</span><p>{workspace?.preprocessing.status === 'available' ? workspace.preprocessing.name ?? 'Metode dilaporkan backend' : 'Menunggu konfirmasi backend'}</p></div><span className={`ml-config-version ${workspace?.preprocessing.status === 'available' ? 'is-available' : ''}`}>{workspace?.preprocessing.version ? `Version ${workspace.preprocessing.version}` : 'Belum terhubung'}</span></div>

          <div className="ml-rfm-section"><div className="ml-subsection-heading"><div><h3>RFM feature summary</h3><p>Status dan statistik mengikuti metadata aktual.</p></div><span className="ml-cyan-tag"><Layers3 size={13} aria-hidden="true" />RFM</span></div><div className="ml-feature-grid">{featureDefinitions.map(({ key, name, description }) => {
            const feature = workspace?.rfm.features[key]
            return <article className={`ml-feature-card ml-feature-${key}`} key={key}><div className="ml-feature-title"><span>{name}</span><span className={`ml-feature-status status-${feature?.status ?? 'pending'}`}>{featureStatusText(feature?.status)}</span></div><p>{description}</p>{feature?.status === 'available' && (feature.sampleCount != null || feature.minimum != null || feature.maximum != null || feature.mean != null || feature.standardDeviation != null) && <dl><div><dt>Samples</dt><dd>{feature.sampleCount ?? '—'}</dd></div><div><dt>Range</dt><dd>{feature.minimum ?? '—'} – {feature.maximum ?? '—'}</dd></div><div><dt>Mean / SD</dt><dd>{feature.mean ?? '—'} / {feature.standardDeviation ?? '—'}</dd></div></dl>}</article>
          })}</div></div>

          <div className="ml-config-summary"><div className="ml-subsection-heading"><div><h3>Configuration summary</h3><p>Ringkasan berubah mengikuti pilihan konfigurasi.</p></div><ShieldCheck size={16} aria-hidden="true" /></div><div className="ml-summary-grid"><span>Algorithm<strong>K-Means · K = {k}</strong></span><span>Random seed<strong>{seed.trim() || 'Belum valid'}</strong></span><span>Features<strong>Recency, Frequency, Monetary</strong></span><span>Preprocessing<strong>{workspace?.preprocessing.status === 'available' ? `${workspace.preprocessing.name ?? 'Terkonfirmasi'}${workspace.preprocessing.version ? ` · ${workspace.preprocessing.version}` : ''}` : 'Menunggu konfirmasi'}</strong></span><span>Data prerequisite<strong>{readinessText(workspace, loadState)}</strong></span></div></div>

          <div className="ml-run-area"><div><p>Permintaan hanya dapat dikirim jika backend, fitur RFM, dan preprocessing tersedia.</p>{actionMessage && <p className={`ml-action-message ${blocked ? 'is-blocked' : ''}`} role="status" aria-live="polite">{actionMessage}</p>}</div><button className="button button-primary ml-run-button" type="button" onClick={() => void runExperiment()} disabled={submitting}><Play size={15} fill="currentColor" aria-hidden="true" />{submitting ? 'Sending request…' : 'Run K-Means Experiment'}</button></div>
        </div>

        <aside className="ml-lifecycle panel" aria-labelledby="ml-lifecycle-title"><div className="panel-heading"><div><h2 id="ml-lifecycle-title">Experiment status</h2></div><span className="ml-panel-icon ml-panel-icon-violet"><Activity size={17} aria-hidden="true" /></span></div><div className="ml-lifecycle-state">{studioStatus ? <StatusPill status={studioStatus} /> : <span className="ml-lifecycle-loading">Memuat status eksperimen</span>}<p>{loadState === 'loading' ? 'Menunggu respons backend sebelum status dapat ditentukan.' : studioStatus === 'backend-unavailable' ? 'Belum ada status eksperimen dari backend.' : studioStatus === 'not-run' ? 'Belum ada eksperimen yang dilaporkan.' : 'Status ini dilaporkan oleh backend.'}</p></div><dl className="ml-lifecycle-details"><div><dt>Configuration</dt><dd>K = {activeExperiment?.k ?? k} · Seed {activeExperiment?.randomSeed ?? (seed.trim() || '—')}</dd></div><div><dt>Started</dt><dd>{formatTimestamp(activeExperiment?.startedAt)}</dd></div><div><dt>Completed</dt><dd>{formatTimestamp(activeExperiment?.completedAt)}</dd></div></dl>{activeExperiment?.status === 'succeeded' && activeExperiment.evaluationAvailable && <Link className="button button-secondary ml-evaluation-link" to={`/model-evaluation?experimentId=${encodeURIComponent(activeExperiment.id)}`}>View evaluation <ArrowUpRight size={14} aria-hidden="true" /></Link>}{!activeExperiment && <p className="ml-evaluation-empty">Hasil evaluasi tersedia setelah backend melaporkan eksperimen berhasil.</p>}</aside>
      </section>

      <section className="ml-history panel reveal reveal-5" aria-labelledby="ml-history-title"><div className="panel-heading ml-history-heading"><div><h2 id="ml-history-title">Experiment History</h2><p className="panel-subtitle">Memilih eksperimen hanya membuka detail; tidak ada pelatihan ulang.</p></div><span className="ml-panel-icon ml-panel-icon-violet"><Clock3 size={17} aria-hidden="true" /></span></div>
        {loadState === 'loading' && <PageSkeleton variant="ml" />}
        {loadState === 'error' && <StateBlock kind="error" title="Riwayat eksperimen gagal dimuat" detail={message ?? 'Periksa koneksi lalu coba lagi.'} action={<button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Coba lagi</button>} />}
        {loadState === 'success' && workspace?.history.length === 0 && !runResult && <StateBlock kind="empty" title="Belum ada riwayat eksperimen" detail="Daftar akan muncul setelah backend menyediakan eksperimen yang tercatat." />}
        {loadState === 'success' && (workspace?.history.length || runResult) ? <><div className="ml-history-toolbar"><label>Status<Select aria-label="Filter experiment status" value={statusFilter} onChange={(value) => setStatusFilter(value)}><option value="all">All statuses</option>{(['queued', 'running', 'succeeded', 'failed', 'blocked'] as const).map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</Select></label><label>Sort by<Select aria-label="Sort experiment history" value={sortBy} onChange={(value) => setSortBy(value as 'timestamp' | 'metric')}><option value="timestamp">Most recent</option><option value="metric" disabled={!displayHistory.some((item) => item.primaryMetric)}>Primary metric</option></Select></label></div>{displayHistory.length > 0 ? <div className="ml-history-table-wrap"><table className="ml-history-table"><thead><tr><th>Experiment ID</th><th>Timestamp</th><th>K</th><th>Random Seed</th><th>Preprocessing</th><th>Status</th><th>Primary Metric</th><th>Action</th></tr></thead><tbody>{displayHistory.map((experiment) => <tr key={experiment.id} className={selectedId === experiment.id ? 'is-selected' : ''}><td><button className="ml-id-button" type="button" onClick={() => setSelectedId(selectedId === experiment.id ? null : experiment.id)} aria-expanded={selectedId === experiment.id}>{experiment.id}</button></td><td>{formatTimestamp(experiment.timestamp)}</td><td>{experiment.k}</td><td>{experiment.randomSeed}</td><td>{experiment.preprocessingVersion ?? 'Belum dilaporkan'}</td><td><StatusPill status={experiment.status} /></td><td>{experiment.primaryMetric ? `${experiment.primaryMetric.label}: ${experiment.primaryMetric.value}` : 'Belum tersedia'}</td><td>{experiment.status === 'succeeded' && experiment.evaluationAvailable ? <Link className="ml-table-action" to={`/model-evaluation?experimentId=${encodeURIComponent(experiment.id)}`}>Evaluation <ArrowUpRight size={13} aria-hidden="true" /></Link> : <button className="ml-table-action" type="button" onClick={() => setSelectedId(experiment.id)}>View details</button>}</td></tr>)}</tbody></table></div> : <p className="ml-history-no-filter-results">Tidak ada eksperimen untuk filter status ini.</p>}</> : null}
        {selectedExperiment && <aside className="ml-experiment-detail" aria-label={`Experiment details ${selectedExperiment.id}`}><div><strong>{selectedExperiment.id}</strong><StatusPill status={selectedExperiment.status} /></div><p>Detail status mengikuti informasi aman yang dilaporkan backend.</p><span>Started: {formatTimestamp(selectedExperiment.startedAt)}</span><span>Completed: {formatTimestamp(selectedExperiment.completedAt)}</span></aside>}
      </section>
      <p className="ml-contract-note"><CircleHelp size={14} aria-hidden="true" /> Endpoint, payload, readiness rules, preprocessing, lifecycle, and evaluation link contract masih perlu dikonfirmasi dengan tim backend.</p>
    </div>
  )
}
