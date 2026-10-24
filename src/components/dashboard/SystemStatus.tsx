import type { DashboardSnapshot } from '../../types/analytics'

interface SystemStatusProps { status: DashboardSnapshot['status'] }

function StatusValue({ value }: { value?: string }) {
  return <span className={value ? 'system-value' : 'system-value system-muted'}>{value ?? 'Not reported'}</span>
}

export function SystemStatus({ status }: SystemStatusProps) {
  return (
    <section className="system-status" aria-labelledby="system-status-title">
      <div className="system-heading"><div><p className="eyebrow">Environment</p><h2 id="system-status-title">System status</h2></div>
        <p>Status is shown only when provided by the selected data source.</p></div>
      <div className="system-grid">
        <div><span>Dataset</span><StatusValue value={status.dataset} /></div>
        <div><span>Processing</span><StatusValue value={status.processing} /></div>
        <div><span>Last processed</span><StatusValue value={status.lastProcessedAt} /></div>
        <div><span>Latest experiment</span><StatusValue value={status.lastExperiment} /></div>
      </div>
    </section>
  )
}
