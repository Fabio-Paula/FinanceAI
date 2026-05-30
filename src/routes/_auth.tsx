import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FinanceAI</h1>
          <p className="text-sm text-muted-foreground">Gerenciador financeiro inteligente</p>
        </div>
        <Outlet />
      </div>
    </div>
  ),
})
