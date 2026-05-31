import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Check, X,
  TrendingUp, TrendingDown, Wallet, CheckCircle2, Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import { useMonth } from '@/lib/month-context'
import type { RecurringItem, RecurringEntry } from '@/types'

export const Route = createFileRoute('/_app/recorrentes')({ component: RecorrentesPage })

// ── helpers ───────────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const INPUT = 'h-8 px-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full'

// ── types ─────────────────────────────────────────────────────────────────────

type Tab = 'mes' | 'gerenciar'

interface ItemWithEntry extends RecurringItem {
  entry?: RecurringEntry
}

interface FormState {
  description: string
  type: 'income' | 'expense'
  day_of_month: string
  notes: string
}

// ── Modal criar/editar item ───────────────────────────────────────────────────

function ItemModal({
  item, onClose, onSaved,
}: {
  item?: RecurringItem
  onClose: () => void
  onSaved: (saved: RecurringItem) => void
}) {
  const [form, setForm] = useState<FormState>({
    description:  item?.description  ?? '',
    type:         item?.type         ?? 'expense',
    day_of_month: item?.day_of_month?.toString() ?? '',
    notes:        item?.notes        ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSave() {
    if (!form.description.trim()) { toast.error('Informe a descrição.'); return }
    setSaving(true)
    try {
      const payload = {
        description:  form.description.trim(),
        type:         form.type,
        day_of_month: form.day_of_month ? Number(form.day_of_month) : null,
        notes:        form.notes.trim() || null,
      }
      const res = item
        ? await apiPatch<{ data: RecurringItem }>(`/api/recurrents/${item.id}`, payload)
        : await apiPost<{ data: RecurringItem }>('/api/recurrents', payload)
      onSaved(res.data)
      toast.success(item ? 'Item atualizado' : 'Item criado')
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-5 space-y-4"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 className="text-base font-semibold text-foreground">
          {item ? 'Editar item' : 'Novo item recorrente'}
        </h2>

        <div className="space-y-3">
          {/* Tipo */}
          <div className="flex rounded-lg border border-input overflow-hidden">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type: t }))}
                className={cn(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {t === 'expense' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <input
              autoFocus
              type="text"
              value={form.description}
              onChange={set('description')}
              placeholder="Ex: Aluguel, Salário, Netflix…"
              className={INPUT}
            />
          </div>

          {/* Dia do mês */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Dia de vencimento/recebimento <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.day_of_month}
              onChange={set('day_of_month')}
              placeholder="Ex: 5"
              className={INPUT}
            />
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Notas <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Observações…"
              className={cn(INPUT, 'h-auto resize-none py-1.5')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="h-9 px-4 border border-input text-sm rounded-md hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Salvando…' : item ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm delete modal ──────────────────────────────────────────────────────

function DeleteConfirm({
  description, onClose, onConfirm,
}: { description: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground">Remover item?</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{description}</span> e todos os lançamentos
          mensais associados serão removidos permanentemente.
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

// ── Amount inline edit cell ───────────────────────────────────────────────────

function AmountCell({
  item, month, onSaved, onDeleted,
}: {
  item: ItemWithEntry
  month: string
  onSaved: (entry: RecurringEntry) => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(
    item.entry ? String(parseFloat(item.entry.amount)) : ''
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) { toast.error('Valor inválido'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`/api/recurrents/${item.id}/entry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month_ref: month, amount: num, is_paid: item.entry?.is_paid ?? false }),
      })
      if (!resp.ok) throw new Error('Erro ao salvar')
      const data = await resp.json() as { data: RecurringEntry }
      onSaved(data.data)
      setEditing(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!item.entry) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const resp = await fetch(`/api/recurrents/${item.id}/entry/${item.entry.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Erro ao remover')
      onDeleted()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min="0.01"
          step="0.01"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); void save() }
            if (e.key === 'Escape') setEditing(false)
          }}
          className="h-7 w-28 px-2 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={() => void save()}
          disabled={saving}
          className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => { setValue(item.entry ? String(parseFloat(item.entry.amount)) : ''); setEditing(true) }}
        className={cn(
          'font-mono text-sm tabular-nums px-2 py-0.5 rounded hover:bg-muted transition-colors text-right',
          item.entry ? 'text-foreground' : 'text-muted-foreground/50',
        )}
        title="Clique para definir o valor deste mês"
      >
        {item.entry ? BRL(parseFloat(item.entry.amount)) : <span className="text-xs">— definir</span>}
      </button>
      {item.entry && (
        <button
          onClick={() => void handleDelete()}
          disabled={saving}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
          title="Remover valor deste mês"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ── Paid toggle ───────────────────────────────────────────────────────────────

function PaidToggle({
  item, month, onSaved,
}: {
  item: ItemWithEntry
  month: string
  onSaved: (entry: RecurringEntry) => void
}) {
  const [saving, setSaving] = useState(false)

  async function toggle() {
    if (!item.entry) { toast.error('Defina o valor antes de marcar como pago.'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const resp  = await fetch(`/api/recurrents/${item.id}/entry/${item.entry.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          is_paid:   !item.entry.is_paid,
          paid_date: !item.entry.is_paid ? new Date().toISOString().slice(0, 10) : null,
        }),
      })
      if (!resp.ok) throw new Error('Erro ao atualizar')
      const data = await resp.json() as { data: RecurringEntry }
      onSaved(data.data)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={saving}
      title={item.entry?.is_paid ? 'Marcar como não pago' : 'Marcar como pago'}
      className={cn(
        'p-1 rounded transition-colors',
        item.entry?.is_paid
          ? 'text-[hsl(var(--success))] hover:text-[hsl(var(--success))]/70'
          : 'text-muted-foreground/40 hover:text-muted-foreground',
      )}
    >
      {item.entry?.is_paid
        ? <CheckCircle2 className="h-4 w-4" />
        : <Circle       className="h-4 w-4" />}
    </button>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  items, month, onEntryUpdated, onEntryDeleted,
}: {
  items: ItemWithEntry[]
  month: string
  onEntryUpdated: (itemId: string, entry: RecurringEntry) => void
  onEntryDeleted: (itemId: string) => void
}) {
  const incomes  = items.filter(i => i.type === 'income')
  const expenses = items.filter(i => i.type === 'expense')

  const totalIncome  = incomes.reduce((s, i) => s + (i.entry ? parseFloat(i.entry.amount) : 0), 0)
  const totalExpense = expenses.reduce((s, i) => s + (i.entry ? parseFloat(i.entry.amount) : 0), 0)
  const balance      = totalIncome - totalExpense

  const paidExpense  = expenses.filter(i => i.entry?.is_paid).reduce((s, i) => s + parseFloat(i.entry!.amount), 0)

  function ItemTable({
    rows, type,
  }: { rows: ItemWithEntry[]; type: 'income' | 'expense' }) {
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum item cadastrado. Adicione na aba <span className="font-medium">Gerenciar</span>.
        </p>
      )
    }
    const isIncome = type === 'income'
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Descrição</th>
            <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground w-10">Dia</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground w-40">Valor do mês</th>
            {!isIncome && (
              <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground w-10">Pago</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(item => (
            <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5">
                <span className="text-foreground font-medium">{item.description}</span>
                {item.notes && (
                  <span className="block text-xs text-muted-foreground mt-0.5">{item.notes}</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {item.day_of_month ? (
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {item.day_of_month}
                  </span>
                ) : (
                  <span className="text-muted-foreground/30 text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <AmountCell
                  item={item}
                  month={month}
                  onSaved={entry => onEntryUpdated(item.id, entry)}
                  onDeleted={() => onEntryDeleted(item.id)}
                />
              </td>
              {!isIncome && (
                <td className="px-3 py-2.5 text-center">
                  <PaidToggle
                    item={item}
                    month={month}
                    onSaved={entry => onEntryUpdated(item.id, entry)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 border-t border-border">
            <td colSpan={2} className="px-4 py-2 text-xs font-medium text-muted-foreground">
              Total — {rows.filter(i => i.entry).length}/{rows.length} com valor
            </td>
            <td className="px-4 py-2 text-right">
              <span className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]',
              )}>
                {BRL(isIncome ? totalIncome : totalExpense)}
              </span>
            </td>
            {!isIncome && (
              <td className="px-3 py-2 text-center">
                <span className="text-xs text-muted-foreground">
                  {rows.filter(i => i.entry?.is_paid).length}/{rows.length}
                </span>
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Receitas previstas
          </div>
          <p className="font-mono text-lg font-semibold text-[hsl(var(--success))] tabular-nums">{BRL(totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            Despesas previstas
          </div>
          <p className="font-mono text-lg font-semibold text-[hsl(var(--destructive))] tabular-nums">{BRL(totalExpense)}</p>
          {paidExpense > 0 && (
            <p className="text-xs text-muted-foreground">Pago: {BRL(paidExpense)}</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            Saldo previsto
          </div>
          <p className={cn(
            'font-mono text-lg font-semibold tabular-nums',
            balance >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]',
          )}>
            {BRL(balance)}
          </p>
        </div>
      </div>

      {/* Receitas */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
          Receitas fixas
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <ItemTable rows={incomes} type="income" />
        </div>
      </div>

      {/* Despesas */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-[hsl(var(--destructive))]" />
          Despesas fixas
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <ItemTable rows={expenses} type="expense" />
        </div>
      </div>
    </div>
  )
}

// ── Manage view ───────────────────────────────────────────────────────────────

function ManageView({
  items, onEdit, onDelete,
}: {
  items: RecurringItem[]
  onEdit:   (item: RecurringItem) => void
  onDelete: (item: RecurringItem) => void
}) {
  const incomes  = items.filter(i => i.type === 'income')
  const expenses = items.filter(i => i.type === 'expense')

  function Section({ rows, type }: { rows: RecurringItem[]; type: 'income' | 'expense' }) {
    const isIncome = type === 'income'
    if (rows.length === 0) return null
    return (
      <div>
        <h3 className={cn(
          'text-xs font-semibold uppercase tracking-wider mb-2 px-1',
          isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]',
        )}>
          {isIncome ? 'Receitas' : 'Despesas'} ({rows.length})
        </h3>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground w-20">Dia</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Notas</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {rows.map(item => (
                <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground">{item.description}</td>
                  <td className="px-3 py-2.5 text-center">
                    {item.day_of_month ? (
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        dia {item.day_of_month}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">
                    {item.notes ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        Nenhum item cadastrado ainda. Clique em <span className="font-medium text-foreground">+ Novo item</span> para começar.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Section rows={incomes}  type="income"  />
      <Section rows={expenses} type="expense" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function RecorrentesPage() {
  const { monthKey, monthLabel } = useMonth()
  const [tab,   setTab]   = useState<Tab>('mes')

  const [items,   setItems]   = useState<ItemWithEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [modal,      setModal]      = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<RecurringItem | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<RecurringItem | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet<{ data: (RecurringItem & { entries: RecurringEntry[] })[] }>(`/api/recurrents?month=${monthKey}`)
      setItems(res.data.map(item => ({ ...item, entry: item.entries?.[0] })))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar itens')
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => { void fetchItems() }, [fetchItems])

  function handleItemSaved(saved: RecurringItem) {
    setItems(prev => {
      const exists = prev.find(i => i.id === saved.id)
      if (exists) return prev.map(i => i.id === saved.id ? { ...i, ...saved } : i)
      return [...prev, { ...saved, entry: undefined }]
    })
  }

  function handleEntryUpdated(itemId: string, entry: RecurringEntry) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, entry } : i))
  }

  function handleEntryDeleted(itemId: string) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, entry: undefined } : i))
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiDelete(`/api/recurrents/${deleteTarget.id}`)
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
      toast.success('Item removido')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover')
    } finally {
      setDeleteTarget(null)
    }
  }

  const allItems = items as RecurringItem[]

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Recorrentes</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">
          {monthLabel} — receitas e despesas fixas com valores mensais variáveis
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-0">
          {([['mes', 'Visão do mês'], ['gerenciar', 'Gerenciar itens']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditTarget(undefined); setModal('create') }}
          className="flex items-center gap-1.5 h-8 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity mb-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo item
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Carregando…</div>
      ) : tab === 'mes' ? (
        <MonthView
          items={items}
          month={monthKey}
          onEntryUpdated={handleEntryUpdated}
          onEntryDeleted={handleEntryDeleted}
        />
      ) : (
        <ManageView
          items={allItems}
          onEdit={item => { setEditTarget(item); setModal('edit') }}
          onDelete={item => setDeleteTarget(item)}
        />
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <ItemModal
          item={modal === 'edit' ? editTarget : undefined}
          onClose={() => setModal(null)}
          onSaved={handleItemSaved}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          description={deleteTarget.description}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  )
}
