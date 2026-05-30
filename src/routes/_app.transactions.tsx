import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Search, CheckCircle2, AlertTriangle, RefreshCw, Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Transaction, Category } from '@/lib/mock-data'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Currency } from '@/components/ui/currency'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTransactions } from '@/lib/transactions-store'

export const Route = createFileRoute('/_app/transactions')({ component: TransactionsPage })

const CATEGORIES: Category[] = [
  'Mercado','Restaurante','Transporte','Streaming','Saúde',
  'Farmácia','Lazer','Assinaturas','Combustível','Educação',
  'Salário','Investimentos','Outros',
]

const FIELD = 'h-9 w-full px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const BTN_PRIMARY = 'h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity'
const BTN_GHOST   = 'h-9 px-4 border border-input text-sm rounded-md hover:bg-muted transition-colors'

// ── Modal ────────────────────────────────────────────────────────────────────

interface TxForm {
  date: string; description: string; amount: string
  type: 'income'|'expense'; category: Category; institution: string
}

function emptyForm(): TxForm {
  return { date: new Date().toISOString().slice(0,10), description: '', amount: '', type: 'expense', category: 'Outros', institution: '' }
}

function txToForm(tx: Transaction): TxForm {
  return { date: tx.date, description: tx.description, amount: Math.abs(tx.amount).toString(), type: tx.type, category: tx.category, institution: tx.institution }
}

function TransactionModal({ tx, onClose, onSave }: { tx?: Transaction; onClose: () => void; onSave: (tx: Transaction) => void }) {
  const [form, setForm] = useState<TxForm>(tx ? txToForm(tx) : emptyForm())

  const set = (k: keyof TxForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const raw = parseFloat(form.amount)
    if (!form.description.trim() || isNaN(raw) || raw <= 0) {
      toast.error('Preencha todos os campos corretamente.')
      return
    }
    onSave({
      id:           tx?.id ?? Date.now().toString(),
      date:         form.date,
      description:  form.description.trim(),
      amount:       form.type === 'income' ? raw : -raw,
      type:         form.type,
      category:     form.category,
      aiCategory:   form.category,
      aiConfidence: tx?.aiConfidence ?? 1,
      isConfirmed:  true,
      isRecurring:  tx?.isRecurring ?? false,
      institution:  form.institution.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{tx ? 'Editar transação' : 'Nova transação'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Type toggle */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              {(['expense','income'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: t }))}
                  className={cn(
                    'flex-1 h-9 rounded-md text-sm font-medium border transition-colors',
                    form.type === t
                      ? t === 'income'
                        ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30'
                        : 'bg-destructive/10 text-destructive border-destructive/30'
                      : 'border-input text-muted-foreground hover:bg-muted'
                  )}>
                  {t === 'income' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data</label>
            <input type="date" value={form.date} onChange={set('date')} required className={FIELD} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição</label>
            <input type="text" value={form.description} onChange={set('description')} placeholder="Ex: Supermercado Extra" required className={FIELD} />
          </div>

          {/* Amount + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0,00" required className={FIELD} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoria</label>
              <select value={form.category} onChange={set('category')} className={FIELD}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Instituição</label>
            <input type="text" value={form.institution} onChange={set('institution')} placeholder="Ex: Nubank" className={FIELD} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={BTN_GHOST}>Cancelar</button>
            <button type="submit" className={BTN_PRIMARY}>{tx ? 'Salvar alterações' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const pct   = Math.round(score * 100)
  const color = score >= 0.95 ? 'text-[hsl(var(--success))]' : score >= 0.75 ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--destructive))]'
  return <span className={cn('font-mono text-xs tabular-nums', color)}>{pct}%</span>
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ tx, onClose, onConfirm }: { tx: Transaction; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground">Remover transação?</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{tx.description}</span> será removida permanentemente.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={BTN_GHOST}>Cancelar</button>
          <button onClick={onConfirm} className="h-9 px-4 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity">
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function TransactionsPage() {
  const { txList, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<'all'|'income'|'expense'|'review'>('all')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [modal,   setModal]   = useState<'add'|Transaction|null>(null)
  const [delTx,   setDelTx]   = useState<Transaction|null>(null)

  const filtered = useMemo(() => {
    let list = txList
    if (filter === 'income')  list = list.filter(t => t.type === 'income')
    if (filter === 'expense') list = list.filter(t => t.type === 'expense')
    if (filter === 'review')  list = list.filter(t => !t.isConfirmed)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    }
    return list
  }, [txList, filter, search])

  function confirmCategory(id: string, category: Category) {
    const tx = txList.find(t => t.id === id)
    if (tx) updateTransaction({ ...tx, category, isConfirmed: true })
    setEditingCat(null)
    toast.success('Categoria atualizada')
  }

  function handleSave(tx: Transaction) {
    if (modal === 'add') {
      addTransaction(tx)
      toast.success('Transação adicionada')
    } else {
      updateTransaction(tx)
      toast.success('Transação atualizada')
    }
    setModal(null)
  }

  function handleDelete() {
    if (!delTx) return
    deleteTransaction(delTx.id)
    toast.success('Transação removida')
    setDelTx(null)
  }

  const totalIncome  = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const pendingCount = txList.filter(t => !t.isConfirmed).length

  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{txList.length} lançamentos — Maio 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-[hsl(var(--success))] tabular-nums">+{fmtBRL(totalIncome)}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono text-[hsl(var(--destructive))] tabular-nums">{fmtBRL(totalExpense)}</span>
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Nova transação
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transações…"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {(['all','income','expense','review'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'h-8 px-3 text-xs font-medium rounded transition-colors',
                filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : f === 'expense' ? 'Despesas' : `Revisar (${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Confiança IA</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Valor</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(tx => (
              <tr key={tx.id} className={cn(
                'border-b border-border last:border-0 transition-colors group',
                !tx.isConfirmed ? 'bg-destructive/3' : 'hover:bg-muted/30'
              )}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(tx.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-2">
                    {tx.isRecurring && <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" aria-label="Recorrente" />}
                    <span className="truncate text-foreground">{tx.description}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.institution}</p>
                </td>
                <td className="px-4 py-3">
                  {editingCat === tx.id ? (
                    <select defaultValue={tx.category} autoFocus
                      onChange={e => confirmCategory(tx.id, e.target.value as Category)}
                      onBlur={() => setEditingCat(null)}
                      className="h-7 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => setEditingCat(tx.id)}>
                      <CategoryBadge category={tx.category} confidence={tx.aiConfidence} size="sm" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3"><ConfidenceBadge score={tx.aiConfidence} /></td>
                <td className="px-4 py-3 text-right">
                  <Currency value={tx.amount} size="sm" color="auto" />
                </td>
                <td className="px-4 py-3 text-center">
                  {tx.isConfirmed
                    ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] inline" />
                    : <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))] inline" />}
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal(tx)}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDelTx(tx)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">Nenhuma transação encontrada.</div>
        )}
      </div>

      {/* Modals */}
      {modal !== null && (
        <TransactionModal
          tx={modal === 'add' ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {delTx && (
        <DeleteConfirm tx={delTx} onClose={() => setDelTx(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}
