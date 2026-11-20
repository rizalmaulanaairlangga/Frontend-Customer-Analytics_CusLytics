import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { RefObject } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { navigationItems } from './navigation'
import { useTheme } from '../contexts/useTheme'

interface HeaderProps { onOpenNavigation: () => void; mobileOpen: boolean; menuButtonRef: RefObject<HTMLButtonElement | null> }

export function Header({ onOpenNavigation, mobileOpen, menuButtonRef }: HeaderProps) {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [spinKey, setSpinKey] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const current = navigationItems.find((item) => item.to === pathname)?.label ?? 'Page not found'
  const themeAction = theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
  return (
    <header className="topbar">
      <button ref={menuButtonRef} className="mobile-menu-button" type="button" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded={mobileOpen} onClick={onOpenNavigation} hidden={mobileOpen}>
        {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
      <nav className="breadcrumbs" aria-label="Breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{current}</strong></nav>
      <button className="theme-toggle" type="button" onClick={() => { toggleTheme(); setSpinning(!(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)); setSpinKey((key) => key + 1) }} aria-label={themeAction} title={themeAction} aria-pressed={theme === 'dark'}>
        <span className="theme-toggle__tilt"><span key={spinKey} className={`theme-toggle__spin${spinning ? ' is-spinning' : ''}`} onAnimationEnd={() => setSpinning(false)}><Moon className="theme-toggle__moon" size={20} aria-hidden="true"/><Sun className="theme-toggle__sun" size={20} aria-hidden="true"/></span></span>
      </button>
    </header>
  )
}
