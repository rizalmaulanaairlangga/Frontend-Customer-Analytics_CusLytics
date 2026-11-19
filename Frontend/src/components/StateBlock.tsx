import type { ReactNode } from 'react'
import { AlertCircle, Database, Inbox, LoaderCircle } from 'lucide-react'

export type StateBlockKind = 'unavailable' | 'empty' | 'error' | 'loading'
const icons = { unavailable: Database, empty: Inbox, error: AlertCircle, loading: LoaderCircle }

export function StateBlock({ kind, title, detail, action, className = '' }: { kind: StateBlockKind; title: string; detail: string; action?: ReactNode; className?: string }) {
  const Icon = icons[kind]
  return <div className={`state-block state-block-${kind} ${className}`.trim()} role={kind === 'error' ? 'alert' : 'status'} aria-live={kind === 'error' ? 'assertive' : 'polite'}><span className="state-block-icon" aria-hidden="true"><Icon size={18}/></span><div className="state-block-copy"><strong>{title}</strong><p>{detail}</p>{action}</div></div>
}
