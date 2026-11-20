import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'

type Severity = 'info' | 'success' | 'warning' | 'danger'
const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert }

export function NoticeBanner({ severity, children, className = '' }: { severity: Severity; children: ReactNode; className?: string }) {
  const Icon = icons[severity]
  return <div className={`notice-banner notice-${severity} ${className}`.trim()} role={severity === 'danger' ? 'alert' : 'status'}><Icon size={18} aria-hidden="true"/><div>{children}</div></div>
}
