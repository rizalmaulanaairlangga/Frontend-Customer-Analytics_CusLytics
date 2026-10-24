import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { DashboardSnapshot } from '../../types/analytics'

interface CustomerSummaryProps { summary: DashboardSnapshot['customerSummary'] }
const countFormat = new Intl.NumberFormat('en-GB')

export function CustomerSummary({ summary }: CustomerSummaryProps) {
  const rfmLabel = summary.rfmStatus === 'available' ? 'Available' : summary.rfmStatus === 'pending' ? 'Waiting for backend' : 'Not available'
  return (
    <section className="panel customer-panel" aria-labelledby="customer-title">
      <div className="panel-heading">
        <div><p className="eyebrow">Customer view</p><h2 id="customer-title">Customer summary</h2></div>
        <span className={`rfm-indicator rfm-${summary.rfmStatus}`} aria-hidden="true" />
      </div>
      <div className="customer-count">
        <strong>{summary.identifiedCustomers === null ? 'Unavailable' : countFormat.format(summary.identifiedCustomers)}</strong>
        <span>identified customers</span>
      </div>
      <div className="rfm-status-row"><span>RFM analytics</span><strong>{rfmLabel}</strong></div>
      {summary.rfmMessage && <p className="panel-subtitle">{summary.rfmMessage}</p>}
      <Link className="text-link" to="/customers">Customer Analytics <ArrowUpRight size={13} aria-hidden="true" /></Link>
    </section>
  )
}
