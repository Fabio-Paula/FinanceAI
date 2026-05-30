import { createFileRoute } from '@tanstack/react-router'
import { Plus, Zap, Trash2 } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/category-badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/ai-rules')({ component: AiRulesPage })

const MOCK_RULES = [
  { id: '1', pattern: 'ifood',       match_type: 'contains',    category: 'Restaurante',   priority: 100, times_applied: 12 },
  { id: '2', pattern: 'uber',        match_type: 'contains',    category: 'Transporte',    priority: 100, times_applied: 24 },
  { id: '3', pattern: 'netflix',     match_type: 'contains',    category: 'Streaming',     priority: 90,  times_applied: 8  },
  { id: '4', pattern: '^salário',    match_type: 'regex',       category: 'Salário',       priority: 110, times_applied: 6  },
  { id: '5', pattern: 'supermercado',match_type: 'contains',    category: 'Mercado',       priority: 80,  times_applied: 9  },
]

const MATCH_LABELS: Record<string, string> = {
  exact:       'Exato',
  contains:    'Contém',
  starts_with: 'Começa com',
  regex:       'Regex',
}

export function AiRulesPage() {
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Regras de IA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ensine a IA a categorizar automaticamente por padrões de texto</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Nova regra
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-accent/20 bg-accent/5 text-sm">
        <Zap className="h-4 w-4 text-[hsl(var(--accent))] mt-0.5 shrink-0" />
        <p className="text-muted-foreground">
          Regras com maior <strong className="text-foreground">prioridade</strong> são aplicadas primeiro.
          A IA usa essas regras antes do modelo de linguagem, garantindo consistência nas categorizações.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Padrão</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Categoria</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Prioridade</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Aplicações</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {MOCK_RULES.sort((a, b) => b.priority - a.priority).map(rule => (
              <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground">{rule.pattern}</code>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{MATCH_LABELS[rule.match_type]}</span>
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge category={rule.category} size="sm" />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    'font-mono text-xs tabular-nums',
                    rule.priority >= 100 ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'
                  )}>{rule.priority}</span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{rule.times_applied}x</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
