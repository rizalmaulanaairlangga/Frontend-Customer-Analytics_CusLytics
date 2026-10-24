import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpenForPath, setMobileOpenForPath] = useState<string | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wasMobileOpen = useRef(false)
  const { pathname } = useLocation()
  const mobileOpen = mobileOpenForPath === pathname

  useEffect(() => {
    if (!mobileOpen) return
    document.querySelector<HTMLElement>('.app-sidebar .collapse-button')?.focus()
    function handleDrawerKeys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpenForPath(null)
      }
      if (event.key === 'Tab') {
        const focusable = document.querySelectorAll<HTMLElement>('.app-sidebar a[href], .app-sidebar button:not([tabindex="-1"])')
        const first = focusable.item(0)
        const last = focusable.item(focusable.length - 1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleDrawerKeys)
    return () => document.removeEventListener('keydown', handleDrawerKeys)
  }, [mobileOpen])

  useEffect(() => {
    if (wasMobileOpen.current && !mobileOpen) menuButtonRef.current?.focus()
    wasMobileOpen.current = mobileOpen
  }, [mobileOpen])

  function closeNavigation() {
    setMobileOpenForPath(null)
  }

  return (
    <div className={`app-frame${collapsed ? ' sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCollapse={() => setCollapsed((value) => !value)} onNavigate={closeNavigation} />
      <div className="app-main">
        <Header mobileOpen={mobileOpen} menuButtonRef={menuButtonRef} onOpenNavigation={() => setMobileOpenForPath(pathname)} />
        <main className="main-content" id="main-content">{children}</main>
      </div>
    </div>
  )
}
