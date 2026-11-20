import { useLayoutEffect, useState, type RefObject } from 'react'

export function useAfterReveal(ref: RefObject<HTMLElement | null>): boolean {
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    let active = true
    const finish = () => { if (active) setReady(true) }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return () => { active = false }
    }
    const reveal = ref.current?.closest('.reveal')
    const animations = reveal?.getAnimations().filter((animation) => animation.playState !== 'finished') ?? []
    if (!animations.length) {
      finish()
      return () => { active = false }
    }
    const timeout = window.setTimeout(finish, 1200)
    Promise.all(animations.map((animation) => animation.finished)).catch(() => {}).then(() => {
      window.clearTimeout(timeout)
      finish()
    })
    return () => { active = false; window.clearTimeout(timeout) }
  }, [ref])

  return ready
}
