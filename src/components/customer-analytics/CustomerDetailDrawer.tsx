import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CustomerRfmRecord } from '../../types/customerAnalytics'

function formatValue(value: number | null | undefined, currencyCode?: string): string {
  if (value == null) return '—'
  try {
    return new Intl.NumberFormat('id-ID', currencyCode ? { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }).format(value)
  } catch {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)
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
        <header className="customer-drawer-header"><div><p className="eyebrow">Transaction history</p><h2 id="customer-drawer-title">Customer {customer.customerId}</h2></div><button className="icon-button" type="button" aria-label="Close customer details" ref={closeRef} onClick={onClose}><X size={19} aria-hidden="true" /></button></header>
        <p className="customer-drawer-note">Ringkasan ini berdasarkan riwayat transaksi yang tersedia, bukan informasi demografis pelanggan.</p>
        <div className="customer-detail-metrics">
          <div className="customer-detail-metric rfm-recency"><span>Recency</span><strong>{customer.recency == null ? '—' : `${formatValue(customer.recency)} hari`}</strong></div>
          <div className="customer-detail-metric rfm-frequency"><span>Frequency</span><strong>{formatValue(customer.frequency)} faktur</strong></div>
          <div className="customer-detail-metric rfm-monetary"><span>Monetary</span><strong>{formatValue(customer.monetary, currencyCode)}</strong></div>
        </div>
        <dl className="customer-detail-list"><div><dt>Cluster</dt><dd>{customer.clusterLabel || 'Belum tersedia'}</dd></div><div><dt>Profile</dt><dd>{customer.profile || 'Belum tersedia'}</dd></div><div><dt>Tanggal observasi RFM</dt><dd>{observationDate || 'Belum tersedia'}</dd></div><div><dt>Periode perhitungan</dt><dd>{analysisPeriod ? `${analysisPeriod.start} — ${analysisPeriod.end}` : 'Belum tersedia'}</dd></div></dl>
        <section className="customer-history-panel" aria-labelledby="customer-history-title"><div className="panel-heading"><div><p className="eyebrow">Available source history</p><h3 id="customer-history-title">Transaction history</h3></div></div>
          {points.length ? <div className="customer-history-chart" role="img" aria-label={`Transaction value history for customer ${customer.customerId}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" /><XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 10 }} /><YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} formatter={(value) => formatValue(Number(value), currencyCode)} /><Area type="monotone" dataKey="transactionValue" name="Transaction value" stroke="var(--blue-500)" fill="var(--blue-100)" /></AreaChart></ResponsiveContainer></div> : hasTrend ? <ul className="customer-history-list">{customer.history?.map((point) => <li key={point.period}><span>{point.label}</span><span>{point.uniqueInvoices == null ? '—' : `${formatValue(point.uniqueInvoices)} faktur`}</span></li>)}</ul> : <p className="customer-history-empty">Riwayat transaksi belum tersedia dari sumber data.</p>}
        </section>
      </section>
    </div>
  )
}
