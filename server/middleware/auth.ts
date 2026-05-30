import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'
import type { AuthTokenPayload } from '../../src/types/index.js'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    userEmail: string
    userPlan: string
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Token não fornecido' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
    const payload = jwt.verify(token, secret) as AuthTokenPayload
    c.set('userId', payload.sub)
    c.set('userEmail', payload.email)
    c.set('userPlan', payload.plan)
    await next()
  } catch {
    return c.json({ error: 'Token inválido ou expirado' }, 401)
  }
})
