import { useLocation } from 'react-router-dom'
import { Sun, Moon, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, { title: string; breadcrumb: string[] }> = {
  '/overview': { title: 'Overview Dashboard', breadcrumb: ['NUSA Insight', 'Overview'] },
  '/poverty-explorer': { title: 'Poverty Explorer', breadcrumb: ['NUSA Insight', 'Poverty Explorer'] },
  '/prediction': { title: 'Prediction Studio', breadcrumb: ['NUSA Insight', 'Prediction Studio'] },
  '/model-comparison': { title: 'Model Comparison', breadcrumb: ['NUSA Insight', 'Model Comparison'] },
  '/historical-analysis': { title: 'Historical Analysis', breadcrumb: ['NUSA Insight', 'Historical Analysis'] },
  '/dataset': { title: 'Dataset Explorer', breadcrumb: ['NUSA Insight', 'Dataset Explorer'] },
  '/methodology': { title: 'About & Methodology', breadcrumb: ['NUSA Insight', 'Methodology'] },
}

interface TopBarProps {
  darkMode: boolean
  onToggleDark: () => void
  onMenuToggle: () => void
  sidebarCollapsed: boolean
}

export default function TopBar({ darkMode, onToggleDark, onMenuToggle, sidebarCollapsed }: TopBarProps) {
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? PAGE_TITLES['/overview']

  return (
    <header className={cn(
      'fixed top-0 right-0 h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6',
      'bg-[#F5F7FB]/90 backdrop-blur-sm border-b border-[#E5EAF2] z-20 transition-all duration-300',
      'left-0',
      sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'
    )}>
      {/* Left: breadcrumb + title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg hover:bg-[#E5EAF2] text-[#667085]"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            {meta.breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                <span className={i === meta.breadcrumb.length - 1 ? 'text-[#172033] font-medium' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] bg-[#E5EAF2] px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
          Data BPS · 2017–2025
        </span>
        <button
          onClick={onToggleDark}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#667085] hover:bg-[#E5EAF2] transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
