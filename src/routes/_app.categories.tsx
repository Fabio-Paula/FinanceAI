import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  CalendarIcon,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CATEGORY_COLORS } from '@/components/ui/category-badge'
import type { CategoryKey } from '@/components/ui/category-badge'
import type { Transaction, Category, CursorPage } from '@/types'
import { Currency } from '@/components/ui/currency'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTransactions, type TxInput } from '@/lib/transactions-store'
import { useMonth } from '@/lib/month-context'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/_app/categories')({ component: CategoriesPage })

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS = { income: 'Receita', expense: 'Despesa', both: 'Ambos' }
const TYPE_COLORS = {
  income: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10',
  expense: 'text-[hsl(var(--destructive))] bg-destructive/10',
  both: 'text-muted-foreground bg-muted',
}

function categoryType(name: string): 'income' | 'expense' | 'both' {
  if (['Salário', 'Investimentos'].includes(name)) return 'income'
  if (name === 'Outros') return 'both'
  return 'expense'
}

function catColor(cat: Category): string {
  if (cat.color) return cat.color
  return CATEGORY_COLORS[cat.name as CategoryKey]?.hex ?? '#64748B'
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const INPUT =
  'h-7 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring w-full'

const PAGE_LIMIT = 50

const PALETTE = [
  '#2D7D46',
  '#16A34A',
  '#C2410C',
  '#D97706',
  '#1D4ED8',
  '#2563EB',
  '#7C3AED',
  '#9333EA',
  '#0891B2',
  '#0D9488',
  '#DB2777',
  '#EC4899',
  '#64748B',
  '#374151',
  '#1E3A5F',
  '#DC2626',
]

// ── Delete tx confirm modal ───────────────────────────────────────────────────

function DeleteTxConfirm({
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

// ── Category modal (create / edit) ────────────────────────────────────────────

interface CategoryForm {
  name: string
  color: string
  type: 'income' | 'expense' | 'both'
}

function CategoryModal({
  category,
  open,
  onClose,
  onSave,
  isSaving,
}: {
  category: Category | null
  open: boolean
  onClose: () => void
  onSave: (data: CategoryForm) => void
  isSaving: boolean
}) {
  const isEdit = !!category
  const [form, setForm] = useState<CategoryForm>({
    name: category?.name ?? '',
    color: category?.color ?? PALETTE[0],
    type: category?.type ?? 'expense',
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: category?.name ?? '',
        color: category?.color ?? PALETTE[0],
        type: category?.type ?? 'expense',
      })
    }
  }, [open, category])

  function submit() {
    if (!form.name.trim()) {
      toast.error('Informe um nome para a categoria.')
      return
    }
    onSave({ ...form, name: form.name.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ex: Academia"
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v as CategoryForm['type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color palette */}
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: hex }))}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                    form.color === hex ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ background: hex }}
                  title={hex}
                />
              ))}
            </div>
            {/* Preview + custom hex */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-6 h-6 rounded-full border border-border shrink-0"
                style={{ background: form.color }}
              />
              <Input
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className="h-7 text-xs font-mono w-28"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete category confirm ───────────────────────────────────────────────────

function DeleteCategoryConfirm({
  category,
  onClose,
  onConfirm,
  isDeleting,
}: {
  category: Category | null
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  return (
    <Dialog open={!!category} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir categoria?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A categoria <span className="font-medium text-foreground">{category?.name}</span> será
          excluída permanentemente. Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  categories,
  txCount,
  onNew,
  onEdit,
  onDelete,
}: {
  categories: Category[]
  txCount: Record<string, number>
  onNew: () => void
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={onNew}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova categoria
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                Categoria
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                Tipo
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                Transações
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                Origem
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const type = cat.type
              const count = txCount[cat.name] ?? 0
              const color = catColor(cat)

              return (
                <tr
                  key={cat.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="font-medium text-foreground">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        TYPE_COLORS[type]
                      )}
                    >
                      {TYPE_LABELS[type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                    {count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cat.is_system ? (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Sistema
                      </span>
                    ) : (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Minha
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {!cat.is_system && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(cat)}
                          className="h-6 w-6"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(cat)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={count > 0 ? `${count} transação(ões) vinculada(s)` : 'Excluir'}
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
      </div>
    </div>
  )
}

// ── Inline edit row ───────────────────────────────────────────────────────────

interface EditState {
  date: string
  description: string
  amount: string
}

function EditRow({
  tx,
  onSave,
  onCancel,
}: {
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
    setF((prev) => ({ ...prev, [k]: e.target.value }))

  function save() {
    const raw = parseFloat(f.amount)
    if (!f.description.trim() || isNaN(raw) || raw <= 0) {
      toast.error('Preencha todos os campos.')
      return
    }
    onSave({ date: f.date, description: f.description.trim(), amount: f.amount })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <tr className="border-t border-border bg-primary/5">
      <td className="px-4 py-1.5" style={{ width: 148 }}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-7 px-2 w-full justify-start text-xs font-normal',
                !f.date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3 opacity-50 shrink-0" />
              {f.date ? format(parseISO(f.date), 'dd/MM/yyyy') : 'Data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={f.date ? parseISO(f.date) : undefined}
              onSelect={(date) => date && setF((p) => ({ ...p, date: format(date, 'yyyy-MM-dd') }))}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="px-4 py-1.5">
        <input
          type="text"
          value={f.description}
          onChange={set('description')}
          onKeyDown={onKeyDown}
          className={INPUT}
          autoFocus
        />
      </td>
      <td className="px-4 py-1.5 text-right" style={{ width: 130 }}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={f.amount}
          onChange={set('amount')}
          onKeyDown={onKeyDown}
          placeholder="0,00"
          className={cn(INPUT, 'text-right')}
        />
      </td>
      <td className="px-3 py-1.5" style={{ width: 60 }}>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={save}
            className="h-6 w-6 text-primary hover:bg-primary/10"
            title="Salvar (Enter)"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-6 w-6"
            title="Cancelar (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ── Quick-add row ─────────────────────────────────────────────────────────────

interface QuickForm {
  date: string
  description: string
  amount: string
}

function QuickAddRow({
  category,
  txType,
  onAdd,
  onClose,
  categories,
}: {
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
    setF((prev) => ({ ...prev, [k]: e.target.value }))

  const submit = useCallback(() => {
    const raw = parseFloat(f.amount)
    if (!f.description.trim() || isNaN(raw) || raw <= 0) {
      toast.error('Informe descrição e valor.')
      descRef.current?.focus()
      return
    }
    const categoryObj = categories.find((c) => c.name === category)
    onAdd({
      date: f.date,
      description: f.description.trim(),
      amount: f.amount,
      type: defaultType,
      category_id: categoryObj?.id ?? null,
    })
    setF((prev) => ({ ...prev, description: '', amount: '' }))
    descRef.current?.focus()
  }, [f, category, defaultType, onAdd, categories])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <tr className="border-t-2 border-primary/30 bg-primary/5">
      <td className="px-4 py-2" style={{ width: 148 }}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-7 px-2 w-full justify-start text-xs font-normal',
                !f.date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3 opacity-50 shrink-0" />
              {f.date ? format(parseISO(f.date), 'dd/MM/yyyy') : 'Data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={f.date ? parseISO(f.date) : undefined}
              onSelect={(date) => date && setF((p) => ({ ...p, date: format(date, 'yyyy-MM-dd') }))}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="px-4 py-2">
        <input
          ref={descRef}
          autoFocus
          type="text"
          value={f.description}
          onChange={set('description')}
          onKeyDown={onKeyDown}
          placeholder="Descrição… (Enter para adicionar, Esc para fechar)"
          className={INPUT}
        />
      </td>
      <td className="px-4 py-2 text-right" style={{ width: 130 }}>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={f.amount}
          onChange={set('amount')}
          onKeyDown={onKeyDown}
          placeholder="0,00"
          className={cn(INPUT, 'text-right')}
        />
      </td>
      <td className="pl-2 pr-4 py-2" style={{ width: 64 }}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 flex items-center justify-center">
            <Button
              variant="default"
              size="icon"
              onClick={submit}
              className="h-6 w-6"
              title="Adicionar (Enter)"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 rounded hover:bg-muted/30 hover:text-foreground mr-3"
            title="Fechar (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ── Detail tab ────────────────────────────────────────────────────────────────

function DetailTab({
  grouped,
  onAdd,
  onUpdate,
  onDelete,
  categories,
  isReadOnly,
  isLoading,
  isFetchingNextPage,
  sentinelRef,
}: {
  grouped: Record<string, { tx: Transaction[]; total: number }>
  onAdd: (data: TxInput) => void
  onUpdate: (id: string, data: Partial<TxInput>) => void
  onDelete: (id: string) => void
  categories: Category[]
  isReadOnly: boolean
  isLoading: boolean
  isFetchingNextPage: boolean
  sentinelRef: React.RefObject<HTMLDivElement>
}) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [quickAdds, setQuickAdds] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  const toggleOpen = (name: string) =>
    setOpen((prev) => {
      const s = new Set(prev)
      if (s.has(name)) s.delete(name)
      else s.add(name)
      return s
    })

  const openQuickAdd = (name: string) => setQuickAdds((prev) => new Set(prev).add(name))

  const closeQuickAdd = (name: string) =>
    setQuickAdds((prev) => {
      const s = new Set(prev)
      s.delete(name)
      return s
    })

  const catNames = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  )

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (catNames.length === 0)
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        Nenhuma transação encontrada.
      </div>
    )

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
        {catNames.map((name) => {
          const { tx: txs, total } = grouped[name] ?? { tx: [], total: 0 }
          const isOpen = open.has(name)
          const showAdd = quickAdds.has(name)
          const catObj = categories.find((c) => c.name === name)
          const color = catObj
            ? catColor(catObj)
            : (CATEGORY_COLORS[name as CategoryKey]?.hex ?? '#64748B')
          const type = catObj?.type ?? categoryType(name)
          const sorted = [...txs].sort((a, b) =>
            a.description.localeCompare(b.description, 'pt-BR', { sensitivity: 'base' })
          )

          return (
            <div key={name} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleOpen(name)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left min-w-0"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <span className="font-medium text-foreground flex-1 truncate">{name}</span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium mr-3 shrink-0',
                    TYPE_COLORS[type]
                  )}
                >
                  {TYPE_LABELS[type]}
                </span>
                <span className="text-xs text-muted-foreground mr-4 shrink-0 tabular-nums">
                  {txs.length} {txs.length === 1 ? 'transação' : 'transações'}
                </span>
                <span
                  className={cn(
                    'font-mono text-sm font-semibold tabular-nums shrink-0',
                    type === 'income' ? 'text-[hsl(var(--success))]' : 'text-foreground'
                  )}
                >
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    total
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: 148 }} />
                      <col />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 74 }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Data
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                          Descrição
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                          Valor
                        </th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((tx) => {
                        const signedAmount =
                          tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)
                        return !isReadOnly && editing === tx.id ? (
                          <EditRow
                            key={tx.id}
                            tx={tx}
                            onSave={(patch) => handleSave(tx, patch)}
                            onCancel={() => setEditing(null)}
                          />
                        ) : (
                          <tr
                            key={tx.id}
                            className="border-t border-border/50 hover:bg-muted/20 transition-colors group"
                          >
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
                              {new Date(tx.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-2.5 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {tx.is_recurring && (
                                  <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-foreground truncate">{tx.description}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right whitespace-nowrap overflow-hidden">
                              <Currency value={signedAmount} size="sm" color="auto" />
                            </td>
                            <td className="px-3 py-2.5">
                              {!isReadOnly && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditing(tx.id)}
                                    className="h-6 w-6"
                                    title="Editar"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingTx(tx)}
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Remover"
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
                        <tr
                          className="border-t border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => openQuickAdd(name)}
                        >
                          <td colSpan={4} className="px-4 py-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Plus className="h-3.5 w-3.5" />
                              Novo lançamento
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr className="border-t border-border bg-muted/20">
                        <td
                          colSpan={2}
                          className="px-4 py-2 text-xs font-medium text-muted-foreground"
                        >
                          Total — {name}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <span
                            className={cn(
                              'font-mono text-sm font-semibold tabular-nums',
                              type === 'income'
                                ? 'text-[hsl(var(--success))]'
                                : 'text-[hsl(var(--destructive))]'
                            )}
                          >
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(total)}
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

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px" />
      {isFetchingNextPage && (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <DeleteTxConfirm
        tx={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { isReadOnly, monthKey } = useMonth()
  const queryClient = useQueryClient()

  const [year, month] = monthKey.split('-').map(Number)
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  // Category modal state
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['transactions-infinite', monthKey] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT), from, to })
      if (pageParam) params.set('cursor', pageParam)
      return apiGet<CursorPage<Transaction>>(`/api/transactions?${params}`)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  })

  const txList = data?.pages.flatMap((p) => p.data) ?? []

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/api/categories'),
  })
  const categories = categoriesData?.data ?? []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: { name: string; color: string; type: string }) =>
      apiPost<{ data: Category }>('/api/categories', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria criada')
      setModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: { name: string; color: string; type: string }
    }) => apiPatch<{ data: Category }>(`/api/categories/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria atualizada')
      setModalOpen(false)
      setEditingCat(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria excluída')
      setDeletingCat(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setDeletingCat(null)
    },
  })

  // Computed
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

  const { sentinelRef, containerRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  function openNew() {
    setEditingCat(null)
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditingCat(cat)
    setModalOpen(true)
  }

  function handleSaveCategory(form: { name: string; color: string; type: string }) {
    if (editingCat) {
      updateMutation.mutate({ id: editingCat.id, body: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed header */}
      <div className="shrink-0 px-6 pt-6 max-w-4xl mx-auto w-full">
        <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {categories.length > 0 ? `${categories.length} categorias` : 'Carregando categorias…'}
        </p>
      </div>

      {/* Tabs — fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col px-6 pb-6 max-w-4xl mx-auto w-full">
        <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 mt-5">
          <div className="shrink-0 border-b border-border">
            <TabsList className="h-auto justify-start gap-1 rounded-none border-0 bg-transparent p-0 text-muted-foreground">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 -mb-px font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Visão geral
              </TabsTrigger>
              <TabsTrigger
                value="detail"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 -mb-px font-medium text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Detalhamento por categoria
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 min-h-0 mt-4 overflow-y-auto">
            <OverviewTab
              categories={categories}
              txCount={txCount}
              onNew={openNew}
              onEdit={openEdit}
              onDelete={setDeletingCat}
            />
          </TabsContent>

          <TabsContent value="detail" className="flex-1 min-h-0 mt-4">
            <div ref={containerRef} className="overflow-y-auto h-full">
              <DetailTab
                grouped={grouped}
                onAdd={addTransaction}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
                categories={categories}
                isReadOnly={isReadOnly}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                sentinelRef={sentinelRef}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CategoryModal
        open={modalOpen}
        category={editingCat}
        onClose={() => {
          setModalOpen(false)
          setEditingCat(null)
        }}
        onSave={handleSaveCategory}
        isSaving={isSaving}
      />

      <DeleteCategoryConfirm
        category={deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={() => deletingCat && deleteMutation.mutate(deletingCat.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
