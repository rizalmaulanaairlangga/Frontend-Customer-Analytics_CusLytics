import { useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, ChevronLeft, FileText, FlaskConical, LayoutDashboard, ListChecks, SlidersHorizontal, UsersRound, type LucideIcon } from 'lucide-react'
import { useNavIndicator } from '../hooks/useNavIndicator'
import { navigationItems } from './navigation'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onNavigate: () => void
}

const navigationIcons: Record<(typeof navigationItems)[number]['icon'], LucideIcon> = {
  overview: LayoutDashboard,
  data: SlidersHorizontal,
  sales: BarChart3,
  customers: UsersRound,
  studio: FlaskConical,
  evaluation: BarChart3,
  actions: ListChecks,
  reports: FileText,
}

function NavigationIcon({ name }: { name: (typeof navigationItems)[number]['icon'] }) {
  const Icon = navigationIcons[name]
  return <Icon className="navigation-icon" size={20} strokeWidth={1.7} aria-hidden="true" />
}

export function Sidebar({ collapsed, mobileOpen, onCollapse, onNavigate }: SidebarProps) {
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  useNavIndicator(navRef, indicatorRef)

  return (
    <>
      <button className={`drawer-scrim ${mobileOpen ? 'is-visible' : ''}`} type="button" aria-label="Dismiss navigation drawer" onClick={onNavigate} tabIndex={mobileOpen ? 0 : -1} />
      <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined} aria-label={mobileOpen ? 'Navigation drawer' : undefined}>
        <div className="brand-row">
          {collapsed
            ? <button className="brand-mark" type="button" aria-label="Buka sidebar" onClick={onCollapse}><img src="/cuslytics-mark.svg" alt="" /></button>
            : <img className="brand-logo-horizontal" src="/cuslytics-logo-horizontal.svg" alt="CusLytics" />}
        </div>
        <div className="navigation-caption">WORKSPACE</div>
        <div className="sidebar__nav-scroll">
          <nav ref={navRef} className="sidebar__nav primary-navigation" id="primary-navigation" aria-label="Primary navigation">
            <span className="sidebar__indicator" aria-hidden="true" ref={indicatorRef} />
            {navigationItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onNavigate} aria-label={item.label} title={collapsed ? item.label : undefined} className="sidebar__link navigation-link">
                <NavigationIcon name={item.icon} /><span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <button className="sidebar-edge-toggle" type="button" aria-expanded={!collapsed} aria-controls="primary-navigation" aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'} title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'} onClick={onCollapse}>
          <ChevronLeft className="collapse-chevron" size={16} aria-hidden="true" />
        </button>
      </aside>
    </>
  )
}
