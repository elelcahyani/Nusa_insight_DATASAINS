import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, Brain, BarChart2, TrendingUp,
  Database, BookOpen, ChevronLeft, ChevronRight, Activity, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/poverty-explorer', icon: Map, label: 'Poverty Explorer' },
  { to: '/prediction', icon: Brain, label: 'Prediction Studio' },
  { to: '/model-comparison', icon: BarChart2, label: 'Model Comparison' },
  { to: '/historical-analysis', icon: TrendingUp, label: 'Historical Analysis' },
  { to: '/dataset', icon: Database, label: 'Dataset Explorer' },
  { to: '/methodology', icon: BookOpen, label: 'About & Methodology' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-30',
        'bg-[#101828] border-r border-white/8',
        // Desktop: selalu tampil, bisa collapse
        'lg:translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-60',
        // Mobile: drawer — hidden default, slide-in saat mobileOpen
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64',
        'lg:translate-x-0' // override back for desktop
      )}
    >
      {/* Logo + Mobile close button */}
      <div className={cn(
        'flex items-center px-4 py-5 border-b border-white/8 shrink-0',
        collapsed && !mobileOpen ? 'justify-center px-0' : 'justify-between gap-3'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-tight">NUSA Insight</div>
              <div className="text-white/40 text-[10px] leading-tight">Socioeconomic Analytics</div>
            </div>
          )}
        </div>
        {/* Tombol X hanya di mobile */}
        <button
          onClick={onMobileClose}
          className="lg:hidden text-white/50 hover:text-white p-1 rounded"
          aria-label="Tutup menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to === '/overview' && location.pathname === '/')
          const showLabel = !collapsed || mobileOpen
          return (
            <NavLink
              key={to}
              to={to}
              title={!showLabel ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                !showLabel ? 'justify-center px-0 py-3' : '',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/6 hover:text-white/85'
              )}
            >
              <Icon className={cn('shrink-0', !showLabel ? 'w-5 h-5' : 'w-4 h-4')} />
              {showLabel && <span className="truncate">{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer info */}
      {(!collapsed || mobileOpen) && (
        <div className="px-3 py-3 border-t border-white/8 shrink-0">
          <div className="text-white/30 text-[10px] leading-relaxed space-y-0.5">
            <div className="font-medium text-white/50">Dataset: 2017–2025</div>
            <div>Model: Random Forest · Linear Reg.</div>
            <div>Source: BPS Indonesia</div>
          </div>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        className={cn(
          'hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#173B68] border border-white/15',
          'items-center justify-center text-white/60 hover:text-white hover:bg-[#1e4d8a]',
          'transition-colors shadow-md z-40'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
