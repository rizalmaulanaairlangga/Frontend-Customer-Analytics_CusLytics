import type { ReactNode } from 'react'
import { BarChart3, Package, Receipt, UsersRound } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/format'

interface KpiCardProps {
  label: string
  value: number | null
  definition: string
  icon: ReactNode
  format?: (value: number) => string
  currencyCode?: string
}

export function KpiCard({ label, value, definition, icon, format, currencyCode }: KpiCardProps) {
  const valueFormat = format ?? (currencyCode
    ? (number: number) => formatCurrency(number, currencyCode)
    : (number: number) => formatNumber(number, { maximumFractionDigits: 2 }))
  return (
    <article className="kpi-card" aria-label={`${label}: ${value === null ? 'Not available' : valueFormat(value)}`}>
      <div className="kpi-heading">
        <span className="kpi-icon" aria-hidden="true">{icon}</span>
        <span className="kpi-label" title={definition}>{label}</span>
      </div>
      <p className="kpi-value">{value === null ? 'Not available' : valueFormat(value)}</p>
      <p className="kpi-definition">{definition}</p>
    </article>
  )
}

export function MetricIcon({ kind }: { kind: 'sales' | 'invoice' | 'units' | 'customers' }) {
  const icons = { sales: BarChart3, invoice: Receipt, units: Package, customers: UsersRound }
  const Icon = icons[kind]
  return <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
}
