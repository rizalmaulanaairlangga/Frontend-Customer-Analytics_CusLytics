import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { DashboardSnapshot } from '../../types/analytics'
import { formatNumber } from '../../utils/format'
import { InfoTip } from '../InfoTip'
import { CountUp } from '../ui/CountUp'

interface CustomerSummaryProps { summary: DashboardSnapshot['customerSummary'] }

export function CustomerSummary({ summary }: CustomerSummaryProps) {
  const rfmLabel = summary.rfmStatus === 'available' ? 'Available' : summary.rfmStatus === 'pending' ? 'Waiting for backend' : 'Not available'
  return (
    <section className="panel customer-panel" aria-labelledby="customer-title">
      <div className="panel-heading">
        <div><h2 id="customer-title">Customer summary</h2></div>
      </div>
      <div className="customer-count">
        <strong>{summary.identifiedCustomers === null ? <span aria-label="Customer count not available">—</span> : <CountUp value={summary.identifiedCustomers} format={(value) => formatNumber(value, { maximumFractionDigits: 0 })} />}</strong>
        <span>identified customers</span>
      </div>
      <div className="rfm-status-row"><span>RFM analytics</span><strong>{rfmLabel}</strong></div>
      {summary.rfmMessage && <InfoTip label="RFM analytics information">{summary.rfmMessage}</InfoTip>}
      <Link className="text-link" to="/customers">Customer Analytics <ArrowUpRight size={13} aria-hidden="true" /></Link>
    </section>
  )
}
