import { createContext, useContext, useState } from 'react'

interface MonthContextValue {
  year: number
  month: number          // 0-indexed (Jan = 0)
  setYear: (y: number) => void
  setMonth: (m: number) => void
  monthKey: string       // "2026-05"
  monthLabel: string     // "maio de 2026"
  prevMonth: () => void
  nextMonth: () => void
}

const MonthContext = createContext<MonthContextValue | null>(null)

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const monthKey   = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <MonthContext.Provider value={{ year, month, setYear, setMonth, monthKey, monthLabel, prevMonth, nextMonth }}>
      {children}
    </MonthContext.Provider>
  )
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth must be used inside MonthProvider')
  return ctx
}
