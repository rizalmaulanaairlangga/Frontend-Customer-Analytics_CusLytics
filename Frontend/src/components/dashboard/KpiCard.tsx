import type { ReactNode } from 'react'
import { BarChart3, Package, Receipt, UsersRound } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/format'
import { InfoTip } from '../InfoTip'
import { getMetricColor } from '../../constants/metricColors'
import { CountUp } from '../ui/CountUp'

interface KpiCardProps {
  label: string
  value: number | null
  definition: string
  icon: ReactNode
  format?: (value: number) => string
  currencyCode?: string
  metricKey?: string
}

export function KpiCard({ label, value, definition, icon, format, currencyCode, metricKey = 'salesValue' }: KpiCardProps) {
  const valueFormat = format ?? (currencyCode
    ? (number: number) => formatCurrency(number, currencyCode)
    : (number: number) => formatNumber(number, { maximumFractionDigits: 2 }))
  return (
    <article className="kpi-card" aria-label={`${label}: ${value === null ? 'Not available' : valueFormat(value)}`}>
      <div className="kpi-heading">
        <span className="kpi-icon" aria-hidden="true" style={{ color: getMetricColor(metricKey) }}>{icon}</span>
        <span className="kpi-label">{label}</span><InfoTip label={`${label} information`}>{definition}</InfoTip>
      </div>
      <p className={`kpi-value${value === null ? ' is-unavailable' : ''}`}>{value === null ? '—' : <CountUp value={value} format={valueFormat} />}</p>
    </article>
  )
}

export function MetricIcon({ kind }: { kind: 'sales' | 'invoice' | 'units' | 'customers' }) {
  const icons = { sales: BarChart3, invoice: Receipt, units: Package, customers: UsersRound }
  const Icon = icons[kind]
  return <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
}
