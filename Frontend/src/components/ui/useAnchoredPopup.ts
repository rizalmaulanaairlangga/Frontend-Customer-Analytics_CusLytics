import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export interface AnchoredPopupPosition {
  position: 'fixed'
  top?: number
  bottom?: number
  left: number
  minWidth: number
  maxWidth: string
  maxHeight: number
  overflowY: 'auto'
  visibility: 'hidden' | 'visible'
}

const defaultOptions = { matchWidth: true }

export function useAnchoredPopup(open: boolean, onClose: () => void, options: { matchWidth?: boolean } = defaultOptions) {
  const triggerRef = useRef<HTMLElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const initialStyle: AnchoredPopupPosition = { position: 'fixed', top: 0, left: 0, minWidth: 0, maxWidth: 'calc(100vw - 16px)', maxHeight: 100000, overflowY: 'auto', visibility: 'hidden' }
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const positionPopup = useCallback(() => {
    const trigger = triggerRef.current
    const popup = popupRef.current
    if (!trigger || !popup) return
    const triggerRect = trigger.getBoundingClientRect()
    const popupRect = popup.getBoundingClientRect()
    const viewportHeight = document.documentElement.clientHeight
    const viewportWidth = document.documentElement.clientWidth
    const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom)
    const spaceAbove = Math.max(0, triggerRect.top)
    const naturalHeight = Math.max(popup.offsetHeight, popup.scrollHeight, popupRect.height)
    const opensBelow = naturalHeight <= spaceBelow || spaceBelow >= spaceAbove
    const availableSpace = (opensBelow ? spaceBelow : spaceAbove) - 12
    const maxHeight = Math.max(0, availableSpace)
    const minWidth = options.matchWidth === false ? 0 : triggerRect.width
    const popupWidth = Math.max(popupRect.width, minWidth)
    const left = Math.min(Math.max(8, triggerRect.left), Math.max(8, viewportWidth - popupWidth - 8))
    popup.style.position = 'fixed'
    popup.style.top = opensBelow ? `${triggerRect.bottom + 6}px` : 'auto'
    popup.style.bottom = opensBelow ? 'auto' : `${viewportHeight - triggerRect.top + 6}px`
    popup.style.left = `${left}px`
    popup.style.minWidth = `${minWidth}px`
    popup.style.maxWidth = `${Math.max(0, viewportWidth - 16)}px`
    popup.style.maxHeight = `${maxHeight}px`
    popup.style.overflowY = 'auto'
    popup.style.visibility = 'visible'
  }, [options.matchWidth])

  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const popup = popupRef.current
    if (!trigger || !popup) return
    positionPopup()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) onCloseRef.current()
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current() }
    window.addEventListener('resize', positionPopup)
    document.addEventListener('scroll', positionPopup, true)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(positionPopup)
    observer?.observe(trigger)
    observer?.observe(popup)

    const modal = trigger.closest('.modal-dialog')
    let frame = 0
    if (modal) {
      frame = requestAnimationFrame(positionPopup)
      Promise.all(modal.getAnimations().map((animation) => animation.finished)).catch(() => {}).then(positionPopup)
    }
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('resize', positionPopup)
      document.removeEventListener('scroll', positionPopup, true)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, positionPopup])

  return { triggerRef, popupRef, popupStyle: initialStyle }
}
