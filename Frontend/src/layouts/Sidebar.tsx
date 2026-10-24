import { NavLink } from 'react-router-dom'
import { BarChart3, ChevronLeft, ChevronRight, FileText, FlaskConical, LayoutDashboard, ListChecks, SlidersHorizontal, UsersRound, X, type LucideIcon } from 'lucide-react'
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
  return <Icon className="navigation-icon" size={19} strokeWidth={1.7} aria-hidden="true" />
}

export function Sidebar({ collapsed, mobileOpen, onCollapse, onNavigate }: SidebarProps) {
  return (
    <>
      <button className={`drawer-scrim ${mobileOpen ? 'is-visible' : ''}`} type="button" aria-label="Dismiss navigation drawer" onClick={onNavigate} tabIndex={mobileOpen ? 0 : -1} />
      <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`} role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined} aria-label={mobileOpen ? 'Navigation drawer' : undefined}>
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">C</span>
          {!collapsed && <div className="brand-copy"><strong>CusLytics</strong><span>Customer Analytics</span></div>}
          <button className="collapse-button" type="button" onClick={mobileOpen ? onNavigate : onCollapse} aria-label={mobileOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={mobileOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {mobileOpen ? <X size={18} aria-hidden="true" /> : collapsed ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
          </button>
        </div>
        <div className="navigation-caption">WORKSPACE</div>
        <nav className="primary-navigation" id="primary-navigation" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onNavigate} aria-label={item.label} title={collapsed ? item.label : undefined} className={({ isActive }) => `navigation-link${isActive ? ' is-active' : ''}`}>
              <NavigationIcon name={item.icon} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer"><span className="footer-dot" /><span>Reference analytics workspace</span></div>
      </aside>
    </>
  )
}
