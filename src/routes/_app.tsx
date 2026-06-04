import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  Tags,
  Settings,
  LogOut,
  BrainCircuit,
  Repeat2,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TransactionsProvider } from '@/lib/transactions-store'
import { MonthProvider, useMonth } from '@/lib/month-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export const Route = createFileRoute('/_app')({
  validateSearch: (search: Record<string, unknown>) => ({
    month: typeof search.month === 'string' ? search.month : undefined,
  }),
  beforeLoad: () => {
    if (!localStorage.getItem('token')) throw redirect({ to: '/login' })
  },
  component: AppLayout,
})

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { to: '/imports', label: 'Importar', icon: Upload },
  { to: '/categories', label: 'Categorias', icon: Tags },
  { to: '/recorrentes', label: 'Recorrentes', icon: Repeat2 },
  { to: '/ai-rules', label: 'Regras IA', icon: BrainCircuit },
  { to: '/settings', label: 'Configurações', icon: Settings },
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

const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function MonthPicker() {
  const { year, month, monthLabel, prevMonth, nextMonth, isCurrentMonth, isReadOnly } = useMonth()
  const navigate = useNavigate({ from: '/_app' })
  const currentSearch = useSearch({ from: '/_app' })
  const [open, setOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  function handleOpen(isOpen: boolean) {
    if (isOpen) setPickerYear(year)
    setOpen(isOpen)
  }

  function selectMonth(m: number) {
    const key = `${pickerYear}-${String(m + 1).padStart(2, '0')}`
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    navigate({
      search: { ...currentSearch, month: key === nowKey ? undefined : key },
    })
    setOpen(false)
  }

  function goToToday() {
    navigate({ search: { ...currentSearch, month: undefined } })
  }

  function isMonthDisabled(y: number, m: number) {
    return y > currentYear || (y === currentYear && m > currentMonth)
  }

  return (
    <div className="flex items-center gap-1.5">
      {isReadOnly && (
        <span className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-0.5">
          somente leitura
        </span>
      )}

      <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
          title="Mês anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <Popover open={open} onOpenChange={handleOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 min-w-[148px] justify-center py-1.5 rounded hover:bg-background hover:shadow-sm transition-all">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground capitalize">{monthLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end" sideOffset={8}>
            {/* Year navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">{pickerYear}</span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                disabled={pickerYear >= currentYear}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_SHORT.map((label, m) => {
                const disabled = isMonthDisabled(pickerYear, m)
                const selected = pickerYear === year && m === month
                const isToday = pickerYear === currentYear && m === currentMonth
                return (
                  <button
                    key={m}
                    onClick={() => !disabled && selectMonth(m)}
                    disabled={disabled}
                    className={cn(
                      'py-1.5 rounded-md text-xs font-medium transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : isToday
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'text-foreground hover:bg-muted',
                      disabled && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1.5 rounded transition-all text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-background hover:enabled:shadow-sm hover:enabled:text-foreground"
          title={isCurrentMonth ? 'Mês atual' : 'Próximo mês'}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          onClick={goToToday}
          title="Voltar ao mês atual"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const currentSearch = useSearch({ from: '/_app' })
  const { visible: showBanner, dismiss: dismissBanner, monthName } = useRecurringReviewBanner()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === '1'
  )

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

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
        <aside
          className={cn(
            'shrink-0 bg-card border-r border-border flex flex-col transition-all duration-200',
            collapsed ? 'w-[52px]' : 'w-56'
          )}
        >
          {/* Logo + toggle */}
          <div
            className={cn(
              'h-14 flex items-center border-b border-border',
              collapsed ? 'justify-center px-0' : 'px-3 justify-between'
            )}
          >
            {!collapsed && (
              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                  F
                </div>
                <span className="font-semibold text-foreground text-sm">Entrafy</span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  search={(prev) => prev}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center rounded-md text-sm transition-colors',
                    collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  {!collapsed && label}
                </Link>
              )
            })}
          </nav>

          {/* User / Logout */}
          <div className="p-2 border-t border-border">
            <button
              onClick={logout}
              title={collapsed ? 'Sair' : undefined}
              className={cn(
                'flex items-center rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full',
                collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'
              )}
            >
              <LogOut size={15} className="shrink-0" />
              {!collapsed && 'Sair'}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* Top bar: month picker + optional banner */}
          <div className="shrink-0 bg-card">
            <div className="flex items-center justify-end px-6 h-14 border-b border-border">
              <MonthPicker />
            </div>
            {showBanner && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 px-5 py-2.5">
                <Repeat2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200 flex-1 capitalize">
                  Revise os valores recorrentes de <span className="font-medium">{monthName}</span>{' '}
                  — confirme ou ajuste os valores para este mês.
                </p>
                <Link
                  to="/recorrentes"
                  search={currentSearch}
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
