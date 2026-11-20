import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ThemeContext, type ThemeMode } from './theme-context'
const themeStorageKey = 'cuslytics-theme'

function readInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(themeStorageKey)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // Browser storage can be unavailable; the document bootstrap remains the fallback.
  }
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function persistTheme(next: ThemeMode) {
  try { localStorage.setItem(themeStorageKey, next) } catch { /* Theme remains active for this session. */ }
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeMeta) themeMeta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)

  const applyTheme = useCallback((next: ThemeMode) => {
    const apply = () => {
      document.documentElement.dataset.theme = next
      flushSync(() => setTheme(next))
      persistTheme(next)
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const transitionDocument = document as Document & { startViewTransition?: (callback: () => void) => unknown }
    if (!transitionDocument.startViewTransition || reduce) { apply(); return }
    transitionDocument.startViewTransition(apply)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    persistTheme(theme)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme: () => applyTheme(theme === 'dark' ? 'light' : 'dark') }), [applyTheme, theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

