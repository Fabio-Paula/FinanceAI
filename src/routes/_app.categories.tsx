import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, RefreshCw, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { CATEGORY_COLORS } from '@/components/ui/category-badge'
import type { CategoryKey } from '@/components/ui/category-badge'
import type { Transaction, Category } from '@/types'
import { Currency } from '@/components/ui/currency'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTransactions, type TxInput } from '@/lib/transactions-store'
import { useMonth } from '@/lib/month-context'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/_app/categories')({ component: CategoriesPage })

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS = { income: 'Receita', expense: 'Despesa', both: 'Ambos' }
const TYPE_COLORS = {
  income:  'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10',
  expense: 'text-[hsl(var(--destructive))] bg-destructive/10',
  both:    'text-muted-foreground bg-muted',
}

function categoryType(name: string): 'income' | 'expense' | 'both' {
  if (['Salário', 'Investimentos'].includes(name)) return 'income'
  if (name === 'Outros') return 'both'
  return 'expense'
}

function today() { return new Date().toISOString().slice(0, 10) }

const INPUT = 'h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring w-full'

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirm({ tx, onClose, onConfirm }: { tx: Transaction | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={!!tx} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remover transação?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{tx?.description}</span> será removida permanentemente.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Remover</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ txCount }: { txCount: Record<string, number> }) {
  const categories = Object.entries(CATEGORY_COLORS).map(([name, colors]) => ({
    name: name as CategoryKey, color: colors.hex,
    type: categoryType(name), count: txCount[name] ?? 0,
  }))

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Categoria</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Transações</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Sistema</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLORS[cat.type])}>
                  {TYPE_LABELS[cat.type]}
                </span>
              </td>
              <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{cat.count}</td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Sistema</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Inline edit row ───────────────────────────────────────────────────────────

interface EditState { date: string; description: string; amount: string }

function EditRow({ tx, onSave, onCancel }: {
  tx: Transaction
  onSave: (patch: Partial<TxInput>) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<EditState>({
    date: tx.date.slice(0, 10),
    description: tx.description,
    amount: tx.amount,
  })
  const set = (k: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  function save() {
    const raw = parseFloat(f.amount)
    if (!f.description.trim() || isNaN(raw) || raw <= 0) { toast.error('Preencha todos os campos.'); return }
    onSave({ date: f.date, description: f.description.trim(), amount: f.amount })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <tr className="border-t border-border bg-primary/5">
      <td className="px-4 py-1.5" style={{ width: 120 }}>
        <input type="date" value={f.date} onChange={set('date')} onKeyDown={onKeyDown} className={INPUT} />
      </td>
      <td className="px-4 py-1.5">
        <input type="text" value={f.description} onChange={set('description')} onKeyDown={onKeyDown} className={INPUT} autoFocus />
      </td>
      <td className="px-4 py-1.5 text-right" style={{ width: 130 }}>
        <input type="number" min="0.01" step="0.01" value={f.amount} onChange={set('amount')} onKeyDown={onKeyDown}
          placeholder="0,00" className={cn(INPUT, 'text-right')} />
      </td>
      <td className="px-3 py-1.5" style={{ width: 60 }}>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={save} className="h-6 w-6 text-primary hover:bg-primary/10" title="Salvar (Enter)">
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-6 w-6" title="Cancelar (Esc)">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ── Quick-add row ─────────────────────────────────────────────────────────────

interface QuickForm { date: string; description: string; amount: string }

function QuickAddRow({ category, txType, onAdd, onClose, categories }: {
  category: string
  txType: 'income' | 'expense' | 'both'
  onAdd: (data: TxInput) => void
  onClose: () => void
  categories: Category[]
}) {
  const defaultType: 'income' | 'expense' = txType === 'income' ? 'income' : 'expense'
  const [f, setF] = useState<QuickForm>({ date: today(), description: '', amount: '' })
  const descRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof QuickForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  const submit = useCallback(() => {
    const raw = parseFloat(f.amount)
    if (!f.description.trim() || isNaN(raw) || raw <= 0) {
      toast.error('Informe descrição e valor.')
      descRef.current?.focus()
      return
    }
    const categoryObj = categories.find(c => c.name === category)
    onAdd({
      date: f.date,
      description: f.description.trim(),
      amount: f.amount,
      type: defaultType,
      category_id: categoryObj?.id ?? null,
    })
    setF(prev => ({ ...prev, description: '', amount: '' }))
    descRef.current?.focus()
  }, [f, category, defaultType, onAdd, categories])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    if (e.key === 'Escape') onClose()
  }

  return (
    <tr className="border-t-2 border-primary/30 bg-primary/5">
      <td className="px-4 py-2" style={{ width: 120 }}>
        <input type="date" value={f.date} onChange={set('date')} onKeyDown={onKeyDown} className={INPUT} title="Data" />
      </td>
      <td className="px-4 py-2">
        <input ref={descRef} autoFocus type="text" value={f.description} onChange={set('description')} onKeyDown={onKeyDown}
          placeholder="Descrição… (Enter para adicionar, Esc para fechar)" className={INPUT} />
      </td>
      <td className="px-4 py-2 text-right" style={{ width: 130 }}>
        <input type="number" min="0.01" step="0.01" value={f.amount} onChange={set('amount')} onKeyDown={onKeyDown}
          placeholder="0,00" className={cn(INPUT, 'text-right')} />
      </td>
      <td className="px-3 py-2" style={{ width: 60 }}>
        <div className="flex items-center gap-1">
          <Button variant="default" size="icon" onClick={submit} className="h-6 w-6" title="Adicionar (Enter)">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6" title="Fechar (Esc)">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ── Detail tab ────────────────────────────────────────────────────────────────

function DetailTab({
  grouped, onAdd, onUpdate, onDelete, categories, isReadOnly,
}: {
  grouped: Record<string, { tx: Transaction[]; total: number }>
  onAdd: (data: TxInput) => void
  onUpdate: (id: string, data: Partial<TxInput>) => void
  onDelete: (id: string) => void
  categories: Category[]
  isReadOnly: boolean
}) {
  const [open,       setOpen]       = useState<Set<string>>(new Set())
  const [quickAdds,  setQuickAdds]  = useState<Set<string>>(new Set())
  const [editing,    setEditing]    = useState<string | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  const toggleOpen = (name: string) =>
    setOpen(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s })

  const openQuickAdd = (name: string) =>
    setQuickAdds(prev => new Set(prev).add(name))

  const closeQuickAdd = (name: string) =>
    setQuickAdds(prev => { const s = new Set(prev); s.delete(name); return s })

  const catNames = Object.keys(grouped).sort((a, b) => (grouped[b]?.total ?? 0) - (grouped[a]?.total ?? 0))

  if (catNames.length === 0)
    return <div className="py-16 text-center text-muted-foreground text-sm">Nenhuma transação encontrada.</div>

  function handleSave(tx: Transaction, patch: Partial<TxInput>) {
    onUpdate(tx.id, patch)
    setEditing(null)
    toast.success('Transação atualizada')
  }

  function handleAdd(data: TxInput) {
    onAdd(data)
    toast.success('Lançamento adicionado')
  }

  function handleDelete() {
    if (!deletingTx) return
    onDelete(deletingTx.id)
    toast.success('Transação removida')
    setDeletingTx(null)
  }

  return (
    <>
      <div className="space-y-2">
        {catNames.map(name => {
          const { tx: txs, total } = grouped[name] ?? { tx: [], total: 0 }
          const isOpen  = open.has(name)
          const showAdd = quickAdds.has(name)
          const colors  = CATEGORY_COLORS[name as CategoryKey] ?? CATEGORY_COLORS.Outros
          const type    = categoryType(name)
          const sorted  = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          return (
            <div key={name} className="rounded-lg border border-border bg-card overflow-hidden">
              <button onClick={() => toggleOpen(name)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left min-w-0">
                {isOpen
                  ? <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: colors.hex }} />
                <span className="font-medium text-foreground flex-1 truncate">{name}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mr-3 shrink-0', TYPE_COLORS[type])}>
                  {TYPE_LABELS[type]}
                </span>
                <span className="text-xs text-muted-foreground mr-4 shrink-0 tabular-nums">
                  {txs.length} {txs.length === 1 ? 'transação' : 'transações'}
                </span>
                <span className={cn(
                  'font-mono text-sm font-semibold tabular-nums shrink-0',
                  type === 'income' ? 'text-[hsl(var(--success))]' : 'text-foreground'
                )}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: 120 }} />
                      <col />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 60 }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Data</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Descrição</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Valor</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(tx => {
                        const signedAmount = tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)
                        return !isReadOnly && editing === tx.id ? (
                          <EditRow key={tx.id} tx={tx}
                            onSave={patch => handleSave(tx, patch)}
                            onCancel={() => setEditing(null)} />
                        ) : (
                          <tr key={tx.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors group">
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
                              {new Date(tx.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-2.5 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {tx.is_recurring && <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />}
                                <span className="text-foreground truncate">{tx.description}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right whitespace-nowrap overflow-hidden">
                              <Currency value={signedAmount} size="sm" color="auto" />
                            </td>
                            <td className="px-3 py-2.5">
                              {!isReadOnly && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => setEditing(tx.id)}
                                    className="h-6 w-6" title="Editar">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeletingTx(tx)}
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Remover">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    <tfoot>
                      {!isReadOnly && showAdd && (
                        <QuickAddRow
                          category={name}
                          txType={type}
                          onAdd={handleAdd}
                          onClose={() => closeQuickAdd(name)}
                          categories={categories}
                        />
                      )}
                      {!isReadOnly && !showAdd && (
                        <tr className="border-t border-border/50">
                          <td colSpan={4} className="px-4 py-2">
                            <Button variant="ghost" size="sm" onClick={() => openQuickAdd(name)}
                              className="h-7 text-xs text-muted-foreground hover:text-foreground px-0">
                              <Plus className="h-3.5 w-3.5" />
                              Novo lançamento
                            </Button>
                          </td>
                        </tr>
                      )}
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={2} className="px-4 py-2 text-xs font-medium text-muted-foreground">
                          Total — {name}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <span className={cn(
                            'font-mono text-sm font-semibold tabular-nums',
                            type === 'income' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                          )}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                          </span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <DeleteConfirm
        tx={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const { txList, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { isReadOnly } = useMonth()

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/api/categories'),
  })
  const categories = categoriesData?.data ?? []

  const txCount: Record<string, number> = {}
  const grouped: Record<string, { tx: Transaction[]; total: number }> = {}
  for (const tx of txList) {
    const name = tx.category?.name ?? tx.ai_category?.name ?? 'Sem categoria'
    const absAmount = parseFloat(tx.amount)
    txCount[name] = (txCount[name] ?? 0) + 1
    if (!grouped[name]) grouped[name] = { tx: [], total: 0 }
    grouped[name].tx.push(tx)
    grouped[name].total += absAmount
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {categories.length > 0 ? `${categories.length} categorias` : 'Carregando categorias…'}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <div className="border-b border-border">
          <TabsList className="h-auto justify-start gap-1 rounded-none border-0 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 -mb-px font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">Visão geral</TabsTrigger>
            <TabsTrigger value="detail" className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 -mb-px font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">Detalhamento por categoria</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab txCount={txCount} />
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <DetailTab
            grouped={grouped}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
            categories={categories}
            isReadOnly={isReadOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
