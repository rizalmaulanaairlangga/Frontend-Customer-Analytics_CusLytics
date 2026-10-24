import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, X } from 'lucide-react'
import type { ActionCenterSnapshot, ActionEvidenceMetric, ActionRecommendation } from '../../types/actionCenter'
import { categoryLabels, sourceLabel } from './actionCenterLabels'

function metricText(metric?: ActionEvidenceMetric | null): string {
  if (!metric || metric.value == null) return 'Data belum tersedia'
  const value = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(metric.value)
  return metric.unit ? `${value} ${metric.unit}` : `${value} · satuan tidak dilaporkan`
}

function evidenceSummary(recommendation: ActionRecommendation): string[] {
  const evidence = recommendation.evidence
  if (!evidence) return []
  const lines: string[] = []
  if (evidence.recency?.value != null) lines.push(`Recency: ${metricText(evidence.recency)}`)
  if (evidence.frequency?.value != null) lines.push(`Frequency: ${metricText(evidence.frequency)}`)
  if (evidence.monetary?.value != null) lines.push(`Monetary (nilai transaksi, bukan laba): ${metricText(evidence.monetary)}`)
  if (evidence.cluster) lines.push(`Cluster ${evidence.cluster.clusterId}${evidence.cluster.experimentId ? ` · Experiment ${evidence.cluster.experimentId}` : ''}`)
  if (evidence.customersAnalyzed != null) lines.push(`${new Intl.NumberFormat('id-ID').format(evidence.customersAnalyzed)} pelanggan dianalisis`)
  const period = evidence.analysisPeriod
  if (period) lines.push(`Periode: ${period.start} – ${period.end}`)
  return lines
}

export function RecommendationCard({ recommendation, snapshot, onViewEvidence }: { recommendation: ActionRecommendation; snapshot: ActionCenterSnapshot; onViewEvidence: (button: HTMLButtonElement) => void }) {
  const details = evidenceSummary(recommendation)
  const limitations = recommendation.limitations?.filter(Boolean) ?? []
  return <article className={`action-recommendation-card action-category-${recommendation.category}`}>
    <div className="action-card-heading"><span className="action-category-badge">{categoryLabels[recommendation.category]}</span><span className="action-source-badge">{sourceLabel(recommendation.source)}</span></div>
    <h2>{recommendation.title}</h2>
    <section><h3>Finding</h3><p>{recommendation.finding}</p>{recommendation.interpretation && <p className="action-interpretation"><strong>Interpretation:</strong> {recommendation.interpretation}</p>}</section>
    <section><h3>Supporting evidence</h3>{details.length ? <ul className="action-evidence-list">{details.slice(0, 4).map((line) => <li key={line}>{line}</li>)}</ul> : <p className="action-unavailable-evidence">Bukti pendukung belum tersedia.</p>}{(recommendation.evidence?.sourceLabel || snapshot.sourceLabel) && <p className="action-evidence-source">Sumber: {recommendation.evidence?.sourceLabel || snapshot.sourceLabel}</p>}</section>
    <section><h3>Reasoning</h3><p>{recommendation.reasoning}</p></section>
    <section className="action-suggestion"><h3>Suggested action</h3><p>{recommendation.suggestedAction}</p></section>
    <section className="action-limitations"><h3>Limitations</h3><p>{limitations[0] || 'Pola transaksi yang tersedia tidak membuktikan sebab-akibat atau hasil dari tindakan yang disarankan.'}</p></section>
    <footer className="action-card-footer"><span>{recommendation.segment || 'Segmen tidak dilaporkan'}</span><button className="button button-secondary" type="button" aria-label={`View Evidence for ${recommendation.title}`} onClick={(event) => onViewEvidence(event.currentTarget)}>View Evidence <ChevronRight size={15} aria-hidden="true"/></button></footer>
  </article>
}

export function RecommendationEvidenceDrawer({ recommendation, snapshot, onClose }: { recommendation: ActionRecommendation; snapshot: ActionCenterSnapshot; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    closeButton.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>('.action-evidence-drawer button, .action-evidence-drawer a[href], .action-evidence-drawer input, .action-evidence-drawer select, .action-evidence-drawer [tabindex]:not([tabindex="-1"])'))
        if (focusable.length === 0) { event.preventDefault(); return }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; returnTarget?.focus() }
  }, [onClose])

  const evidence = recommendation.evidence
  const metricRows = [
    { label: 'Recency', value: metricText(evidence?.recency), source: evidence?.recency?.source },
    { label: 'Frequency', value: metricText(evidence?.frequency), source: evidence?.frequency?.source },
    { label: 'Monetary (nilai transaksi, bukan laba)', value: metricText(evidence?.monetary), source: evidence?.monetary?.source },
  ]
  const period = evidence?.analysisPeriod ?? snapshot.analysisPeriod
  const clusterEvaluationLink = recommendation.source === 'cluster' && evidence?.cluster?.experimentId
    ? `/model-evaluation?experimentId=${encodeURIComponent(evidence.cluster.experimentId)}` : null

  return <div className="action-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="action-evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="action-evidence-title">
      <header className="action-drawer-header"><div><span className="eyebrow">RECOMMENDATION EVIDENCE</span><h2 id="action-evidence-title">{recommendation.title}</h2></div><button ref={closeButton} className="action-drawer-close" type="button" aria-label="Close evidence" onClick={onClose}><X size={18}/></button></header>
      <div className="action-drawer-body">
        <section><h3>Finding</h3><p>{recommendation.finding}</p>{recommendation.interpretation && <p><strong>Interpretation:</strong> {recommendation.interpretation}</p>}</section>
        <section><h3>Supporting evidence</h3>{evidence ? <dl className="action-evidence-metrics">{metricRows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd>{row.source && <small>Source: {row.source}</small>}</div>)}<div><dt>Cluster</dt><dd>{evidence.cluster ? `Cluster ${evidence.cluster.clusterId}` : 'Data belum tersedia'}</dd>{evidence.cluster?.experimentId && <small>Experiment ID: {evidence.cluster.experimentId}</small>}</div><div><dt>Analysis population</dt><dd>{evidence.customersAnalyzed == null ? 'Data belum tersedia' : `${new Intl.NumberFormat('id-ID').format(evidence.customersAnalyzed)} customers`}</dd></div><div><dt>Observation period</dt><dd>{period ? `${period.start} – ${period.end}` : 'Data belum tersedia'}</dd></div></dl> : <p className="action-unavailable-evidence">Bukti belum disediakan oleh sumber rekomendasi.</p>}{(evidence?.sourceLabel || snapshot.sourceLabel) && <p className="action-evidence-source">Source: {evidence?.sourceLabel || snapshot.sourceLabel}</p>}</section>
        <section><h3>Reasoning</h3><p>{recommendation.reasoning}</p></section>
        <section><h3>Rule reference</h3><p>{recommendation.ruleReference || 'Referensi aturan belum disediakan oleh sumber rekomendasi.'}</p></section>
        <section className="action-suggestion"><h3>Suggested action</h3><p>{recommendation.suggestedAction}</p></section>
        <section className="action-limitations"><h3>Limitations</h3>{recommendation.limitations?.length ? <ul>{recommendation.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul> : <p>Pola transaksi tidak membuktikan sebab-akibat atau bahwa insentif akan meningkatkan retensi, konversi, atau laba.</p>}</section>
        <section className="action-context-links"><h3>Related pages</h3>{recommendation.source === 'rfm' && <Link to="/customers">View Customer Analytics <ArrowUpRight size={14}/></Link>}{recommendation.source === 'cluster' && (clusterEvaluationLink ? <Link to={clusterEvaluationLink}>View Model Evaluation <ArrowUpRight size={14}/></Link> : <p>Experiment ID belum disediakan; tautan Model Evaluation tidak dapat ditentukan.</p>)}{recommendation.source === 'product' && <Link to="/sales-products">View Sales &amp; Products <ArrowUpRight size={14}/></Link>}<Link to="/reports">Open Reports <ArrowUpRight size={14}/></Link></section>
      </div>
    </section>
  </div>
}
