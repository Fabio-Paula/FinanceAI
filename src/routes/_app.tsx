import { createFileRoute, Outlet, redirect, Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, ArrowLeftRight, Upload, Tags, Settings, LogOut, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TransactionsProvider } from '@/lib/transactions-store'

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
  { to: '/ai-rules',     label: 'Regras IA',      icon: BrainCircuit    },
  { to: '/settings',     label: 'Configurações',  icon: Settings        },
]

function AppLayout() {
  const location = useLocation()

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Até logo!')
    window.location.href = '/login'
  }

  return (
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
      <main className="flex-1 overflow-y-auto">
        <TransactionsProvider>
          <Outlet />
        </TransactionsProvider>
      </main>
    </div>
  )
}
