import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { rfmMetrics, type CustomerAnalyticsSnapshot, type RfmMetric } from '../../types/customerAnalytics'

const metricLabels: Record<RfmMetric, string> = { recency: 'Recency', frequency: 'Frequency', monetary: 'Monetary' }
const units: Record<RfmMetric, string> = { recency: 'hari', frequency: 'faktur unik', monetary: 'nilai transaksi' }
const accents: Record<RfmMetric, string> = { recency: 'var(--rfm-recency)', frequency: 'var(--rfm-frequency)', monetary: 'var(--rfm-monetary)' }

function DistributionTooltip({ active, payload, metric }: { active?: boolean; payload?: Array<{ payload?: { label: string; count: number } }>; metric: RfmMetric }) {
  const bin = payload?.[0]?.payload
  if (!active || !bin) return null
  return <div className="chart-tooltip"><strong>{bin.label}</strong><span>{metricLabels[metric]} ({units[metric]}) · {bin.count} observasi</span></div>
}

function CustomerTooltip({ active, payload, xMetric, yMetric }: { active?: boolean; payload?: Array<{ payload?: { customerId: string; xValue: number; yValue: number } }>; xMetric: RfmMetric; yMetric: RfmMetric }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return <div className="chart-tooltip"><strong>Customer ID: {point.customerId}</strong><span>{metricLabels[xMetric]}: {point.xValue} {units[xMetric]}</span><span>{metricLabels[yMetric]}: {point.yValue} {units[yMetric]}</span></div>
}

export function CustomerAnalyticsCharts({ snapshot }: { snapshot: CustomerAnalyticsSnapshot | null }) {
  const [metric, setMetric] = useState<RfmMetric>('recency')
  const [xMetric, setXMetric] = useState<RfmMetric>('recency')
  const [yMetric, setYMetric] = useState<RfmMetric>('monetary')
  const bins = snapshot?.distributions?.[metric] ?? []
  const points = (snapshot?.customers ?? []).flatMap((customer) => {
    const x = customer[xMetric]
    const y = customer[yMetric]
    return typeof x === 'number' && typeof y === 'number' ? [{ customerId: customer.customerId, x, y, xValue: x, yValue: y }] : []
  })
  const chooseX = (next: RfmMetric) => { setXMetric(next); if (next === yMetric) setYMetric(xMetric) }
  const chooseY = (next: RfmMetric) => { setYMetric(next); if (next === xMetric) setXMetric(yMetric) }

  return (
    <section className="customer-explorer" aria-labelledby="rfm-explorer-title">
      <div className="customer-section-heading"><div><p className="eyebrow">RFM exploration</p><h2 id="rfm-explorer-title">RFM Explorer</h2><p>Profil RFM merangkum riwayat transaksi. Ini bukan hasil segmentasi K-Means.</p></div></div>
      <div className="rfm-definition-grid">
        <article className="rfm-definition rfm-recency"><span className="rfm-definition-label">Recency</span><p>Jumlah hari antara tanggal observasi yang ditetapkan dan pembelian terakhir pelanggan yang memenuhi syarat. Nilai lebih rendah berarti pembelian lebih baru.</p><small>Tanggal observasi berasal dari sumber data.</small></article>
        <article className="rfm-definition rfm-frequency"><span className="rfm-definition-label">Frequency</span><p>Jumlah faktur unik yang memenuhi syarat untuk pelanggan dalam periode yang ditentukan, bukan jumlah baris transaksi.</p><small>Periode hanya ditampilkan jika sumber menyediakannya.</small></article>
        <article className="rfm-definition rfm-monetary"><span className="rfm-definition-label">Monetary</span><p>Jumlah nilai transaksi yang memenuhi syarat untuk pelanggan dalam periode yang ditentukan. Monetary bukan laba atau profit.</p><small>Nilai transaksi historis tidak selalu berarti laba lebih besar.</small></article>
      </div>
      <div className="customer-chart-grid">
        <section className="panel customer-chart-panel" aria-labelledby="rfm-distribution-title">
          <div className="panel-heading"><div><p className="eyebrow">Supplied distribution</p><h3 id="rfm-distribution-title">RFM Distribution</h3></div><label className="compact-select"><span className="sr-only">Distribution metric</span><select aria-label="Distribution metric" value={metric} onChange={(event) => setMetric(event.target.value as RfmMetric)}>{rfmMetrics.map((name) => <option value={name} key={name}>{metricLabels[name]}</option>)}</select></label></div>
          <p className="panel-subtitle">Jumlah observasi per rentang sesuai bin yang dikirim sumber.</p>
          {bins.length ? <><div className="customer-chart" role="img" aria-label={`${metricLabels[metric]} distribution, count of observations`}><ResponsiveContainer width="100%" height="100%"><BarChart data={bins} margin={{ top: 14, right: 12, left: -10, bottom: 4 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip content={<DistributionTooltip metric={metric} />} /><Bar dataKey="count" name="Observations" fill={accents[metric]} radius={[5, 5, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer></div><ul className="sr-only" aria-label="Distribution bins">{bins.map((bin) => <li key={bin.label}>{bin.label}: {bin.count} observations</li>)}</ul></> : <p className="customer-chart-empty">Distribution data for {metricLabels[metric]} is not available from the connected source.</p>}
        </section>
        <section className="panel customer-chart-panel" aria-labelledby="rfm-scatter-title">
          <div className="panel-heading"><div><p className="eyebrow">Customer-level observations</p><h3 id="rfm-scatter-title">RFM Comparison</h3></div></div>
          <div className="customer-axis-controls"><label className="compact-select"><span>Sumbu X</span><select aria-label="Scatter X axis" value={xMetric} onChange={(event) => chooseX(event.target.value as RfmMetric)}>{rfmMetrics.map((name) => <option value={name} key={name}>{metricLabels[name]}</option>)}</select></label><label className="compact-select"><span>Sumbu Y</span><select aria-label="Scatter Y axis" value={yMetric} onChange={(event) => chooseY(event.target.value as RfmMetric)}>{rfmMetrics.map((name) => <option value={name} key={name} disabled={name === xMetric}>{metricLabels[name]}</option>)}</select></label></div>
          {points.length ? <div className="customer-chart" role="img" aria-label={`${metricLabels[xMetric]} compared with ${metricLabels[yMetric]} for each customer`}><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 14, right: 12, left: 4, bottom: 10 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" /><XAxis type="number" dataKey="x" name={metricLabels[xMetric]} stroke="var(--text-muted)" tick={{ fontSize: 10 }} /><YAxis type="number" dataKey="y" name={metricLabels[yMetric]} stroke="var(--text-muted)" tick={{ fontSize: 10 }} /><Tooltip content={<CustomerTooltip xMetric={xMetric} yMetric={yMetric} />} /><Scatter name="Customers" data={points} fill="var(--quality-teal)" fillOpacity={0.76} /></ScatterChart></ResponsiveContainer></div> : <p className="customer-chart-empty">Customer points are not available for these RFM dimensions.</p>}
        </section>
      </div>
    </section>
  )
}
