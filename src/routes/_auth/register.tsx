import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(80, 'Nome muito longo')
      .refine((v) => v.trim().split(/\s+/).length >= 1, 'Nome inválido'),
    email: z
      .string()
      .min(1, 'E-mail é obrigatório')
      .email('E-mail inválido'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirm: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

const inputCls = (hasError: boolean) =>
  cn(
    'w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 placeholder:text-muted-foreground transition-colors',
    hasError
      ? 'border-destructive focus:ring-destructive/40 text-destructive'
      : 'border-input focus:ring-ring'
  )

export const Route = createFileRoute('/_auth/register')({ component: RegisterPage })

function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  const password = watch('password', '')
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor =
    strength === 1 ? 'hsl(var(--destructive))' : strength === 2 ? 'hsl(38 92% 50%)' : 'hsl(142 45% 50%)'

  async function onSubmit({ name, email, password }: FormData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erro ao criar conta')
      return
    }
    localStorage.setItem('token', json.token)
    localStorage.setItem('user', JSON.stringify(json.user))
    toast.success('Conta criada com sucesso!')
    navigate({ to: '/dashboard' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 bg-card border border-border rounded-lg p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Nome</label>
        <input
          type="text"
          placeholder="Seu nome completo"
          aria-invalid={!!errors.name}
          {...register('name')}
          className={inputCls(!!errors.name)}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input
          type="email"
          placeholder="seu@email.com"
          aria-invalid={!!errors.email}
          {...register('email')}
          className={inputCls(!!errors.email)}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Senha</label>
        <input
          type="password"
          placeholder="Mínimo 6 caracteres"
          aria-invalid={!!errors.password}
          {...register('password')}
          className={inputCls(!!errors.password)}
        />
        {password.length > 0 && (
          <div className="flex gap-1 pt-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: strength >= level ? strengthColor : 'hsl(var(--border))' }}
              />
            ))}
          </div>
        )}
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Confirmar senha</label>
        <input
          type="password"
          placeholder="Repita a senha"
          aria-invalid={!!errors.confirm}
          {...register('confirm')}
          className={inputCls(!!errors.confirm)}
        />
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-9 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </button>
    </form>
  )
}
