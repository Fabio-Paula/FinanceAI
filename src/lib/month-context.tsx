import { createContext, useContext } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'

interface MonthContextValue {
  year: number
  month: number // 0-indexed (Jan = 0)
  setYear: (y: number) => void
  setMonth: (m: number) => void
  monthKey: string // "2026-05"
  monthLabel: string // "maio de 2026"
  prevMonth: () => void
  nextMonth: () => void
  isCurrentMonth: boolean
  isReadOnly: boolean
}

const MonthContext = createContext<MonthContextValue | null>(null)

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const search = useSearch({ from: '/_app' })
  const navigate = useNavigate()

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
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  function goTo(y: number, m: number) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    navigate({
      search: { ...search, month: key === currentKey ? undefined : key },
    })
  }

  function prevMonth() {
    if (month === 0) goTo(year - 1, 11)
    else goTo(year, month - 1)
  }

  function nextMonth() {
    if (isCurrentMonth) return
    if (month === 11) goTo(year + 1, 0)
    else goTo(year, month + 1)
  }

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
        setYear: (y) => goTo(y, month),
        setMonth: (m) => goTo(year, m),
        monthKey,
        monthLabel,
        prevMonth,
        nextMonth,
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
