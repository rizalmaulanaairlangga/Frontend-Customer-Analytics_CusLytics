import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

let lastY: number | null = null

export function useNavIndicator(
  navRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
) {
  const { pathname } = useLocation()
  const animRef = useRef<Animation | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    const ind = indicatorRef.current
    if (!nav || !ind) return

    const active = nav.querySelector<HTMLElement>('[aria-current="page"], .sidebar__link--active')
    if (!active) {
      ind.style.opacity = '0'
      return
    }
    ind.style.opacity = '1'

    const rel = (el: HTMLElement) =>
      el.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop

    const toY = rel(active)
    ind.style.height = `${active.offsetHeight}px`

    let fromY = lastY ?? toY
    const previous = animRef.current
    if (previous) {
      fromY = rel(ind)
      previous.cancel()
      animRef.current = null
    }
    lastY = toY
    ind.style.transform = `translateY(${toY}px)`

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dist = toY - fromY
    if (reduce || Math.abs(dist) < 1) return

    const dir = Math.sign(dist)
    const over = toY + dir * Math.min(14, Math.max(8, Math.abs(dist) * 0.12))
    const anim = ind.animate([
      { transform: `translateY(${fromY}px)`, offset: 0, easing: 'cubic-bezier(.2,.75,.25,1)' },
      { transform: `translateY(${over}px)`, offset: 0.6, easing: 'cubic-bezier(.45,0,.25,1)' },
      { transform: `translateY(${toY}px)`, offset: 1 },
    ], { duration: 900 })
    animRef.current = anim
    const clear = () => {
      if (animRef.current === anim) animRef.current = null
    }
    anim.onfinish = clear
    anim.oncancel = clear
  }, [pathname, navRef, indicatorRef])

  useLayoutEffect(() => {
    const nav = navRef.current
    const ind = indicatorRef.current
    if (!nav || !ind || typeof ResizeObserver === 'undefined') return

    const ro = new ResizeObserver(() => {
      if (animRef.current) return
      const active = nav.querySelector<HTMLElement>('[aria-current="page"], .sidebar__link--active')
      if (!active) return
      const y = active.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop
      ind.style.height = `${active.offsetHeight}px`
      ind.style.transform = `translateY(${y}px)`
      lastY = y
    })
    ro.observe(nav)
    return () => ro.disconnect()
  }, [navRef, indicatorRef])
}
