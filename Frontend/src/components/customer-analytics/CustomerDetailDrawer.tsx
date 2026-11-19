import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CustomerRfmRecord } from '../../types/customerAnalytics'
import { formatCurrency, formatNumber } from '../../utils/format'

function chartMotionAllowed() {
  return typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function formatValue(value: number | null | undefined, currencyCode?: string): string {
  if (value == null) return '—'
  try {
    return currencyCode ? formatCurrency(value, currencyCode) : formatNumber(value, { maximumFractionDigits: 2 })
  } catch {
    return formatNumber(value, { maximumFractionDigits: 2 })
  }
}

export function CustomerDetailDrawer({ customer, currencyCode, observationDate, analysisPeriod, onClose }: { customer: CustomerRfmRecord; currencyCode?: string; observationDate?: string; analysisPeriod?: { start: string; end: string }; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  const hasTrend = customer.history?.some((point) => typeof point.transactionValue === 'number' || typeof point.uniqueInvoices === 'number') ?? false
  const points = (customer.history ?? []).filter((point) => typeof point.transactionValue === 'number')

  return (
    <div className="customer-drawer-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="customer-drawer" role="dialog" aria-modal="true" aria-labelledby="customer-drawer-title" onKeyDown={(event) => {
        if (event.key === 'Escape') { event.stopPropagation(); onClose() }
        if (event.key === 'Tab') {
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
      }}>
        <header className="customer-drawer-header"><div><h2 id="customer-drawer-title">Customer {customer.customerId}</h2></div><button className="icon-button" type="button" aria-label="Close customer details" ref={closeRef} onClick={onClose}><X size={19} aria-hidden="true" /></button></header>
        <p className="customer-drawer-note">Ringkasan ini berdasarkan riwayat transaksi yang tersedia, bukan informasi demografis pelanggan.</p>
        <div className="customer-detail-metrics">
          <div className="customer-detail-metric rfm-recency"><span>Recency</span><strong>{customer.recency == null ? '—' : `${formatValue(customer.recency)} hari`}</strong></div>
          <div className="customer-detail-metric rfm-frequency"><span>Frequency</span><strong>{formatValue(customer.frequency)} faktur</strong></div>
          <div className="customer-detail-metric rfm-monetary"><span>Monetary</span><strong>{formatValue(customer.monetary, currencyCode)}</strong></div>
        </div>
        <dl className="customer-detail-list"><div><dt>Cluster</dt><dd>{customer.clusterLabel || 'Belum tersedia'}</dd></div><div><dt>Profile</dt><dd>{customer.profile || 'Belum tersedia'}</dd></div><div><dt>Tanggal observasi RFM</dt><dd>{observationDate || 'Belum tersedia'}</dd></div><div><dt>Periode perhitungan</dt><dd>{analysisPeriod ? `${analysisPeriod.start} — ${analysisPeriod.end}` : 'Belum tersedia'}</dd></div></dl>
        <section className="customer-history-panel" aria-labelledby="customer-history-title"><div className="panel-heading"><div><h3 id="customer-history-title">Transaction history</h3></div></div>
          {points.length ? <div className="customer-history-chart" role="img" aria-label={`Transaction value history for customer ${customer.customerId}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id="customerHistoryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.28}/><stop offset="100%" stopColor="var(--series-1)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 12 }} /><YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ background: 'var(--bg-raised)', borderColor: 'var(--border)', color: 'var(--text)' }} formatter={(value) => formatValue(Number(value), currencyCode)} /><Area type="monotone" dataKey="transactionValue" name="Transaction value" stroke="var(--series-1)" strokeWidth={2} fill="url(#customerHistoryFill)" dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} isAnimationActive={chartMotionAllowed()} animationDuration={700} animationEasing="ease-out" /></AreaChart></ResponsiveContainer></div> : hasTrend ? <ul className="customer-history-list">{customer.history?.map((point) => <li key={point.period}><span>{point.label}</span><span>{point.uniqueInvoices == null ? '—' : `${formatValue(point.uniqueInvoices)} faktur`}</span></li>)}</ul> : <p className="customer-history-empty">Riwayat transaksi belum tersedia dari sumber data.</p>}
        </section>
      </section>
    </div>
  )
}
