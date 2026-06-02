import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth')({ component: AuthShell })

function TabLink({ to, label }: { to: string; label: string }) {
  const isActive = useRouterState({ select: (s) => s.location.pathname === to })
  return (
    <Link
      to={to}
      className={cn(
        'flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-card text-foreground shadow-sm border border-border/60'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </Link>
  )
}

function AuthShell() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-25 dark:opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse 80% 60% at 5% 95%, hsl(142 28% 45% / 0.12) 0%, transparent 65%)',
              'radial-gradient(ellipse 60% 50% at 95% 5%, hsl(210 59% 44% / 0.08) 0%, transparent 65%)',
            ].join(', '),
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2.5 mb-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <polyline
                  points="1,12 5,7 8,9 12,3 17,5"
                  stroke="hsl(var(--primary-foreground))"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">FinanceAI</span>
          </div>
          <p className="text-xs text-muted-foreground">gerenciador financeiro inteligente</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted rounded-xl p-1 mb-5 gap-1">
          <TabLink to="/login" label="Entrar" />
          <TabLink to="/register" label="Criar conta" />
        </div>

        <Outlet />
      </div>
    </div>
  )
}
