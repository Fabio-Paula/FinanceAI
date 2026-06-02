import { createFileRoute } from '@tanstack/react-router'
import { Key, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" defaultValue={user.name ?? 'Demo User'} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" defaultValue={user.email ?? 'demo@financeai.dev'} disabled />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                {user.plan === 'pro' ? '✦ Pro' : 'Free'}
              </Badge>
              <Button type="submit" size="sm">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Provedor de IA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Inteligência Artificial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Separator />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-foreground">Modo escuro</p>
              <p className="text-xs text-muted-foreground mt-0.5">Alterna entre tema claro e escuro</p>
            </div>
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              <Switch checked={darkMode} onCheckedChange={toggleDark} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
