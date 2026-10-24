import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const location = useLocation()

  // Tutup mobile drawer setiap kali pindah halaman
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className={cn('min-h-screen bg-[#F5F7FB]', darkMode && 'dark')}>
      {/* Overlay backdrop untuk mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopBar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        onMenuToggle={() => setMobileOpen(o => !o)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main content — di mobile tidak ada padding sidebar */}
      <main className={cn(
        'transition-all duration-300 pt-14 min-h-screen',
        'pl-0 lg:pl-60',
        sidebarCollapsed && 'lg:pl-16'
      )}>
        <div className="p-4 lg:p-6 max-w-[1440px] animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
