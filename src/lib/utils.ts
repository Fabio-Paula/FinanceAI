import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

/** Format a number or numeric string as BRL (R$ 1.234,56) */
export function formatCurrency(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return brlFormatter.format(isNaN(n) ? 0 : n)
}

/** Format an ISO date string as DD/MM/YYYY */
export function formatDate(date: string | Date): string {
  const d =
    typeof date === 'string' ? new Date(date + (date.includes('T') ? '' : 'T12:00:00')) : date
  return d.toLocaleDateString('pt-BR')
}

/** Format an ISO date string as DD/MM/YYYY HH:mm */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
