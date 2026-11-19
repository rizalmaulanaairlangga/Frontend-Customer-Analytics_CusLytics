import { useId, type ReactNode } from 'react'
import { Info } from 'lucide-react'

export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return <span className="info-tip"><button className="info-tip-trigger" type="button" aria-label={label} aria-describedby={id}><Info size={15} aria-hidden="true"/></button><span className="info-tip-tooltip" id={id} role="tooltip">{children}</span></span>
}
