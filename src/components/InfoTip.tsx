import { useId, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAnchoredPopup } from './ui/useAnchoredPopup'

export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, popupRef, popupStyle } = useAnchoredPopup(open, close, { matchWidth: false })
  return <span ref={(node) => { triggerRef.current = node }} className="info-tip" onPointerEnter={() => setOpen(true)} onPointerLeave={() => { if (!triggerRef.current?.contains(document.activeElement)) close() }} onFocus={() => setOpen(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close() }}><button className="info-tip-trigger" type="button" aria-label={label} aria-describedby={id}><Info size={16} aria-hidden="true"/></button>{open && createPortal(<div ref={popupRef} data-modal-portal="true" className="info-tip-tooltip" id={id} role="tooltip" style={popupStyle}>{children}</div>, document.body)}</span>
}
