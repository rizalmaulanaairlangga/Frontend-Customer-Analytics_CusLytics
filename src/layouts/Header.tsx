import { useLocation } from 'react-router-dom'
import type { RefObject } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { navigationItems } from './navigation'
import { useTheme } from '../contexts/useTheme'

interface HeaderProps { onOpenNavigation: () => void; mobileOpen: boolean; menuButtonRef: RefObject<HTMLButtonElement | null> }

export function Header({ onOpenNavigation, mobileOpen, menuButtonRef }: HeaderProps) {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const current = navigationItems.find((item) => item.to === pathname)?.label ?? 'Page not found'
  return (
    <header className="topbar">
      <button ref={menuButtonRef} className="mobile-menu-button" type="button" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded={mobileOpen} onClick={onOpenNavigation} hidden={mobileOpen}>
        {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
      <nav className="breadcrumbs" aria-label="Breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{current}</strong></nav>
      <span className="topbar-context">CusLytics · Customer Analytics</span>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'}>
        {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
      </button>
    </header>
  )
}
