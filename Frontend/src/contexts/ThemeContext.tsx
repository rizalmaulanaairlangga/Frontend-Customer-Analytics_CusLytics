import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Theme remains active for this session even when storage is blocked.
    }
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (themeMeta) themeMeta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim()
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

