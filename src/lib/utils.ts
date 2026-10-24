import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPct(v: number, decimals = 2) {
  return `${v.toFixed(decimals)}%`
}

export function formatNumber(v: number) {
  return v.toLocaleString('id-ID')
}

export function formatIDR(v: number) {
  return `Rp ${(v / 1000).toFixed(0)}K`
}
