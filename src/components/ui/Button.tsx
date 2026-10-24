import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

const variants = {
  primary: 'bg-[#173B68] hover:bg-[#1e4d8a] text-white shadow-sm',
  secondary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
  ghost: 'bg-transparent hover:bg-[#F5F7FB] text-[#172033]',
  outline: 'bg-white border border-[#E5EAF2] hover:bg-[#F5F7FB] text-[#172033]',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-sm rounded-xl',
}

export default function Button({ children, onClick, variant = 'primary', size = 'md', loading, disabled, className, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
