import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, RotateCw, SlidersHorizontal } from 'lucide-react'
import { RecommendationCard, RecommendationEvidenceDrawer } from '../components/action-center/RecommendationCard'
import { categoryLabels } from '../components/action-center/actionCenterLabels'
import { actionCenterService, ActionCenterConfigurationError } from '../services/actionCenterService'
import type { ActionCenterService, ActionCenterSnapshot, ActionRecommendation, ActionRecommendationCategory, ActionRecommendationSource } from '../types/actionCenter'

const noRecommendations: ActionRecommendation[] = []

type LoadState = 'loading' | 'success' | 'unavailable' | 'error'
type CategoryFilter = 'all' | ActionRecommendationCategory
type SourceFilter = 'all' | ActionRecommendationSource

function isConfigurationError(error: unknown): boolean {
  return error instanceof ActionCenterConfigurationError || (error instanceof Error && /VITE_API_BASE_URL|VITE_ACTION_CENTER_RESOURCE_PATH|resource path.*not configured/i.test(error.message))
}

function sourceName(source: ActionRecommendationSource): string {
  return source === 'rfm' ? 'RFM' : source === 'cluster' ? 'Cluster' : 'Product'
}

function hasEvidence(recommendation: ActionRecommendation): boolean {
  const evidence = recommendation.evidence
  return Boolean(evidence && (evidence.recency?.value != null || evidence.frequency?.value != null || evidence.monetary?.value != null || evidence.cluster || evidence.customersAnalyzed != null || evidence.analysisPeriod || evidence.sourceLabel))
}

function matchesSearch(recommendation: ActionRecommendation, query: string): boolean {
  if (!query.trim()) return true
  const evidence = recommendation.evidence
  const terms = [recommendation.title, recommendation.segment, ...recommendation.customerIds ?? [], String(evidence?.cluster?.clusterId ?? ''), evidence?.cluster?.experimentId]
  return terms.some((term) => term?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
}

function retryableMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Action Center recommendations could not be loaded.'
}

function ActionCenterError({ state, message, onRetry }: { state: 'unavailable' | 'error'; message: string; onRetry: () => void }) {
  return <section className={`action-status-panel action-status-${state}`} role={state === 'error' ? 'alert' : 'status'}>
    <AlertCircle size={20} aria-hidden="true"/><div><h2>{state === 'unavailable' ? 'Menunggu integrasi backend' : 'Recommendations could not be loaded'}</h2><p>{state === 'unavailable' ? message || 'Rekomendasi aktual akan muncul setelah sumber backend dikonfigurasi.' : message}</p>{state === 'unavailable' && <p>Atur `VITE_API_BASE_URL` dan `VITE_ACTION_CENTER_RESOURCE_PATH` setelah kontrak disepakati.</p>}<button type="button" className="button button-secondary" onClick={onRetry}><RotateCw size={15}/>Retry</button></div>
  </section>
}

export function ActionCenterPage({ service = actionCenterService }: { service?: ActionCenterService }) {
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState<{ service: ActionCenterService; retry: number; state: LoadState; snapshot?: ActionCenterSnapshot; message?: string } | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [source, setSource] = useState<SourceFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'title' | 'newest'>('title')
  const [selected, setSelected] = useState<ActionRecommendation | null>(null)

  const requestMatches = request?.service === service && request.retry === retry
  const loadState: LoadState = requestMatches ? request.state : 'loading'
  const snapshot = requestMatches && request.state === 'success' ? request.snapshot : undefined

  useEffect(() => {
    const controller = new AbortController()
    service.getSnapshot(controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setRequest({ service, retry, state: 'success', snapshot: data })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setRequest({ service, retry, state: isConfigurationError(error) ? 'unavailable' : 'error', message: retryableMessage(error) })
    })
    return () => controller.abort()
  }, [service, retry])

  const allRecommendations = snapshot?.recommendations ?? noRecommendations
  const newestAvailable = allRecommendations.length > 0 && allRecommendations.every((item) => item.createdAt && Number.isFinite(Date.parse(item.createdAt)))
  const filteredRecommendations = useMemo(() => {
    const filtered = allRecommendations.filter((item) => (category === 'all' || item.category === category) && (source === 'all' || item.source === source) && matchesSearch(item, query))
    return filtered.sort((left, right) => sort === 'newest' ? Date.parse(right.createdAt ?? '') - Date.parse(left.createdAt ?? '') : left.title.localeCompare(right.title, 'id'))
  }, [allRecommendations, category, source, query, sort])
  const hasRecommendations = allRecommendations.length > 0
  const filtersActive = category !== 'all' || source !== 'all' || Boolean(query.trim())
  const visibleCategoryCounts = useMemo(() => filteredRecommendations.reduce<Partial<Record<ActionRecommendationCategory, number>>>((counts, recommendation) => {
    counts[recommendation.category] = (counts[recommendation.category] ?? 0) + 1
    return counts
  }, {}), [filteredRecommendations])
  const visibleSources = [...new Set(filteredRecommendations.map((item) => item.source))]
  const evidenceCount = filteredRecommendations.filter(hasEvidence).length

  function resetFilters() { setCategory('all'); setSource('all'); setQuery('') }
  function retryRequest() { setRequest(null); setRetry((value) => value + 1) }
  const closeDrawer = useCallback(() => { setSelected(null) }, [])
  function openEvidence(recommendation: ActionRecommendation) { setSelected(recommendation) }

  return <div className="page-content action-center-page">
    <header className="page-heading action-page-heading"><div><span className="eyebrow">CUSTOMER ACTION WORKSPACE</span><h1>Action Center</h1><p>Ubah temuan analitik pelanggan menjadi saran tindakan bisnis yang transparan dan dapat ditinjau.</p></div></header>

    <section className={`action-availability action-availability-${loadState}`} role={loadState === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="action-availability-mark" aria-hidden="true"/>
      <div><strong>{loadState === 'loading' ? 'Memuat rekomendasi' : loadState === 'success' ? hasRecommendations ? 'Recommendations available' : 'Belum ada rekomendasi' : loadState === 'unavailable' ? 'Menunggu integrasi backend' : 'Recommendation data unavailable'}</strong><p>{loadState === 'loading' ? 'Memeriksa sumber analitik yang terhubung.' : loadState === 'success' ? hasRecommendations ? snapshot?.sourceLabel || 'Daftar ini menampilkan rekomendasi yang disediakan oleh sumber terhubung.' : 'Rekomendasi aktual akan tampil setelah sumber analitik menyediakan hasil.' : loadState === 'unavailable' ? request?.message || 'Rekomendasi aktual menunggu integrasi backend.' : request?.message}</p></div>
      {loadState === 'success' && snapshot?.sourceLabel && <span className="action-origin">Source · {snapshot.sourceLabel}</span>}
    </section>

    <section className="action-summary-grid" aria-label="Recommendation overview">
      <article className="action-summary-card action-summary-total"><span>Visible recommendations</span><strong>{hasRecommendations ? filteredRecommendations.length : loadState === 'success' ? 'Belum ada' : 'Menunggu integrasi backend'}</strong><small>{hasRecommendations ? `Showing ${filteredRecommendations.length} of ${allRecommendations.length} recommendations` : 'Counts appear when recommendations are supplied.'}</small></article>
      <article className="action-summary-card action-summary-categories"><span>Categories in this view</span>{Object.entries(visibleCategoryCounts).length ? <div className="action-summary-tags">{Object.entries(visibleCategoryCounts).map(([key, count]) => <span className={`action-category-tag action-category-${key}`} key={key}>{categoryLabels[key as ActionRecommendationCategory]} <b>{count}</b></span>)}</div> : <strong>{loadState === 'success' ? 'Belum ada' : 'Menunggu integrasi backend'}</strong>}<small>Counts come from the currently visible records.</small></article>
      <article className="action-summary-card action-summary-sources"><span>Analytics sources in this view</span><strong>{visibleSources.length ? visibleSources.map(sourceName).join(' · ') : loadState === 'success' ? 'Belum tersedia' : 'Menunggu integrasi backend'}</strong><small>{snapshot?.sourceLabel || 'Source labels follow each supplied recommendation.'}</small></article>
      <article className="action-summary-card action-summary-evidence"><span>Supporting evidence</span><strong>{hasRecommendations ? `${evidenceCount} of ${filteredRecommendations.length}` : loadState === 'success' ? 'Belum tersedia' : 'Menunggu integrasi backend'}</strong><small>{snapshot?.dataStatus === 'partial' ? 'Backend reports partial data availability.' : snapshot?.dataStatus === 'unavailable' ? 'Backend reports supporting data unavailable.' : 'Availability is assessed from supplied evidence fields.'}</small></article>
    </section>

    <section className="action-controls panel" aria-label="Recommendation filters">
      <div className="action-controls-heading"><div><SlidersHorizontal size={16} aria-hidden="true"/><h2>Find recommendations</h2></div>{filtersActive && <span className="action-filter-active">Filters active</span>}</div>
      <div className="action-filter-grid">
        <label>Category<select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} disabled={!hasRecommendations}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Analytics source<select aria-label="Filter by source" value={source} onChange={(event) => setSource(event.target.value as SourceFilter)} disabled={!hasRecommendations}><option value="all">All sources</option><option value="rfm">RFM</option><option value="cluster">Cluster</option><option value="product">Product</option></select></label>
        <label>Search<input aria-label="Search recommendations" type="search" placeholder="Customer ID or segment" value={query} onChange={(event) => setQuery(event.target.value)} disabled={!hasRecommendations}/></label>
        <label>Sort by<select aria-label="Sort recommendations" value={sort} onChange={(event) => setSort(event.target.value as 'title' | 'newest')} disabled={!hasRecommendations}><option value="title">Title A–Z</option><option value="newest" disabled={!newestAvailable}>Newest first</option></select></label>
      </div>
      <div className="action-filter-footer"><span>{filtersActive ? `${filteredRecommendations.length} results · filters active` : hasRecommendations ? `${allRecommendations.length} recommendations available` : 'Filters are waiting for recommendation data.'}</span><button type="button" className="text-button" onClick={resetFilters} disabled={!filtersActive}>Reset filters</button></div>
    </section>

    {loadState === 'loading' && <div className="action-state-panel" role="status"><span className="action-loading-mark"/><div><strong>Memuat rekomendasi</strong><p>Menunggu respons sumber analitik.</p></div></div>}
    {(loadState === 'unavailable' || loadState === 'error') && <ActionCenterError state={loadState} message={request?.message || ''} onRetry={retryRequest}/>}
    {loadState === 'success' && !hasRecommendations && <section className="action-empty-state" role="status"><span className="action-empty-icon" aria-hidden="true">—</span><div><h2>Belum ada rekomendasi</h2><p>Belum ada rekomendasi aktual yang disediakan oleh sumber analitik. Kategori contoh tidak ditampilkan sebagai hasil.</p></div></section>}
    {loadState === 'success' && hasRecommendations && filteredRecommendations.length === 0 && <section className="action-empty-state" role="status"><span className="action-empty-icon" aria-hidden="true">⌕</span><div><h2>No recommendations match these filters</h2><p>Try another category, source, or search term.</p><button type="button" className="text-button" onClick={resetFilters}>Reset filters</button></div></section>}
    {loadState === 'success' && filteredRecommendations.length > 0 && <section className="action-recommendation-grid" aria-label="Recommendations">{filteredRecommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} snapshot={snapshot!} onViewEvidence={() => openEvidence(recommendation)}/>)}</section>}
    {selected && snapshot && <RecommendationEvidenceDrawer recommendation={selected} snapshot={snapshot} onClose={closeDrawer}/>}
  </div>
}
