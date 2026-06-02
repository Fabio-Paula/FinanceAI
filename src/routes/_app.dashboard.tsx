import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, Repeat2, Loader2 } from 'lucide-react'
import { Currency } from '@/components/ui/currency'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import { useMonth } from '@/lib/month-context'
import { useTransactions } from '@/lib/transactions-store'
import type { RecurringItem, RecurringEntry, DashboardSummary, CategoryBreakdown } from '@/types'

export const Route = createFileRoute('/_app/dashboard')({ component: DashboardPage })

function KpiCard({ label, value, sub, trend, trendUp, recurringNote }: {
  label: string; value: number; sub: string; trend: string; trendUp: boolean
  recurringNote?: string
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Currency value={value} size="lg" color="muted" className="text-foreground" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trendUp
            ? <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
            : <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />}
          <span className={trendUp ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'}>{trend}</span>
          <span>{sub}</span>
        </div>
        {recurringNote && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
            <Repeat2 className="h-3 w-3 shrink-0" />
            <span>{recurringNote}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const INSIGHT_ICONS = {
  warning: <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" />,
  info:    <Info className="h-4 w-4 text-[hsl(var(--accent))]" />,
  success: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
} as const

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  const m = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${m[0].toUpperCase()}${m.slice(1)}/${String(year).slice(2)}`
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; color: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name === 'income' ? 'Receita' : 'Despesa'}:</span>
          <span className="font-mono text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-md text-xs">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
        <span className="text-muted-foreground">{p.name}:</span>
        <span className="font-mono text-foreground">{fmt(p.value)}</span>
      </div>
    </div>
  )
}

type RecurringWithEntry = RecurringItem & { entries: RecurringEntry[] }

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(v))

function generateInsights(summary: DashboardSummary, topCategories: CategoryBreakdown[]) {
  const items: Array<{ id: number; type: 'warning' | 'info' | 'success'; text: string }> = []
  if (summary.pendingReview > 0) {
    items.push({ id: 1, type: 'info', text: `${summary.pendingReview} transaç${summary.pendingReview === 1 ? 'ão aguarda' : 'ões aguardam'} revisão de categoria.` })
  }
  if (summary.balance > 0) {
    items.push({ id: 2, type: 'success', text: `Saldo positivo de ${fmt(summary.balance)} este mês.` })
  } else if (summary.balance < 0) {
    items.push({ id: 3, type: 'warning', text: `Saldo negativo de ${fmt(Math.abs(summary.balance))} este mês.` })
  }
  if (topCategories.length > 0) {
    const top = topCategories[0]
    items.push({ id: 4, type: 'info', text: `Maior categoria de gasto: ${top.category_name} (${fmt(top.total)}, ${top.percentage.toFixed(0)}% do total).` })
  }
  if (items.length === 0) {
    items.push({ id: 5, type: 'info', text: 'Nenhuma transação encontrada para este mês.' })
  }
  return items
}

export function DashboardPage() {
  const { monthKey, monthLabel } = useMonth()
  const { txList } = useTransactions()

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary', monthKey],
    queryFn: () => apiGet<{ data: DashboardSummary }>(`/api/dashboard/summary?month=${monthKey}`),
  })

  const { data: trendData } = useQuery({
    queryKey: ['dashboard-trend'],
    queryFn: () => apiGet<{ data: Array<{ month: string; income: number; expense: number; balance: number }> }>('/api/dashboard/monthly-trend?months=7'),
  })

  const { data: byCategoryData } = useQuery({
    queryKey: ['dashboard-by-category', monthKey],
    queryFn: () => apiGet<{ data: CategoryBreakdown[] }>(`/api/dashboard/by-category?month=${monthKey}&type=expense`),
  })

  const [recItems, setRecItems] = useState<RecurringWithEntry[]>([])

  useEffect(() => {
    apiGet<{ data: RecurringWithEntry[] }>(`/api/recurrents?month=${monthKey}`)
      .then(r => setRecItems(r.data))
      .catch(() => {})
  }, [monthKey])

  const summary = summaryData?.data
  const monthlyTrend = (trendData?.data ?? []).map(d => ({
    ...d,
    month: formatMonthLabel(d.month),
  }))
  const categoryBreakdown = byCategoryData?.data ?? []

  const recIncome  = recItems.filter(i => i.type === 'income')
    .reduce((s, i) => s + (i.entries[0] ? parseFloat(i.entries[0].amount) : 0), 0)
  const recExpense = recItems.filter(i => i.type === 'expense')
    .reduce((s, i) => s + (i.entries[0] ? parseFloat(i.entries[0].amount) : 0), 0)

  const totalIncome  = (summary?.totalIncome  ?? 0) + recIncome
  const totalExpense = (summary?.totalExpense ?? 0) + recExpense
  const totalBalance = totalIncome - totalExpense
  const pendingReview = summary?.pendingReview ?? 0

  const recentTx = txList.slice(0, 6)

  const insights = summary ? generateInsights(summary, categoryBreakdown) : []

  const pieData = categoryBreakdown.map(c => ({
    name: c.category_name,
    total: c.total,
    color: c.color ?? '#CBD5E1',
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{monthLabel}</p>
        </div>
        {pendingReview > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-full px-3 py-1">
            <AlertTriangle className="h-3 w-3" />
            {pendingReview} para revisar
          </span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Saldo do Mês"
          value={totalBalance}
          sub="acumulado" trend={totalBalance >= 0 ? '+' : ''} trendUp={totalBalance >= 0}
          recurringNote={recIncome > 0 || recExpense > 0
            ? `${BRL(recIncome - recExpense)} em recorrentes`
            : undefined}
        />
        <KpiCard
          label="Receitas"
          value={totalIncome}
          sub="no período" trend="+" trendUp={true}
          recurringNote={recIncome > 0 ? `${BRL(recIncome)} recorrentes` : undefined}
        />
        <KpiCard
          label="Despesas"
          value={totalExpense}
          sub="no período" trend="-" trendUp={false}
          recurringNote={recExpense > 0 ? `${BRL(recExpense)} recorrentes` : undefined}
        />
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Para Revisar</p>
            <p className="text-2xl font-mono font-semibold text-foreground">{pendingReview}</p>
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
              <span className="text-[hsl(var(--destructive))]">transações</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[360px] pl-2 pr-5 pb-5">
          <div className="flex items-center justify-between pt-5 pb-5">
            <h2 className="text-sm font-semibold text-foreground">Evolução Mensal</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[hsl(var(--success))]" /> Receita</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[hsl(var(--destructive))]" /> Despesa</span>
            </div>
          </div>
          {monthlyTrend.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#DC2626" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))"
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="income"  stroke="#16A34A" strokeWidth={2} fill="url(#gIncome)"  dot={false} />
                <Area type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={2} fill="url(#gExpense)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Despesas por Categoria</h2>
            {pieData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="total" nameKey="name"
                      cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.slice(0, 5).map(({ name, total, color }) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-muted-foreground">{name}</span>
                      </div>
                      <span className="font-mono text-foreground tabular-nums">{fmt(total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Insights</h2>
            <div className="space-y-2.5">
              {insights.map(({ id, type, text }) => (
                <div key={id} className={cn(
                  'flex items-start gap-2.5 p-3 rounded-md text-sm border',
                  type === 'warning' && 'bg-destructive/5  border-destructive/15',
                  type === 'info'    && 'bg-accent/5       border-accent/15',
                  type === 'success' && 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/15',
                )}>
                  <span className="mt-0.5 shrink-0">{INSIGHT_ICONS[type]}</span>
                  <p className="text-muted-foreground leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Últimas Transações</h2>
            {recentTx.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma transação neste mês.</p>
            ) : (
              <div className="space-y-1">
                {recentTx.map(tx => {
                  const signedAmount = tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount)
                  const catName = tx.category?.name ?? tx.ai_category?.name ?? 'Sem categoria'
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <CategoryBadge category={catName} size="sm" />
                      <Currency value={signedAmount} size="sm" color="auto" className="shrink-0 w-24 text-right" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
