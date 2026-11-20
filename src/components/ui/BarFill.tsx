import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { useAfterReveal } from '../../hooks/useAfterReveal'

export function BarFill({ color, itemId, metricKey, ratio, index = 0, label }: { color: string; itemId: string | number; metricKey: string; ratio: number; index?: number; label?: string }) {
  const trackRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const ready = useAfterReveal(trackRef)
  const pct = Math.max(0, Math.min(100, ratio * 100))
  useLayoutEffect(() => {
    const el = fillRef.current
    if (!el) return
    if (!ready) { el.style.width = '0%'; return }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { el.style.width = `${pct}%`; return }
    const animation = el.animate([{ width: '0%' }, { width: `${pct}%` }], { duration: 700, delay: index * 50, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' })
    return () => animation.cancel()
  }, [ready, pct, metricKey, itemId, index])
  return <span ref={trackRef} className="bar-fill-track" aria-hidden="true"><span ref={fillRef} className="bar-fill-value" style={{ width: ready ? `${pct}%` : '0%', backgroundColor: color } as CSSProperties} title={label} /></span>
}
