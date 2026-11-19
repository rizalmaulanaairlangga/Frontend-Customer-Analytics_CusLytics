import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CountryRank, ProductRank, TrendPoint } from '../../types/analytics'
import { formatCurrency, formatNumber } from '../../utils/format'
import { InfoTip } from '../InfoTip'

function chartMotionAllowed() {
  return typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type ProductMetric = 'salesValue' | 'unitsSold'
export type TrendMetric = 'uniqueInvoices' | 'unitsSold'

function formatValue(value: number, currencyCode?: string): string {
  return currencyCode
    ? formatCurrency(value, currencyCode)
    : formatNumber(value, { maximumFractionDigits: 0 })
}

function RankingRows<T extends { id: string; label: string; value: number }>({
  items, accent, selectedId, onSelect, format,
}: {
  items: T[]; accent: 'violet' | 'coral'; selectedId?: string; onSelect: (id: string) => void; format: (value: number) => string
}) {
  const maxValue = Math.max(1, ...items.map((item) => Math.abs(item.value)))
  if (!items.length) return null

  return (
    <ol className={`intelligence-ranks rank-${accent}`}>
      {items.map((item, index) => (
        <li key={item.id}>
          <button className={`intelligence-rank${selectedId === item.id ? ' is-selected' : ''}`} type="button" onClick={() => onSelect(item.id)} title={`${item.label}: ${format(item.value)}`} aria-pressed={selectedId === item.id}>
            <span className="intelligence-rank-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="intelligence-rank-main"><span className="intelligence-rank-label">{item.label}</span><span className="intelligence-rank-track"><span style={{ width: `${Math.max(2, Math.abs(item.value) / maxValue * 100)}%`, animationDelay: `${index * 40}ms` }} /></span></span>
            <strong className="intelligence-rank-value">{format(item.value)}</strong>
          </button>
        </li>
      ))}
    </ol>
  )
}

export function ProductRanking({
  products, metric, count, currencyCode, selectedId, onMetricChange, onCountChange, onSelect,
}: {
  products: ProductRank[]; metric: ProductMetric; count: 5 | 10; currencyCode?: string; selectedId?: string
  onMetricChange: (metric: ProductMetric) => void; onCountChange: (count: 5 | 10) => void; onSelect: (id: string) => void
}) {
  const ranked = [...products].sort((a, b) => b[metric] - a[metric]).slice(0, count)
  return (
    <section className="panel intelligence-panel" aria-labelledby="product-ranking-title">
      <div className="panel-heading intelligence-panel-heading">
        <div><h2 id="product-ranking-title">Product ranking</h2><InfoTip label="Transaction value information">Transaction value is not profit.</InfoTip></div>
        <div className="intelligence-controls">
          <div className="segmented-control" role="group" aria-label="Product ranking metric">
            <button type="button" aria-pressed={metric === 'salesValue'} onClick={() => onMetricChange('salesValue')}>Transaction Value</button>
            <button type="button" aria-pressed={metric === 'unitsSold'} onClick={() => onMetricChange('unitsSold')}>Units Sold</button>
          </div>
          <label className="compact-select"><span className="sr-only">Products in ranking</span><select value={count} onChange={(event) => onCountChange(Number(event.target.value) as 5 | 10)}><option value={5}>Top 5</option><option value={10}>Top 10</option></select></label>
        </div>
      </div>
      <p className="panel-subtitle">Pilih produk untuk memfilter baris tabel.</p>
      {ranked.length ? <RankingRows items={ranked.map((product) => ({ id: product.productId, label: `${product.productId} · ${product.description}`, value: product[metric] }))} accent="violet" selectedId={selectedId} onSelect={onSelect} format={(value) => metric === 'salesValue' ? formatValue(value, currencyCode) : formatValue(value)} /> : <p className="intelligence-empty">Product ranking is not available for this filter.</p>}
    </section>
  )
}

export function CountryRanking({ countries, currencyCode, selectedCountry, onSelect }: {
  countries?: CountryRank[]; currencyCode?: string; selectedCountry: string; onSelect: (country: string) => void
}) {
  const ranked = [...(countries ?? [])].sort((a, b) => b.transactionValue - a.transactionValue)
  return (
    <section className="panel country-panel" aria-labelledby="country-ranking-title">
      <div className="panel-heading"><div><h2 id="country-ranking-title">Sales by Country</h2><InfoTip label="Transaction value information">Transaction value is not profit.</InfoTip></div></div>
      <p className="panel-subtitle">Ranked by transaction value.</p>
      {ranked.length ? <RankingRows items={ranked.map((item) => ({ id: item.country, label: `${item.country}${item.uniqueInvoices == null ? '' : ` · ${formatValue(item.uniqueInvoices)} invoices`}`, value: item.transactionValue }))} accent="coral" selectedId={selectedCountry || undefined} onSelect={onSelect} format={(value) => formatValue(value, currencyCode)} /> : <p className="intelligence-empty">Country aggregates are not available from the connected source.</p>}
    </section>
  )
}

export function InvoiceUnitsTrend({ data, metric, onMetricChange }: {
  data: TrendPoint[]; metric: TrendMetric; onMetricChange: (metric: TrendMetric) => void
}) {
  const available = data.length > 0 && data.every((point) => typeof point[metric] === 'number' && Number.isFinite(point[metric]))
  const title = metric === 'uniqueInvoices' ? 'Invoice trend' : 'Units trend'
  return (
    <section className="panel aux-trend-panel" aria-labelledby="invoice-units-title" aria-label="Invoice and units trend">
      <div className="panel-heading trend-heading">
        <div><h2 id="invoice-units-title">Invoice &amp; Units Trend</h2></div>
        <label className="compact-select"><span className="sr-only">Show invoice or unit trend</span><select value={metric} onChange={(event) => onMetricChange(event.target.value as TrendMetric)}><option value="uniqueInvoices">Unique invoices</option><option value="unitsSold">Units sold</option></select></label>
      </div>
      <div className="chart-legend"><span className={`legend-swatch ${metric === 'uniqueInvoices' ? 'legend-indigo' : 'legend-teal'}`} />{metric === 'uniqueInvoices' ? 'Unique invoices' : 'Units sold'}</div>
      <div className="trend-chart auxiliary-trend-chart" aria-label={`${title} chart`}>
        {!available ? <p className="chart-empty">{metric === 'uniqueInvoices' ? 'Invoice trend is not available from the connected source.' : 'Units trend is not available from the connected source.'}</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 12 }}>
              <defs><linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={metric === 'uniqueInvoices' ? 'var(--series-2)' : 'var(--series-1)'} stopOpacity={0.28} /><stop offset="100%" stopColor={metric === 'uniqueInvoices' ? 'var(--series-2)' : 'var(--series-1)'} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickMargin={12} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={48} />
              <Tooltip cursor={{ stroke: 'var(--chart-cursor)', strokeDasharray: '4 4' }} content={({ active, payload, label }) => active && payload?.length ? <div className="chart-tooltip"><span>{label}</span><strong>{formatNumber(Number(payload[0].value))} {metric === 'uniqueInvoices' ? 'invoices' : 'units'}</strong></div> : null} />
              <Area type="monotone" dataKey={metric} name={metric === 'uniqueInvoices' ? 'Unique invoices' : 'Units sold'} stroke={metric === 'uniqueInvoices' ? 'var(--series-2)' : 'var(--series-1)'} strokeWidth={2} fill="url(#volumeFill)" dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} isAnimationActive={chartMotionAllowed()} animationDuration={700} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {available && <ul className="sr-only" aria-label={`${title} values`}>{data.map((point) => <li key={point.period}>{point.label}: {formatNumber(point[metric] as number)} {metric === 'uniqueInvoices' ? 'invoices' : 'units'}</li>)}</ul>}
    </section>
  )
}
