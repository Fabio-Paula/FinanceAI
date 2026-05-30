import { createFileRoute } from '@tanstack/react-router'
import { User, Key, BrainCircuit, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/settings')({ component: SettingsPage })

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [aiProvider, setAiProvider] = useState('openai')
  const [darkMode, setDarkMode] = useState(false)

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    toast.success('Perfil atualizado')
  }

  function toggleDark() {
    setDarkMode(d => {
      document.documentElement.classList.toggle('dark', !d)
      return !d
    })
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Perfil */}
      <Section title="Perfil">
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nome</label>
              <input defaultValue={user.name ?? 'Demo User'}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">E-mail</label>
              <input defaultValue={user.email ?? 'demo@financeai.dev'} disabled
                className="w-full h-9 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {user.plan === 'pro' ? '✦ Pro' : 'Free'}
            </span>
            <button type="submit" className="h-8 px-4 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-opacity">
              Salvar
            </button>
          </div>
        </form>
      </Section>

      {/* Provedor de IA */}
      <Section title="Inteligência Artificial">
        <Field label="Provedor de IA" description="Modelo usado para categorizar transações">
          <select value={aiProvider} onChange={e => setAiProvider(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="openai">OpenAI (GPT-4o mini)</option>
            <option value="anthropic">Anthropic (Claude Haiku)</option>
          </select>
        </Field>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Key className="h-3 w-3" /> Chave de API
          </label>
          <div className="flex gap-2">
            <input type="password" placeholder="sk-..." defaultValue="sk-demo-••••••••"
              className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={() => toast.success('Chave salva')}
              className="h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity">
              Salvar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">A chave é criptografada antes de ser armazenada.</p>
        </div>
      </Section>

      {/* Aparência */}
      <Section title="Aparência">
        <Field label="Modo escuro" description="Alterna entre tema claro e escuro">
          <button onClick={toggleDark}
            className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {darkMode ? 'Escuro' : 'Claro'}
          </button>
        </Field>
      </Section>
    </div>
  )
}
