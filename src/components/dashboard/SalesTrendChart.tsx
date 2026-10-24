import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { DateInterval, TrendPoint } from '../../types/analytics'

interface SalesTrendChartProps {
  data: TrendPoint[]
  interval: DateInterval
  onIntervalChange: (interval: DateInterval) => void
  currencyCode?: string
  showIntervalControls?: boolean
}

const formatValue = (value: number, currencyCode?: string) => currencyCode
  ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(value)
  : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value)

export function SalesTrendChart({ data, interval, onIntervalChange, currencyCode, showIntervalControls = true }: SalesTrendChartProps) {
  return (
    <section className="panel trend-panel" aria-labelledby="trend-title">
      <div className="panel-heading trend-heading">
        <div>
          <p className="eyebrow">Sales activity</p>
          <h2 id="trend-title">Sales trend</h2>
          <p className="panel-subtitle">Transaction value across the selected period</p>
        </div>
        {showIntervalControls && <div className="segmented-control" role="group" aria-label="Trend interval">
          {(['day', 'week', 'month'] as const).map((item) => (
            <button key={item} type="button" aria-pressed={interval === item} onClick={() => onIntervalChange(item)}>
              {item === 'day' ? 'Daily' : item === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>}
      </div>
      <div className="chart-legend"><span className="legend-swatch" /> Sales value</div>
      <div className="trend-chart" aria-label="Sales value trend chart">
        {data.length === 0 ? <p className="chart-empty">No trend points are available for these filters.</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
              <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--blue-500)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--blue-500)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickMargin={12} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => formatValue(Number(value), currencyCode)} width={currencyCode ? 68 : 48} />
              <Tooltip
                cursor={{ stroke: 'var(--chart-cursor)', strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return <div className="chart-tooltip"><span>{label}</span><strong>{formatValue(Number(payload[0].value ?? 0), currencyCode)}</strong></div>
                }}
              />
              <Area type="monotone" dataKey="salesValue" name="Sales value" stroke="var(--blue-500)" strokeWidth={2.5} fill="url(#salesFill)" activeDot={{ r: 5, fill: 'var(--blue-500)', stroke: 'var(--surface)', strokeWidth: 2 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="chart-accessible-summary">{data.length} {interval} periods shown. Hover a point for its period value.</p>
      <ul className="sr-only" aria-label="Sales trend values">
        {data.map((point) => <li key={point.period}>{point.label}: {formatValue(point.salesValue, currencyCode)}</li>)}
      </ul>
    </section>
  )
}
