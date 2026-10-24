export function LoadingState() {
  return (
    <div className="loading-dashboard" aria-label="Loading dashboard" role="status">
      <span className="sr-only">Loading dashboard data</span>
      <div className="skeleton skeleton-kpi" />
      <div className="skeleton skeleton-chart" />
      <div className="skeleton skeleton-panel" />
    </div>
  )
}
