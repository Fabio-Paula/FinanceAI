import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import type { Transaction, Category, CursorPage, DashboardSummary } from '@/types'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Currency } from '@/components/ui/currency'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTransactions, type TxInput } from '@/lib/transactions-store'
import { apiGet } from '@/lib/api'
import { useMonth } from '@/lib/month-context'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export const Route = createFileRoute('/_app/transactions')({ component: TransactionsPage })

// ── Modal ────────────────────────────────────────────────────────────────────

interface TxForm {
  date: string
  description: string
  amount: string
  type: 'income' | 'expense'
  category_id: string
}

function emptyForm(): TxForm {
  return {
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    type: 'expense',
    category_id: '',
  }
}

function txToForm(tx: Transaction): TxForm {
  return {
    date: tx.date.slice(0, 10),
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category_id: tx.category_id ?? tx.ai_category_id ?? '',
  }
}

function TransactionModal({
  open,
  tx,
  categories,
  onClose,
  onSave,
}: {
  open: boolean
  tx?: Transaction
  categories: Category[]
  onClose: () => void
  onSave: (data: TxInput) => void
}) {
  const [form, setForm] = useState<TxForm>(tx ? txToForm(tx) : emptyForm())

  useEffect(() => {
    if (open) setForm(tx ? txToForm(tx) : emptyForm())
  }, [open, tx])

  const set = (k: keyof TxForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const raw = parseFloat(form.amount)
    if (!form.description.trim() || isNaN(raw) || raw <= 0) {
      toast.error('Preencha todos os campos corretamente.')
      return
    }
    onSave({
      date: form.date,
      description: form.description.trim(),
      amount: form.amount,
      type: form.type,
      category_id: form.category_id || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tx ? 'Editar transação' : 'Nova transação'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo</Label>
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                  className={cn(
                    'flex-1 h-9 rounded-md text-sm font-medium border transition-colors',
                    form.type === t
                      ? t === 'income'
                        ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30'
                        : 'bg-destructive/10 text-destructive border-destructive/30'
                      : 'border-input text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t === 'income' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label
              htmlFor="tx-date"
              className="text-xs font-medium text-muted-foreground mb-1.5 block"
            >
              Data
            </Label>
            <Input id="tx-date" type="date" value={form.date} onChange={set('date')} required />
          </div>

          <div>
            <Label
              htmlFor="tx-desc"
              className="text-xs font-medium text-muted-foreground mb-1.5 block"
            >
              Descrição
            </Label>
            <Input
              id="tx-desc"
              type="text"
              value={form.description}
              onChange={set('description')}
              placeholder="Ex: Supermercado Extra"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="tx-amount"
                className="text-xs font-medium text-muted-foreground mb-1.5 block"
              >
                Valor (R$)
              </Label>
              <Input
                id="tx-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Categoria
              </Label>
              <Select
                value={form.category_id || '__none__'}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category_id: v === '__none__' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {categories
                    .filter((c) => c.type === form.type || c.type === 'both')
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{tx ? 'Salvar alterações' : 'Adicionar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  tx,
  onClose,
  onConfirm,
}: {
  tx: Transaction | null
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!tx} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remover transação?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{tx?.description}</span> será removida
          permanentemente.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remover
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    score >= 0.95
      ? 'text-[hsl(var(--positive))]'
      : score >= 0.75
        ? 'text-[hsl(var(--warning))]'
        : 'text-[hsl(var(--negative))]'
  return <span className={cn('font-mono text-xs tabular-nums font-semibold', color)}>{pct}%</span>
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 30

export function TransactionsPage() {
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { monthKey, monthLabel, isReadOnly } = useMonth()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'review'>('all')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [modal, setModal] = useState<'add' | Transaction | null>(null)
  const [delTx, setDelTx] = useState<Transaction | null>(null)

  // Debounce search input → avoid firing a request on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Date range for the selected month
  const [year, month] = monthKey.split('-').map(Number)
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  // ── Infinite query (cursor-based) ─────────────────────────────────────────

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['transactions-infinite', monthKey, search, filter] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT), from, to })
      if (search) params.set('search', search)
      if (filter === 'income' || filter === 'expense') params.set('type', filter)
      if (filter === 'review') params.set('unconfirmed', 'true')
      if (pageParam) params.set('cursor', pageParam)
      return apiGet<CursorPage<Transaction>>(`/api/transactions?${params}`)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  })

  const transactions = data?.pages.flatMap((p) => p.data) ?? []

  // ── Dashboard summary for header stats ───────────────────────────────────

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary', monthKey],
    queryFn: () => apiGet<{ data: DashboardSummary }>(`/api/dashboard/summary?month=${monthKey}`),
  })
  const stats = summaryData?.data

  // ── Categories ────────────────────────────────────────────────────────────

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/api/categories'),
  })
  const categories = categoriesData?.data ?? []

  // ── IntersectionObserver sentinel ─────────────────────────────────────────

  const { sentinelRef, containerRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  function confirmCategory(id: string, categoryId: string) {
    updateTransaction(id, { category_id: categoryId || null }).then(() =>
      toast.success('Categoria atualizada')
    )
    setEditingCat(null)
  }

  function handleSave(data: TxInput) {
    if (modal === 'add') {
      addTransaction(data)
        .then(() => toast.success('Transação adicionada'))
        .catch(() => toast.error('Erro ao adicionar'))
    } else {
      updateTransaction((modal as Transaction).id, data)
        .then(() => toast.success('Transação atualizada'))
        .catch(() => toast.error('Erro ao atualizar'))
    }
    setModal(null)
  }

  function handleDelete() {
    if (!delTx) return
    deleteTransaction(delTx.id)
      .then(() => toast.success('Transação removida'))
      .catch(() => toast.error('Erro ao remover'))
    setDelTx(null)
  }

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const pendingCount = stats?.pendingReview ?? 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed top: header + filters */}
      <div className="shrink-0 px-6 pt-6 pb-4 space-y-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Transações</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              {stats?.transactionCount ?? '—'} lançamentos — {monthLabel}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono text-[hsl(var(--success))] tabular-nums">
                  +{fmtBRL(stats.totalIncome)}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="font-mono text-[hsl(var(--destructive))] tabular-nums">
                  -{fmtBRL(stats.totalExpense)}
                </span>
              </div>
            )}
            {!isReadOnly && (
              <Button onClick={() => setModal('add')} size="sm">
                <Plus className="h-4 w-4" /> Nova transação
              </Button>
            )}
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar transações…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            {(['all', 'income', 'expense', 'review'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'h-8 px-3 text-xs font-medium rounded transition-colors',
                  filter === f
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'all'
                  ? 'Todas'
                  : f === 'income'
                    ? 'Receitas'
                    : f === 'expense'
                      ? 'Despesas'
                      : `Revisar (${pendingCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 min-h-0 px-6 pb-6 max-w-7xl mx-auto w-full">
        <div
          ref={containerRef}
          className="rounded-lg border border-border bg-card overflow-y-auto max-h-full"
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Data
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Descrição
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Confiança IA
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const catName = tx.category?.name ?? tx.ai_category?.name ?? 'Sem categoria'
                const signedAmount =
                  tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)
                return (
                  <tr
                    key={tx.id}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors group',
                      !tx.is_ai_confirmed ? 'bg-destructive/3' : 'hover:bg-muted/30'
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        {tx.is_recurring && (
                          <RefreshCw
                            className="h-3 w-3 text-muted-foreground shrink-0"
                            aria-label="Recorrente"
                          />
                        )}
                        <span className="truncate text-foreground">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {!isReadOnly && editingCat === tx.id ? (
                        <select
                          defaultValue={tx.category_id ?? ''}
                          autoFocus
                          onChange={(e) => confirmCategory(tx.id, e.target.value)}
                          onBlur={() => setEditingCat(null)}
                          className="h-7 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Sem categoria</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => !isReadOnly && setEditingCat(tx.id)}
                          disabled={isReadOnly}
                        >
                          <CategoryBadge
                            category={catName}
                            confidence={tx.ai_confidence ?? undefined}
                            size="sm"
                          />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge score={tx.ai_confidence ?? 0} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Currency value={signedAmount} size="sm" color="auto" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tx.is_ai_confirmed ? (
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] inline" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))] inline" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!isReadOnly && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal(tx)}
                            title="Editar"
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDelTx(tx)}
                            title="Remover"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Loading skeleton on first load */}
          {isLoading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && transactions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhuma transação encontrada.
            </div>
          )}

          {/* Sentinel + fetch-next indicator */}
          <div ref={sentinelRef} className="h-px" />
          {isFetchingNextPage && (
            <div className="py-4 flex justify-center border-t border-border">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        open={modal !== null}
        tx={modal === 'add' ? undefined : (modal ?? undefined)}
        categories={categories}
        onClose={() => setModal(null)}
        onSave={handleSave}
      />
      <DeleteConfirm tx={delTx} onClose={() => setDelTx(null)} onConfirm={handleDelete} />
    </div>
  )
}
