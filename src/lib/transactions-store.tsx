import { createContext, useContext, useState, type ReactNode } from 'react'
import { TRANSACTIONS } from './mock-data'
import type { Transaction } from './mock-data'

interface TransactionsCtx {
  txList: Transaction[]
  addTransaction:    (tx: Transaction) => void
  updateTransaction: (tx: Transaction) => void
  deleteTransaction: (id: string)      => void
}

const Ctx = createContext<TransactionsCtx | null>(null)

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [txList, setTxList] = useState(TRANSACTIONS)

  return (
    <Ctx.Provider value={{
      txList,
      addTransaction:    tx  => setTxList(prev => [tx, ...prev]),
      updateTransaction: tx  => setTxList(prev => prev.map(t => t.id === tx.id ? tx : t)),
      deleteTransaction: id  => setTxList(prev => prev.filter(t => t.id !== id)),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTransactions() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider')
  return ctx
}
