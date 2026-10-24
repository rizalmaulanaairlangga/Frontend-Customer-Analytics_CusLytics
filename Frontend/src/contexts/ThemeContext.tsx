import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './theme-context'
const themeStorageKey = 'cuslytics-theme'

function readInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(themeStorageKey)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // Browser storage can be unavailable; the document bootstrap remains the fallback.
  }
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Theme remains active for this session even when storage is blocked.
    }
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#0d1524' : '#f5f7fa'
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

