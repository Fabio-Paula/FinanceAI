import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete } from './api'
import { useMonth } from './month-context'
import type { Transaction } from '@/types'

export interface TxInput {
  date: string
  description: string
  amount: string
  type: 'income' | 'expense'
  category_id?: string | null
  is_recurring?: boolean
  notes?: string | null
}

interface TransactionsCtx {
  txList: Transaction[]
  isLoading: boolean
  addTransaction: (data: TxInput) => Promise<void>
  updateTransaction: (id: string, data: Partial<TxInput>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

const Ctx = createContext<TransactionsCtx | null>(null)

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const { monthKey } = useMonth()

  const [year, month] = monthKey.split('-').map(Number)
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', monthKey],
    queryFn: () =>
      apiGet<{ data: Transaction[]; total: number }>(
        `/api/transactions?pageSize=200&from=${from}&to=${to}`
      ),
  })

  const addMut = useMutation({
    mutationFn: (input: TxInput) => apiPost<{ data: Transaction }>('/api/transactions', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TxInput> }) =>
      apiPatch<{ data: Transaction }>(`/api/transactions/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  return (
    <Ctx.Provider
      value={{
        txList: data?.data ?? [],
        isLoading,
        addTransaction: (d) => addMut.mutateAsync(d).then(() => {}),
        updateTransaction: (id, patch) => updateMut.mutateAsync({ id, patch }).then(() => {}),
        deleteTransaction: (id) => deleteMut.mutateAsync(id).then(() => {}),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useTransactions() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider')
  return ctx
}
