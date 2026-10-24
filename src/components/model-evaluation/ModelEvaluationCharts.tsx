import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { EvaluationCluster, EvaluationPoint, ModelEvaluationSnapshot } from '../../types/modelEvaluation'
import { clusterColor } from './clusterPalette'

function clusterIndex(clusters: EvaluationCluster[], id: string | number): number {
  return clusters.findIndex((cluster) => cluster.clusterId === id)
}

function clusterLabel(id: string | number): string {
  return `Cluster ${id}`
}

export function ClusterDistributionChart({ snapshot }: { snapshot: ModelEvaluationSnapshot }) {
  const total = snapshot.experiment.customersEvaluated
  const data = snapshot.clusters.map((cluster) => ({
    ...cluster,
    label: clusterLabel(cluster.clusterId),
    displayPercentage: cluster.percentage ?? (total > 0 ? cluster.customerCount / total * 100 : null),
  }))

  return (
    <div className="evaluation-chart evaluation-distribution-chart" role="img" aria-label="Cluster distribution showing actual customer counts and population percentages">
      {data.length === 0 ? <p className="evaluation-chart-empty">Cluster distribution is unavailable in this evaluation.</p> : <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 12 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={38} />
          <Tooltip cursor={{ fill: 'var(--surface-muted)' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const cluster = payload[0].payload as typeof data[number]
            return <div className="chart-tooltip"><strong>{cluster.label}</strong><span>{new Intl.NumberFormat('id-ID').format(cluster.customerCount)} customers</span><span>{cluster.displayPercentage == null ? 'Percentage unavailable' : `${cluster.displayPercentage.toFixed(1)}% of evaluated customers`}</span></div>
          }} />
          <Bar dataKey="customerCount" name="Customers" radius={[5, 5, 0, 0]} isAnimationActive={false}>
            {data.map((cluster, index) => <Cell key={String(cluster.clusterId)} fill={clusterColor(index)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>}
    </div>
  )
}

const axes = {
  recency: { label: 'Recency', unit: 'days' },
  frequency: { label: 'Frequency', unit: 'invoices' },
  monetary: { label: 'Monetary', unit: 'transaction value' },
} as const

export type ScatterAxis = keyof typeof axes

function hasAxis(point: EvaluationPoint, axis: ScatterAxis): boolean {
  return typeof point[axis] === 'number' && Number.isFinite(point[axis])
}

export function ClusterScatterChart({ snapshot, xAxis, yAxis }: { snapshot: ModelEvaluationSnapshot; xAxis: ScatterAxis; yAxis: ScatterAxis }) {
  const points = (snapshot.points ?? []).filter((point) => hasAxis(point, xAxis) && hasAxis(point, yAxis))
  const xLabel = `${axes[xAxis].label} (${axes[xAxis].unit === 'transaction value' ? snapshot.monetaryUnit ?? axes[xAxis].unit : axes[xAxis].unit})`
  const yLabel = `${axes[yAxis].label} (${axes[yAxis].unit === 'transaction value' ? snapshot.monetaryUnit ?? axes[yAxis].unit : axes[yAxis].unit})`

  return (
    <div className="evaluation-chart evaluation-scatter-chart" role="group" aria-label={`Scatter chart of ${points.length} supplied customer points by ${xLabel} and ${yLabel}`}>
      {points.length === 0 ? <p className="evaluation-chart-empty">Individual customer points for these axes were not supplied. No points are generated in the browser.</p> : <>
      <div className="evaluation-scatter-plot"><ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 18, right: 14, bottom: 18, left: 18 }}>
          <CartesianGrid stroke="var(--chart-grid)" />
          <XAxis type="number" dataKey={xAxis} name={axes[xAxis].label} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--border-strong)' }} label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 10 }} />
          <YAxis type="number" dataKey={yAxis} name={axes[yAxis].label} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--border-strong)' }} width={52} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 10 }} />
          <Tooltip cursor={{ stroke: 'var(--chart-cursor)', strokeDasharray: '4 4' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const point = payload[0].payload as EvaluationPoint
            const cluster = snapshot.clusters[clusterIndex(snapshot.clusters, point.clusterId)]
            return <div className="chart-tooltip"><strong>{point.customerId}</strong><span>{axes[xAxis].label}: {point[xAxis]}</span><span>{axes[yAxis].label}: {point[yAxis]}</span><span>{clusterLabel(point.clusterId)}</span>{cluster && <span>{cluster.customerCount} customers in this cluster</span>}</div>
          }} />
          {snapshot.clusters.map((cluster, index) => <Scatter key={String(cluster.clusterId)} name={clusterLabel(cluster.clusterId)} data={points.filter((point) => point.clusterId === cluster.clusterId)} fill={clusterColor(index)} isAnimationActive={false} />)}
        </ScatterChart>
      </ResponsiveContainer></div>
      <ul className="evaluation-cluster-legend" aria-label="Cluster color legend">{snapshot.clusters.map((cluster, index) => <li key={String(cluster.clusterId)}><span aria-hidden="true" style={{ backgroundColor: clusterColor(index) }}/>{clusterLabel(cluster.clusterId)}</li>)}</ul>
      </>}
    </div>
  )
}

export function InertiaComparisonChart({ evaluations }: { evaluations: ModelEvaluationSnapshot[] }) {
  const data = evaluations.flatMap((evaluation) => evaluation.metrics.inertia == null ? [] : [{ id: evaluation.experiment.id, k: evaluation.experiment.k, inertia: evaluation.metrics.inertia }])
  if (data.length < 2) return null
  return (
    <div className="evaluation-chart evaluation-inertia-chart" role="img" aria-label="Observed inertia values plotted against requested K for compared experiments">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 14, bottom: 18, left: 12 }}>
          <CartesianGrid stroke="var(--chart-grid)" />
          <XAxis type="number" dataKey="k" name="K" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--border-strong)' }} label={{ value: 'Number of clusters (K)', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 10 }} />
          <YAxis type="number" dataKey="inertia" name="Inertia" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
          <Tooltip cursor={{ stroke: 'var(--chart-cursor)', strokeDasharray: '4 4' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const item = payload[0].payload as typeof data[number]
            return <div className="chart-tooltip"><strong>{item.id}</strong><span>K = {item.k}</span><span>Inertia: {item.inertia}</span></div>
          }} />
          <Scatter name="Experiment inertia" data={data} fill="var(--quality-violet)" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
