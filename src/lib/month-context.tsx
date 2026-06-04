import { createContext, useContext } from 'react'
import { useSearch } from '@tanstack/react-router'

interface MonthContextValue {
  year: number
  month: number // 0-indexed (Jan = 0)
  monthKey: string // "2026-05"
  monthLabel: string // "maio de 2026"
  isCurrentMonth: boolean
  isReadOnly: boolean
}

const MonthContext = createContext<MonthContextValue | null>(null)

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const search = useSearch({ from: '/_app' })

  let year: number, month: number
  if (search.month && /^\d{4}-\d{2}$/.test(search.month)) {
    const [y, m] = search.month.split('-').map(Number)
    year = y
    month = m - 1
  } else {
    year = now.getFullYear()
    month = now.getMonth()
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <MonthContext.Provider
      value={{
        year,
        month,
        monthKey,
        monthLabel,
        isCurrentMonth,
        isReadOnly: !isCurrentMonth,
      }}
    >
      {children}
    </MonthContext.Provider>
  )
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth must be used inside MonthProvider')
  return ctx
}
