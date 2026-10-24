import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CircleHelp, Info, RotateCw } from 'lucide-react'
import { ClusterDistributionChart, ClusterScatterChart, InertiaComparisonChart, type ScatterAxis } from '../components/model-evaluation/ModelEvaluationCharts'
import { modelEvaluationService } from '../services/modelEvaluationService'
import type { ModelEvaluationService, ModelEvaluationSnapshot } from '../types/modelEvaluation'
import type { MLStudioExperiment } from '../types/mlStudio'

type LoadState = 'loading' | 'success' | 'unavailable' | 'error'
const axisOptions: { value: ScatterAxis; label: string }[] = [{ value: 'recency', label: 'Recency' }, { value: 'frequency', label: 'Frequency' }, { value: 'monetary', label: 'Monetary' }]
const profileMetrics = [{ key: 'recency', label: 'Recency' }, { key: 'frequency', label: 'Frequency' }, { key: 'monetary', label: 'Monetary' }] as const

function formatDate(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}
function number(value?: number | null, digits = 2) { return value == null ? 'Data belum tersedia' : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) }
function configError(error: unknown) { return error instanceof Error && /not configured|VITE_|resource path/i.test(error.message) }
function profileObservations(snapshot: ModelEvaluationSnapshot): string[] {
  const clusters = snapshot.clusters.filter((cluster) => cluster.profile)
  const statistics = new Set(clusters.map((cluster) => cluster.profile?.statistic))
  if (statistics.size !== 1) return []
  return profileMetrics.flatMap(({ key, label }) => {
    const values = clusters.filter((cluster) => typeof cluster.profile?.[key] === 'number')
    if (values.length < 2) return []
    const lowest = values.reduce((left, right) => (right.profile?.[key] ?? Infinity) < (left.profile?.[key] ?? Infinity) ? right : left)
    const highest = values.reduce((left, right) => (right.profile?.[key] ?? -Infinity) > (left.profile?.[key] ?? -Infinity) ? right : left)
    if (lowest.clusterId === highest.clusterId) return []
    const statistic = [...statistics][0]
    return [`${label}: ${statistic} is lower in Cluster ${lowest.clusterId} (${number(lowest.profile?.[key], 1)}) than Cluster ${highest.clusterId} (${number(highest.profile?.[key], 1)}).`]
  })
}
function ErrorPanel({ message, retry }: { message: string; retry: () => void }) { return <div className="evaluation-state evaluation-error" role="alert"><AlertCircle aria-hidden="true"/><div><strong>{message}</strong><p>Periksa koneksi dan konfigurasi API, lalu coba lagi.</p><button className="button button-secondary" onClick={retry}><RotateCw size={15}/>Retry</button></div></div> }

export function ModelEvaluationPage({ service = modelEvaluationService }: { service?: ModelEvaluationService }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedId = searchParams.get('experimentId') ?? ''
  const [retry, setRetry] = useState(0)
  const [experimentState, setExperimentState] = useState<LoadState>('loading')
  const [experiments, setExperiments] = useState<MLStudioExperiment[]>([])
  const [experimentError, setExperimentError] = useState('')
  const [snapshot, setSnapshot] = useState<ModelEvaluationSnapshot | null>(null)
  const [evaluationRequestId, setEvaluationRequestId] = useState('')
  const [evaluationState, setEvaluationState] = useState<LoadState>('loading')
  const [evaluationError, setEvaluationError] = useState('')
  const [xAxis, setXAxis] = useState<ScatterAxis>('recency')
  const [yAxis, setYAxis] = useState<ScatterAxis>('frequency')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [comparisons, setComparisons] = useState<ModelEvaluationSnapshot[]>([])
  const [compareError, setCompareError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    service.getExperiments(controller.signal).then((items) => {
      const successful = items.filter((item) => item.status === 'succeeded')
      setExperiments(successful); setExperimentState('success')
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setExperimentError(error instanceof Error ? error.message : 'Experiment metadata could not be loaded.')
      setExperimentState(configError(error) ? 'unavailable' : 'error')
    })
    return () => controller.abort()
  }, [service, retry])

  const selectedId = requestedId || experiments[0]?.id || ''
  const selectedExists = experiments.some((item) => item.id === selectedId)
  useEffect(() => {
    if (experimentState !== 'success') return
    if (!requestedId && experiments[0]) setSearchParams({ experimentId: experiments[0].id }, { replace: true })
  }, [experimentState, experiments, requestedId, setSearchParams])

  useEffect(() => {
    if (experimentState !== 'success' || !selectedExists) return
    const controller = new AbortController()
    service.getEvaluation(selectedId, controller.signal).then((value) => { setSnapshot(value); setEvaluationRequestId(selectedId); setEvaluationState('success') }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setEvaluationRequestId(selectedId)
      setEvaluationError(error instanceof Error ? error.message : 'Evaluation results could not be loaded.')
      setEvaluationState(configError(error) ? 'unavailable' : 'error')
    })
    return () => controller.abort()
  }, [service, selectedId, selectedExists, experimentState, retry])

  const displaySnapshot = snapshot?.experiment.id === selectedId ? snapshot : null
  const visibleEvaluationState = evaluationRequestId === selectedId ? evaluationState : 'loading'
  useEffect(() => {
    if (!compareIds.length) return
    const controller = new AbortController()
    Promise.all(compareIds.map((id) => service.getEvaluation(id, controller.signal).catch((error: unknown) => ({ id, error })))).then((results) => {
      const loaded = results.filter((result): result is ModelEvaluationSnapshot => 'experiment' in result)
      const failed = results.filter((result): result is { id: string; error: unknown } => 'error' in result)
      setComparisons(loaded)
      setCompareError(failed.length ? `Evaluation unavailable for ${failed.map((item) => item.id).join(', ')}.` : '')
    })
    return () => controller.abort()
  }, [service, compareIds])

  const inconsistency = useMemo(() => {
    const versions = new Set(comparisons.map((item) => item.experiment.preprocessingVersion).filter(Boolean))
    const statistics = new Set(comparisons.flatMap((item) => item.clusters.map((cluster) => cluster.profile?.statistic).filter(Boolean)))
    return versions.size > 1 || statistics.size > 1
  }, [comparisons])
  const comparisonIncomplete = comparisons.some((item) => item.metrics.inertia == null || item.metrics.silhouette?.status !== 'valid' || item.clusters.length === 0 || item.clusters.some((cluster) => !cluster.profile || ['recency', 'frequency', 'monetary'].some((metric) => cluster.profile?.[metric as 'recency' | 'frequency' | 'monetary'] == null)))

  function chooseExperiment(id: string) { setEvaluationState('loading'); setEvaluationRequestId(''); setEvaluationError(''); setSnapshot(null); setComparisons([]); setCompareError(''); setSearchParams(id ? { experimentId: id } : {}, { replace: false }); setCompareIds([]) }
  function toggleCompare(id: string) { setComparisons([]); setCompareError(''); setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }
  function changeXAxis(value: ScatterAxis) { if (value === yAxis) setYAxis(xAxis); setXAxis(value) }
  function changeYAxis(value: ScatterAxis) { if (value === xAxis) setXAxis(yAxis); setYAxis(value) }
  function retryAll() { setExperimentState('loading'); setExperimentError(''); setExperiments([]); setEvaluationState('loading'); setEvaluationRequestId(''); setEvaluationError(''); setSnapshot(null); setRetry((value) => value + 1) }

  return <main className="page-content model-evaluation-page">
    <header className="page-heading evaluation-heading">
      <div><span className="eyebrow">MODEL WORKSPACE</span><h1>Model Evaluation</h1><p>Evaluasi kualitas clustering, pahami profil pelanggan, dan bandingkan eksperimen K-Means.</p></div>
      <Link className="button button-secondary" to={selectedExists ? `/ml-studio?experimentId=${encodeURIComponent(selectedId)}` : '/ml-studio'}><ArrowLeft size={16}/>{selectedExists ? 'Open selected experiment in ML Studio' : 'Back to ML Studio'}</Link>
    </header>

    {experimentState === 'loading' && <div className="evaluation-state" role="status">Loading experiment metadata…</div>}
    {(experimentState === 'error' || experimentState === 'unavailable') && <ErrorPanel message={experimentError || 'Experiment metadata could not be loaded.'} retry={retryAll}/>}
    {experimentState === 'success' && experiments.length === 0 && <section className="panel evaluation-empty"><CircleHelp aria-hidden="true"/><div><h2>No successful experiment is available</h2><p>Hasil evaluasi akan tersedia setelah eksperimen K-Means berhasil dijalankan dan backend terhubung.</p><Link to="/ml-studio">Open ML Studio</Link></div></section>}
    {experimentState === 'success' && experiments.length > 0 && <>
      <section className="panel evaluation-toolbar">
        <label htmlFor="evaluation-experiment">Experiment</label>
        <select id="evaluation-experiment" value={selectedExists ? selectedId : ''} onChange={(event) => chooseExperiment(event.target.value)}>
          <option value="" disabled>Select an experiment</option>
          {experiments.map((experiment) => <option key={experiment.id} value={experiment.id}>{experiment.id} · {formatDate(experiment.timestamp)} · K={experiment.k} · Succeeded</option>)}
        </select>
        <span className={`evaluation-source evaluation-source-${displaySnapshot ? 'success' : visibleEvaluationState}`} aria-live="polite"><span className="status-dot"/>{displaySnapshot ? 'Backend results loaded' : visibleEvaluationState === 'loading' ? 'Loading evaluation results' : visibleEvaluationState === 'unavailable' ? 'Backend unavailable' : 'Evaluation results unavailable'}</span>
      </section>
      {!selectedExists && <section className="panel evaluation-empty" role="status"><CircleHelp aria-hidden="true"/><div><h2>Experiment is unavailable</h2><p>The experiment ID in this link is not present in the successful experiment history.</p><button className="text-button" onClick={() => chooseExperiment(experiments[0].id)}>Show latest successful experiment</button></div></section>}
      {selectedExists && (visibleEvaluationState === 'loading' ? <div className="evaluation-state" role="status">Loading results for {selectedId}…</div> : null)}
      {selectedExists && (visibleEvaluationState === 'error' || visibleEvaluationState === 'unavailable') && <ErrorPanel message={evaluationError || 'Evaluation resource is not configured.'} retry={retryAll}/>}
      {selectedExists && displaySnapshot && <>
        <section className="panel evaluation-experiment-card">
          <div className="evaluation-section-title"><div><span className="eyebrow">SELECTED RUN</span><h2>Experiment summary</h2></div><span className="evaluation-run-status">Succeeded</span></div>
          <dl className="evaluation-metadata">
            <div><dt>Experiment ID</dt><dd>{displaySnapshot.experiment.id}</dd></div><div><dt>Timestamp</dt><dd>{formatDate(displaySnapshot.experiment.timestamp)}</dd></div><div><dt>K</dt><dd>{displaySnapshot.experiment.k}</dd></div><div><dt>Random seed</dt><dd>{number(displaySnapshot.experiment.randomSeed, 0)}</dd></div><div><dt>Preprocessing version</dt><dd>{displaySnapshot.experiment.preprocessingVersion || 'Not reported'}</dd></div><div><dt>Customers evaluated</dt><dd>{number(displaySnapshot.experiment.customersEvaluated, 0)}</dd></div>
          </dl>
        </section>
        <section className="evaluation-metric-grid" aria-label="Evaluation metrics">
          <article className="panel evaluation-metric"><div className="evaluation-metric-label">Inertia <span title="Inertia is the sum of squared distances from observations to their cluster centers in the reported feature space. It usually falls as K increases; do not use it alone to choose K."><Info size={14}/></span></div><strong>{number(displaySnapshot.metrics.inertia)}</strong><p>Sum of squared distances to cluster centers. It usually decreases as K increases and should not determine K alone.</p></article>
          <article className="panel evaluation-metric"><div className="evaluation-metric-label">Silhouette <span title="Silhouette helps assess how well each observation fits its own cluster compared with other clusters. Only a backend-validated score is shown."><Info size={14}/></span></div><strong>{displaySnapshot.metrics.silhouette?.status === 'valid' ? number(displaySnapshot.metrics.silhouette.value) : 'Unavailable'}</strong><p>{displaySnapshot.metrics.silhouette?.status === 'valid' ? 'Assesses fit with the assigned cluster compared with other clusters.' : displaySnapshot.metrics.silhouette?.reason || (displaySnapshot.metrics.silhouette?.status === 'invalid' ? 'The backend marked this score invalid.' : 'A valid score was not supplied.')}</p></article>
          <article className="panel evaluation-metric"><div className="evaluation-metric-label">Clusters</div><strong>{number(displaySnapshot.experiment.clusterCount, 0)}</strong><p>Reported for this completed run.</p></article>
          <article className="panel evaluation-metric"><div className="evaluation-metric-label">Customers evaluated</div><strong>{number(displaySnapshot.experiment.customersEvaluated, 0)}</strong><p>Must match the supplied cluster population.</p></article>
        </section>
        <section className="evaluation-two-column">
          <article className="panel evaluation-panel"><div className="evaluation-section-title"><div><h2>Cluster distribution</h2><p>Customer counts from this experiment.</p></div></div><ClusterDistributionChart snapshot={displaySnapshot}/><p className="evaluation-note">{displaySnapshot.clusters.length} reported clusters · {displaySnapshot.clusters.length ? `sizes range from ${Math.min(...displaySnapshot.clusters.map((cluster) => cluster.customerCount))} to ${Math.max(...displaySnapshot.clusters.map((cluster) => cluster.customerCount))} customers` : 'sizes unavailable'}. Percentages are shown as reported or derived from supplied counts and evaluated-customer total.</p></article>
          <article className="panel evaluation-panel"><div className="evaluation-section-title"><div><h2>Cluster profiles</h2><p>Backend-reported RFM summary by cluster.</p></div></div><div className="evaluation-table-wrap" role="region" aria-label="Cluster RFM profile table; scroll horizontally if needed" tabIndex={0}><table className="evaluation-table"><thead><tr><th>Cluster</th><th>Customers</th><th>Population</th><th>Statistic</th><th>Recency</th><th>Frequency</th><th>Monetary</th></tr></thead><tbody>{displaySnapshot.clusters.map((cluster) => <tr key={String(cluster.clusterId)}><th scope="row">{String(cluster.clusterId)}</th><td>{number(cluster.customerCount, 0)}</td><td>{cluster.percentage == null ? number(displaySnapshot.experiment.customersEvaluated ? cluster.customerCount / displaySnapshot.experiment.customersEvaluated * 100 : null, 1) + (displaySnapshot.experiment.customersEvaluated ? '%' : '') : `${number(cluster.percentage, 1)}%`}</td><td><span className="evaluation-statistic">{cluster.profile?.statistic || 'Not reported'}</span></td><td>{number(cluster.profile?.recency, 1)}</td><td>{number(cluster.profile?.frequency, 1)}</td><td>{number(cluster.profile?.monetary, 1)}{cluster.profile?.monetary != null && displaySnapshot.monetaryUnit ? ` ${displaySnapshot.monetaryUnit}` : ''}</td></tr>)}</tbody></table></div><p className="evaluation-note">Monetary is transaction value in the reported feature space, not profit. Values are {displaySnapshot.clusters.find((cluster) => cluster.profile)?.profile?.statistic || 'the backend-reported statistic'}.</p></article>
        </section>
        <section className="panel evaluation-panel"><div className="evaluation-section-title evaluation-scatter-title"><div><h2>Customer feature projection</h2><p>Each point is supplied by the backend; the browser does not create or sample customers.</p></div><div className="evaluation-axis-controls"><label>X axis<select aria-label="Scatter X axis" value={xAxis} onChange={(event) => changeXAxis(event.target.value as ScatterAxis)}>{axisOptions.map((axis) => <option value={axis.value} key={axis.value}>{axis.label}</option>)}</select></label><label>Y axis<select aria-label="Scatter Y axis" value={yAxis} onChange={(event) => changeYAxis(event.target.value as ScatterAxis)}>{axisOptions.map((axis) => <option value={axis.value} key={axis.value}>{axis.label}</option>)}</select></label></div></div><ClusterScatterChart snapshot={displaySnapshot} xAxis={xAxis} yAxis={yAxis}/></section>
        <section className="panel evaluation-panel evaluation-interpretation"><div className="evaluation-section-title"><div><h2>Interpretation &amp; Limitations</h2><p>Interpretation is limited to the supplied metrics and feature summaries.</p></div></div><div className="evaluation-observations">{profileObservations(displaySnapshot).length ? <><h3>Observed profile differences</h3><ul>{profileObservations(displaySnapshot).map((observation) => <li key={observation}>{observation}</li>)}</ul></> : <p>Comparable mean or median RFM values were not supplied across multiple clusters; read the reported profiles directly without inferring a ranking.</p>}</div><ul><li>Inertia alone cannot determine model quality or the appropriate K; it generally decreases as K grows.</li><li>Silhouette is shown only when its calculation is available and marked valid by the backend.</li><li>Clusters group observations using the supplied features and preprocessing; they are not definitive customer categories.</li><li>RFM profiles do not explain the causes of customer behavior. Monetary represents transaction value, not profit.</li><li>Clustering results do not prove that a marketing strategy will be effective.</li></ul></section>
        <section className="panel evaluation-panel evaluation-comparison"><div className="evaluation-section-title"><div><h2>Compare experiments</h2><p>Select completed runs to inspect their supplied configurations and results. This does not start or retrain an experiment.</p></div></div><div className="evaluation-compare-options">{experiments.map((experiment) => <label key={experiment.id}><input type="checkbox" aria-label={`Compare ${experiment.id}`} checked={compareIds.includes(experiment.id)} onChange={() => toggleCompare(experiment.id)}/><span>{experiment.id} · K={experiment.k}</span></label>)}</div>{compareError && <p className="evaluation-warning" role="status">{compareError}</p>}{inconsistency && <p className="evaluation-warning" role="status">Preprocessing versions or profile statistics differ. Compare metrics and profiles with care.</p>}{comparisons.length >= 2 && <><p className="evaluation-warning">Cluster IDs are arbitrary between runs; compare distributions and RFM profiles, not matching IDs. Inertia generally decreases as K increases and cannot determine the best K by itself.</p>{comparisonIncomplete && <p className="evaluation-warning" role="status">Some metrics or profile fields are missing or invalid. The comparison shows those values as unavailable and should be treated as incomplete.</p>}<div className="evaluation-table-wrap" role="region" aria-label="Experiment comparison table; scroll horizontally if needed" tabIndex={0}><table className="evaluation-table"><thead><tr><th>Experiment</th><th>Timestamp</th><th>K</th><th>Seed</th><th>Preprocessing</th><th>Inertia</th><th>Silhouette</th><th>Customers</th><th>Cluster sizes &amp; RFM profiles</th></tr></thead><tbody>{comparisons.map((item) => <tr key={item.experiment.id}><th scope="row">{item.experiment.id}</th><td>{formatDate(item.experiment.timestamp)}</td><td>{item.experiment.k}</td><td>{number(item.experiment.randomSeed, 0)}</td><td>{item.experiment.preprocessingVersion || 'Not reported'}</td><td>{number(item.metrics.inertia)}</td><td>{item.metrics.silhouette?.status === 'valid' ? number(item.metrics.silhouette.value) : item.metrics.silhouette?.status === 'invalid' ? 'Invalid' : 'Unavailable'}</td><td>{number(item.experiment.customersEvaluated, 0)}</td><td>{item.clusters.map((cluster) => `${cluster.clusterId}: ${cluster.customerCount} (${cluster.profile?.statistic || 'RFM unavailable'}${cluster.profile ? ` R ${number(cluster.profile.recency, 1)} · F ${number(cluster.profile.frequency, 1)} · M ${number(cluster.profile.monetary, 1)}` : ''})`).join(' · ') || 'Unavailable'}</td></tr>)}</tbody></table></div><div className="evaluation-compare-chart-title"><h3>Observed inertia by K</h3><p>Points are shown only for experiments with reported inertia.</p></div><InertiaComparisonChart evaluations={comparisons}/></>}{compareIds.length > 0 && comparisons.length < 2 && !compareError && <p className="evaluation-note">Select at least two experiments to compare their supplied results.</p>}</section>
      </>}
    </>}
  </main>
}
