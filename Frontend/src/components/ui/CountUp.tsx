import { useEffect, useRef, useState } from 'react'
import { formatNumber } from '../../utils/format'
import { useAfterReveal } from '../../hooks/useAfterReveal'

export function CountUp({ value, format = formatNumber, duration = 1400 }: { value: number; format?: (value: number) => string; duration?: number }) {
  const elementRef = useRef<HTMLSpanElement>(null)
  const currentRef = useRef(0)
  const shownRef = useRef(false)
  const formatRef = useRef(format)
  const [current, setCurrent] = useState(0)
  const ready = useAfterReveal(elementRef)
  formatRef.current = format
  const reducedMotion = typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  useEffect(() => {
    if (!ready) return
    if (reducedMotion) {
      currentRef.current = value
      setCurrent(value)
      shownRef.current = true
      return
    }
    const from = currentRef.current
    const firstAnimation = !shownRef.current
    const animationDuration = firstAnimation ? duration : 800
    if (from === value || animationDuration <= 0) {
      currentRef.current = value
      setCurrent(value)
      shownRef.current = true
      return
    }
    const baseValue = String(value).toLowerCase().split('e')[0]
    const exponent = Number(String(value).toLowerCase().split('e')[1] ?? 0)
    const precision = Math.min(12, Math.max(baseValue.split('.')[1]?.length ?? 0, exponent < 0 ? -exponent : 0))
    const factor = 10 ** precision
    let startTime: number | undefined
    let frame = 0
    const animate = (timestamp: number) => {
      shownRef.current = true
      startTime ??= timestamp
      const t = Math.min(1, (timestamp - startTime) / animationDuration)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      const next = t === 1 ? value : Math.round((from + (value - from) * eased) * factor) / factor
      currentRef.current = next
      setCurrent(next)
      if (t < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [ready, value, duration, reducedMotion])

  const shownValue = reducedMotion ? value : current
  return <span ref={elementRef} className="count-up"><span aria-hidden="true">{formatRef.current(shownValue)}</span><span className="sr-only">{formatRef.current(value)}</span></span>
}
