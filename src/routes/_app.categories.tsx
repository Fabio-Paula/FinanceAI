import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { CATEGORY_COLORS } from '@/components/ui/category-badge'
import type { CategoryKey } from '@/components/ui/category-badge'
import type { Transaction } from '@/lib/mock-data'
import { Currency } from '@/components/ui/currency'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTransactions } from '@/lib/transactions-store'

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

type Tab = 'overview' | 'detail'

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirm({ tx, onClose, onConfirm }: { tx: Transaction; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground">Remover transação?</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{tx.description}</span> será removida permanentemente.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 border border-input text-sm rounded-md hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="h-9 px-4 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity">
            Remover
          </button>
        </div>
      </div>
    </div>
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

interface EditState { date: string; description: string; institution: string; amount: string }

function EditRow({ tx, onSave, onCancel }: { tx: Transaction; onSave: (patch: Partial<Transaction>) => void; onCancel: () => void }) {
  const [f, setF] = useState<EditState>({
    date: tx.date, description: tx.description,
    institution: tx.institution, amount: Math.abs(tx.amount).toString(),
  })
  const set = (k: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }))

  function save() {
    const raw = parseFloat(f.amount)
    if (!f.description.trim() || isNaN(raw) || raw <= 0) { toast.error('Preencha todos os campos.'); return }
    onSave({ date: f.date, description: f.description.trim(), institution: f.institution.trim(), amount: tx.type === 'income' ? raw : -raw })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <tr className="border-t border-border bg-primary/5">
      {/* date */}
      <td className="px-4 py-1.5" style={{ width: 120 }}>
        <input type="date" value={f.date} onChange={set('date')} onKeyDown={onKeyDown} className={INPUT} />
      </td>
      {/* description */}
      <td className="px-4 py-1.5">
        <input type="text" value={f.description} onChange={set('description')} onKeyDown={onKeyDown} className={INPUT} autoFocus />
      </td>
      {/* institution */}
      <td className="px-4 py-1.5" style={{ width: 120 }}>
        <input type="text" value={f.institution} onChange={set('institution')} onKeyDown={onKeyDown} placeholder="Banco…" className={INPUT} />
      </td>
      {/* amount */}
      <td className="px-4 py-1.5 text-right" style={{ width: 130 }}>
        <input type="number" min="0.01" step="0.01" value={f.amount} onChange={set('amount')} onKeyDown={onKeyDown}
          placeholder="0,00" className={cn(INPUT, 'text-right')} />
      </td>
      {/* actions */}
      <td className="px-3 py-1.5" style={{ width: 60 }}>
        <div className="flex items-center gap-1">
          <button onClick={save} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors" title="Salvar (Enter)">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors" title="Cancelar (Esc)">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Quick-add row ─────────────────────────────────────────────────────────────

interface QuickForm { date: string; description: string; institution: string; amount: string }

function QuickAddRow({ category, txType, onAdd, onClose }: {
  category: string; txType: 'income' | 'expense' | 'both'
  onAdd: (tx: Transaction) => void; onClose: () => void
}) {
  const defaultType: 'income' | 'expense' = txType === 'income' ? 'income' : 'expense'
  const [f, setF] = useState<QuickForm>({ date: today(), description: '', institution: '', amount: '' })
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
    onAdd({
      id: Date.now().toString(),
      date: f.date,
      description: f.description.trim(),
      amount: defaultType === 'income' ? raw : -raw,
      type: defaultType,
      category: category as Transaction['category'],
      aiCategory: category as Transaction['category'],
      aiConfidence: 1,
      isConfirmed: true,
      isRecurring: false,
      institution: f.institution.trim(),
    })
    setF(prev => ({ ...prev, description: '', amount: '', institution: '' }))
    descRef.current?.focus()
  }, [f, category, defaultType, onAdd])

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
      <td className="px-4 py-2" style={{ width: 120 }}>
        <input type="text" value={f.institution} onChange={set('institution')} onKeyDown={onKeyDown}
          placeholder="Banco…" className={INPUT} />
      </td>
      <td className="px-4 py-2 text-right" style={{ width: 130 }}>
        <input type="number" min="0.01" step="0.01" value={f.amount} onChange={set('amount')} onKeyDown={onKeyDown}
          placeholder="0,00" className={cn(INPUT, 'text-right')} />
      </td>
      <td className="px-3 py-2" style={{ width: 60 }}>
        <div className="flex items-center gap-1">
          <button onClick={submit}
            className="p-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity" title="Adicionar (Enter)">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors" title="Fechar (Esc)">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Detail tab ────────────────────────────────────────────────────────────────

function DetailTab({
  grouped, onAdd, onUpdate, onDelete,
}: {
  grouped: Record<string, { tx: Transaction[]; total: number }>
  onAdd:    (tx: Transaction) => void
  onUpdate: (tx: Transaction) => void
  onDelete: (id: string)      => void
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

  const categories = Object.entries(CATEGORY_COLORS)
    .map(([name]) => name as CategoryKey)
    .filter(name => (grouped[name]?.tx.length ?? 0) > 0)
    .sort((a, b) => (grouped[b]?.total ?? 0) - (grouped[a]?.total ?? 0))

  if (categories.length === 0)
    return <div className="py-16 text-center text-muted-foreground text-sm">Nenhuma transação encontrada.</div>

  function handleSave(tx: Transaction, patch: Partial<Transaction>) {
    onUpdate({ ...tx, ...patch })
    setEditing(null)
    toast.success('Transação atualizada')
  }

  function handleAdd(tx: Transaction) {
    onAdd(tx)
    toast.success(`Adicionado em ${tx.category}`)
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
        {categories.map(name => {
          const { tx: txs, total } = grouped[name] ?? { tx: [], total: 0 }
          const isOpen     = open.has(name)
          const showAdd    = quickAdds.has(name)
          const colors     = CATEGORY_COLORS[name]
          const type       = categoryType(name)
          const sorted     = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          return (
            <div key={name} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Category header */}
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
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(total))}
                </span>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-border">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: 120 }} />
                      <col />
                      <col style={{ width: 120 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 60 }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Data</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Descrição</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Instituição</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Valor</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(tx =>
                        editing === tx.id ? (
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
                                {tx.isRecurring && <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />}
                                <span className="text-foreground truncate">{tx.description}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground truncate overflow-hidden">
                              {tx.institution}
                            </td>
                            <td className="px-4 py-2.5 text-right whitespace-nowrap overflow-hidden">
                              <Currency value={tx.amount} size="sm" color="auto" />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditing(tx.id)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeletingTx(tx)}
                                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remover">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>

                    <tfoot>
                      {/* Quick-add row (only when open) */}
                      {showAdd && (
                        <QuickAddRow
                          category={name}
                          txType={type}
                          onAdd={handleAdd}
                          onClose={() => closeQuickAdd(name)}
                        />
                      )}

                      {/* Add button row */}
                      {!showAdd && (
                        <tr className="border-t border-border/50">
                          <td colSpan={5} className="px-4 py-2">
                            <button
                              onClick={() => openQuickAdd(name)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Novo lançamento
                            </button>
                          </td>
                        </tr>
                      )}

                      {/* Subtotal */}
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={3} className="px-4 py-2 text-xs font-medium text-muted-foreground">
                          Total — {name}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <span className={cn(
                            'font-mono text-sm font-semibold tabular-nums',
                            type === 'income' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                          )}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(total))}
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

      {/* Delete confirmation modal */}
      {deletingTx && (
        <DeleteConfirm
          tx={deletingTx}
          onClose={() => setDeletingTx(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const { txList, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const [tab, setTab] = useState<Tab>('overview')

  const txCount: Record<string, number> = {}
  const grouped: Record<string, { tx: Transaction[]; total: number }> = {}
  for (const tx of txList) {
    txCount[tx.category] = (txCount[tx.category] ?? 0) + 1
    if (!grouped[tx.category]) grouped[tx.category] = { tx: [], total: 0 }
    grouped[tx.category].tx.push(tx)
    grouped[tx.category].total += Math.abs(tx.amount)
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {Object.keys(CATEGORY_COLORS).length} categorias do sistema
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {([['overview', 'Visão geral'], ['detail', 'Detalhamento por categoria']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview'
        ? <OverviewTab txCount={txCount} />
        : <DetailTab grouped={grouped} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} />
      }
    </div>
  )
}
