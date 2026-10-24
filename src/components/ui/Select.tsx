import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value: string | number
  onChange: (v: string) => void
  options: { value: string | number; label: string }[]
  className?: string
  label?: string
}

export default function Select({ value, onChange, options, className, label }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      {label && <label className="block text-xs font-medium text-[#667085] mb-1">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none bg-white border border-[#E5EAF2] rounded-lg',
            'px-3 py-2 pr-8 text-sm text-[#172033] font-medium',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
            'cursor-pointer transition-colors'
          )}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085] pointer-events-none" />
      </div>
    </div>
  )
}
