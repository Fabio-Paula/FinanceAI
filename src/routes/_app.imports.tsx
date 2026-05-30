import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react'
import { IMPORTS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/imports')({ component: ImportPage })

const STATUS_MAP = {
  done:       { label: 'Concluído',   icon: CheckCircle2, cls: 'text-[hsl(var(--success))]' },
  processing: { label: 'Processando', icon: Loader2,      cls: 'text-[hsl(var(--accent))] animate-spin' },
  pending:    { label: 'Pendente',    icon: AlertCircle,  cls: 'text-muted-foreground' },
  error:      { label: 'Erro',        icon: X,            cls: 'text-[hsl(var(--destructive))]' },
} as const

export function ImportPage() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile]         = useState<File | null>(null)
  const [step, setStep]         = useState<'upload'|'mapping'|'processing'|'done'>('upload')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function startUpload(f: File) { setFile(f); setStep('mapping') }

  function startProcessing() {
    setStep('processing')
    let p = 0
    const id = setInterval(() => {
      p += Math.random() * 15
      if (p >= 100) { p = 100; clearInterval(id); setStep('done') }
      setProgress(Math.min(p, 100))
    }, 250)
  }

  const MOCK_COLUMNS = ['Data', 'Histórico', 'Valor', 'Saldo', 'Tipo']
  const FIELD_MAP: Record<string, string> = { 'Data': 'date', 'Histórico': 'description', 'Valor': 'amount' }
  const STEPS = ['upload', 'mapping', 'processing', 'done'] as const
  const STEP_LABELS = { upload: 'Upload', mapping: 'Colunas', processing: 'Processar', done: 'Concluído' }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Importar Extrato</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Importe CSVs de qualquer banco — a IA categoriza automaticamente.</p>
      </div>

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
        <div onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) startUpload(f) }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          )}>
          <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden"
            onChange={e => e.target.files?.[0] && startUpload(e.target.files[0])} />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Arraste o CSV ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">Suporta extratos do Nubank, Itaú, Bradesco, C6, XP e mais</p>
        </div>
      )}

      {step === 'mapping' && file && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB — Nubank detectado</p>
            </div>
            <button onClick={() => { setFile(null); setStep('upload') }} className="p-1 rounded hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">Mapeamento de Colunas</p>
            <p className="text-xs text-muted-foreground">Confirme que as colunas detectadas estão corretas.</p>
            <div className="space-y-2">
              {MOCK_COLUMNS.map(col => (
                <div key={col} className="flex items-center gap-4">
                  <span className="w-28 text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{col}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <select defaultValue={FIELD_MAP[col] || ''}
                    className="h-7 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Ignorar</option>
                    <option value="date">Data</option>
                    <option value="description">Descrição</option>
                    <option value="amount">Valor</option>
                    <option value="balance">Saldo</option>
                  </select>
                  {FIELD_MAP[col] && <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={startProcessing} className="w-full h-10 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity">
            Processar com IA
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Categorizando com IA…</p>
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% concluído</p>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-lg border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 p-8 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-[hsl(var(--success))] mx-auto" />
          <p className="text-sm font-semibold text-foreground">Importação concluída!</p>
          <p className="text-xs text-muted-foreground">18 transações importadas · 16 categorizadas · 2 para revisar</p>
          <button onClick={() => setStep('upload')} className="mt-2 h-8 px-4 bg-background border border-border text-sm rounded-md hover:bg-muted transition-colors">
            Nova importação
          </button>
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {IMPORTS.map(imp => {
            const { label, icon: Icon, cls } = STATUS_MAP[imp.status as keyof typeof STATUS_MAP]
            return (
              <div key={imp.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{imp.filename}</p>
                  <p className="text-xs text-muted-foreground">{imp.institution} · {new Date(imp.date).toLocaleDateString('pt-BR')}</p>
                </div>
                {imp.rows > 0 && <span className="text-xs text-muted-foreground font-mono">{imp.rows} linhas</span>}
                <div className="flex items-center gap-1.5 text-xs">
                  <Icon className={cn('h-3.5 w-3.5', cls)} />
                  <span className={cls}>{label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
