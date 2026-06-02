import { createFileRoute } from '@tanstack/react-router'
import { Key, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/settings')({ component: SettingsPage })

export function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [aiProvider, setAiProvider] = useState('openai')
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    toast.success('Perfil atualizado')
  }

  function toggleDark(checked: boolean) {
    setDarkMode(checked)
    document.documentElement.classList.toggle('dark', checked)
    localStorage.setItem('theme', checked ? 'dark' : 'light')
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-normal text-muted-foreground">Nome</Label>
                <Input id="name" defaultValue={user.name ?? 'Demo User'} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-normal text-muted-foreground">E-mail</Label>
                <Input id="email" defaultValue={user.email ?? 'demo@financeai.dev'} disabled className="bg-muted text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                user.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {user.plan === 'pro' ? '✦ Pro' : 'Free'}
              </span>
              <Button type="submit" className="h-8 px-4 text-xs">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Provedor de IA */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">Inteligência Artificial</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-foreground">Provedor de IA</p>
              <p className="text-xs text-muted-foreground mt-0.5">Modelo usado para categorizar transações</p>
            </div>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o mini)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude Haiku)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
              <Key className="h-3 w-3" /> Chave de API
            </Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="sk-..." defaultValue="sk-demo-••••••••" className="flex-1 font-mono" />
              <Button onClick={() => toast.success('Chave salva')}>Salvar</Button>
            </div>
            <p className="text-xs text-muted-foreground">A chave é criptografada antes de ser armazenada.</p>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-foreground">Modo escuro</p>
              <p className="text-xs text-muted-foreground mt-0.5">Alterna entre tema claro e escuro</p>
            </div>
            <button onClick={() => toggleDark(!darkMode)}
              className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {darkMode ? 'Escuro' : 'Claro'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
