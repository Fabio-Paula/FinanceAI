import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, CheckCircle2, Loader2, X, AlertCircle, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiDelete } from '@/lib/api'
import type { Import } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMonth } from '@/lib/month-context'

export const Route = createFileRoute('/_app/imports')({ component: ImportPage })

const STATUS_MAP = {
  done:       { label: 'Concluído',   icon: CheckCircle2, cls: 'text-[hsl(var(--success))]' },
  processing: { label: 'Processando', icon: Loader2,      cls: 'text-[hsl(var(--accent))] animate-spin' },
  pending:    { label: 'Pendente',    icon: AlertCircle,  cls: 'text-muted-foreground' },
  error:      { label: 'Erro',        icon: X,            cls: 'text-[hsl(var(--destructive))]' },
} as const

interface ImportResult {
  import_id: string
  total_rows: number
  created: number
  skipped: number
  errors: number
  months: string[]
}

const FIELD_OPTIONS = [
  { value: '',            label: 'Ignorar' },
  { value: 'date',        label: 'Data' },
  { value: 'description', label: 'Descrição' },
  { value: 'amount',      label: 'Valor' },
  { value: 'type',        label: 'Tipo (Débito/Crédito)' },
]

const REQUIRED_FIELDS = ['date', 'description', 'amount']

function detectHeaders(text: string): string[] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstLine = clean.split('\n').find(l => l.trim()) ?? ''
  const delimiter = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ';' : ','
  return firstLine.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
}

function autoSuggestMapping(cols: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  cols.forEach(col => {
    const lower = col.toLowerCase()
    if (/\bdata\b|date/.test(lower)) map[col] = 'date'
    else if (/hist[oó]rico|descri|title|memo|lan[çc]a/.test(lower)) map[col] = 'description'
    else if (/\bvalor\b|amount|value/.test(lower)) map[col] = 'amount'
    else if (/tipo|type|natureza|modalidade/.test(lower)) map[col] = 'type'
  })
  return map
}

export function ImportPage() {
  const { isReadOnly, monthLabel, monthKey } = useMonth()
  const queryClient = useQueryClient()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing' | 'done'>('upload')
  const [progress, setProgress] = useState(0)
  const [columns, setColumns] = useState<string[]>([])
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({})
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function deleteImport(importId: string) {
    setDeletingId(importId)
    try {
      const res = await apiDelete<{ data: { deleted_transactions: number } }>(`/api/imports/${importId}`)
      toast.success(`Importação removida · ${res.data.deleted_transactions} transações excluídas`)
      refetchImports()
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    } catch {
      toast.error('Erro ao remover importação')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const { data: importsData, refetch: refetchImports } = useQuery({
    queryKey: ['imports'],
    queryFn: () => apiGet<{ data: Import[] }>('/api/imports'),
  })
  const importHistory = importsData?.data ?? []

  async function startUpload(f: File) {
    setFile(f)
    setDuplicateWarning(null)
    const text = await f.text()
    const cols = detectHeaders(text)
    setColumns(cols)
    setFieldMap(autoSuggestMapping(cols))
    setStep('mapping')
  }

  async function startProcessing() {
    if (!file) return

    const mappedFields = Object.values(fieldMap).filter(Boolean)
    const missing = REQUIRED_FIELDS.filter(f => !mappedFields.includes(f))
    if (missing.length) {
      const labels: Record<string, string> = { date: 'Data', description: 'Descrição', amount: 'Valor' }
      toast.error(`Mapeie os campos obrigatórios: ${missing.map(f => labels[f]).join(', ')}`)
      return
    }

    setStep('processing')
    setProgress(20)

    // Invert: col → field  becomes  field → col
    const mapping: Record<string, string> = {}
    Object.entries(fieldMap).forEach(([col, field]) => {
      if (field) mapping[field] = col
    })

    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))

    try {
      const res = await fetch('/api/imports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: formData,
      })

      setProgress(85)

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}))
        setDuplicateWarning((err as { error?: string }).error ?? 'Arquivo já importado.')
        setStep('mapping')
        setProgress(0)
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Erro ao processar arquivo')
      }

      const json = await res.json() as { data: ImportResult }
      const result = json.data
      setImportResult(result)
      setProgress(100)
      setStep('done')

      refetchImports()
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })

      if (result.created === 0 && result.skipped > 0) {
        toast.warning(`Todas as ${result.skipped} linhas foram ignoradas — possíveis duplicatas ou dados inválidos.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na importação')
      setStep('mapping')
      setProgress(0)
    }
  }

  function reset() {
    setFile(null)
    setStep('upload')
    setProgress(0)
    setColumns([])
    setFieldMap({})
    setImportResult(null)
    setDuplicateWarning(null)
  }

  const canProcess = REQUIRED_FIELDS.every(f => Object.values(fieldMap).includes(f))

  const STEPS = ['upload', 'mapping', 'processing', 'done'] as const
  const STEP_LABELS = { upload: 'Upload', mapping: 'Colunas', processing: 'Processar', done: 'Concluído' }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Importar Extrato</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Importe CSVs de qualquer banco — a IA categoriza automaticamente.</p>
      </div>

      {isReadOnly ? (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center space-y-3">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground capitalize">
            Importação indisponível para {monthLabel}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Só é possível importar extratos no mês atual. Navegue para o mês corrente para fazer uma nova importação.
          </p>
        </div>
      ) : (
        <>
          {/* Progress steps */}
          <div className="flex items-center gap-2 text-xs">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={cn('h-px w-8 rounded', STEPS.indexOf(step) >= i ? 'bg-primary' : 'bg-border')} />}
                <span className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full font-medium border text-xs',
                  step === s ? 'bg-primary text-primary-foreground border-primary' :
                  STEPS.indexOf(step) > i ? 'bg-primary/20 text-primary border-primary/30' :
                  'bg-background text-muted-foreground border-border'
                )}>{i + 1}</span>
                <span className={cn('hidden sm:block', step === s ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {STEP_LABELS[s]}
                </span>
              </div>
            ))}
          </div>

          {step === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) startUpload(f) }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input ref={inputRef} type="file" accept=".csv" className="hidden"
                onChange={e => e.target.files?.[0] && startUpload(e.target.files[0])} />
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Arraste o CSV ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Suporta extratos do Nubank, Itaú, Bradesco, C6, XP e mais</p>
            </div>
          )}

          {step === 'mapping' && file && (
            <div className="space-y-4">
              {duplicateWarning && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs">{duplicateWarning} Para reimportar mesmo assim, renomeie o arquivo ou use outro extrato.</p>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {columns.length} colunas detectadas</p>
                </div>
                <Button variant="ghost" size="icon" onClick={reset} className="h-7 w-7">
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">Mapeamento de Colunas</p>
                <p className="text-xs text-muted-foreground">Confirme que as colunas do CSV estão mapeadas corretamente.</p>
                <div className="space-y-2">
                  {columns.map(col => (
                    <div key={col} className="flex items-center gap-4">
                      <span className="w-36 text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded truncate">{col}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <select
                        value={fieldMap[col] ?? ''}
                        onChange={e => setFieldMap(prev => ({ ...prev, [col]: e.target.value }))}
                        className="h-7 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {FIELD_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {fieldMap[col] && <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={startProcessing} className="w-full" disabled={!canProcess || !!duplicateWarning}>
                {canProcess ? 'Importar Transações' : 'Mapeie Data, Descrição e Valor para continuar'}
              </Button>
            </div>
          )}

          {step === 'processing' && (
            <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Processando arquivo…</p>
                <p className="text-xs text-muted-foreground">{Math.round(progress)}% concluído</p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {step === 'done' && importResult && (
            <div className="rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 p-8 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))] mx-auto" />
              <p className="text-sm font-semibold text-foreground">Importação concluída!</p>
              <p className="text-xs text-muted-foreground">
                {importResult.created} transações importadas
                {importResult.skipped > 0 && ` · ${importResult.skipped} ignoradas`}
                {importResult.errors > 0 && ` · ${importResult.errors} erros`}
              </p>
              {importResult.months.some(m => m !== monthKey) && importResult.months.length > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  Transações nos meses: {importResult.months.join(', ')} — navegue até o mês correto para visualizá-las.
                </p>
              )}
              <Button variant="outline" size="sm" onClick={reset} className="mt-2">
                Nova importação
              </Button>
            </div>
          )}
        </>
      )}

      {/* History */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {importHistory.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Nenhuma importação encontrada.</div>
          ) : (
            importHistory.map(imp => {
              const { label, icon: Icon, cls } = STATUS_MAP[imp.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending
              const isConfirming = confirmDeleteId === imp.id
              const isDeleting = deletingId === imp.id
              return (
                <div key={imp.id} className="flex items-center gap-3 px-4 py-3.5">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{imp.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {imp.institution ?? '—'} · {new Date(imp.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {(imp.total_rows ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">{imp.processed_rows ?? 0}/{imp.total_rows} linhas</span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Icon className={cn('h-3.5 w-3.5', cls)} />
                    <span className={cls}>{label}</span>
                  </div>
                  {isConfirming ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">Remover?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => deleteImport(imp.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                      >
                        Não
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setConfirmDeleteId(imp.id)}
                      title="Remover importação"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
