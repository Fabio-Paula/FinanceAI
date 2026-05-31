import { createFileRoute, Outlet, redirect, Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, ArrowLeftRight, Upload, Tags, Settings, LogOut, BrainCircuit, Repeat2, X, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TransactionsProvider } from '@/lib/transactions-store'
import { MonthProvider, useMonth } from '@/lib/month-context'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!localStorage.getItem('token')) throw redirect({ to: '/login' })
  },
  component: AppLayout,
})

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/transactions', label: 'Transações',     icon: ArrowLeftRight  },
  { to: '/imports',      label: 'Importar',       icon: Upload          },
  { to: '/categories',   label: 'Categorias',     icon: Tags            },
  { to: '/recorrentes',  label: 'Recorrentes',    icon: Repeat2         },
  { to: '/ai-rules',     label: 'Regras IA',      icon: BrainCircuit    },
  { to: '/settings',     label: 'Configurações',  icon: Settings        },
]

function useRecurringReviewBanner() {
  const now = new Date()
  const key = `rec-review-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [visible, setVisible] = useState(() => !localStorage.getItem(key))

  function dismiss() {
    localStorage.setItem(key, '1')
    setVisible(false)
  }

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return { visible, dismiss, monthName }
}

function MonthPicker() {
  const { monthLabel, prevMonth, nextMonth } = useMonth()
  return (
    <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
      <button
        onClick={prevMonth}
        className="p-1.5 rounded hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
        title="Mês anterior"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-1.5 px-2 min-w-[148px] justify-center">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground capitalize">{monthLabel}</span>
      </div>
      <button
        onClick={nextMonth}
        className="p-1.5 rounded hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
        title="Próximo mês"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const { visible: showBanner, dismiss: dismissBanner, monthName } = useRecurringReviewBanner()

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Até logo!')
    window.location.href = '/login'
  }

  return (
    <MonthProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col">
          {/* Logo */}
          <div className="px-5 h-14 flex items-center border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">F</div>
              <span className="font-semibold text-foreground text-sm">FinanceAI</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* User / Logout */}
          <div className="p-2 border-t border-border">
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
            >
              <LogOut size={15} />
              Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* Top bar: month picker + optional banner */}
          <div className="shrink-0 border-b border-border bg-card">
            <div className="flex items-center justify-end px-6 h-12">
              <MonthPicker />
            </div>
            {showBanner && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 px-5 py-2.5">
                <Repeat2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200 flex-1 capitalize">
                  Revise os valores recorrentes de <span className="font-medium">{monthName}</span> — confirme ou ajuste os valores para este mês.
                </p>
                <Link
                  to="/recorrentes"
                  onClick={dismissBanner}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:no-underline transition-all whitespace-nowrap"
                >
                  Revisar agora
                </Link>
                <button
                  onClick={dismissBanner}
                  className="p-0.5 text-amber-400 hover:text-amber-600 transition-colors shrink-0"
                  title="Dispensar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <TransactionsProvider>
              <Outlet />
            </TransactionsProvider>
          </div>
        </main>
      </div>
    </MonthProvider>
  )
}
