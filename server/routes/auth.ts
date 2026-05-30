import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'

export const authRoutes = new Hono()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const JWT_EXPIRES = '7d'

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return c.json({ error: 'Credenciais inválidas' }, 401)

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return c.json({ error: 'Credenciais inválidas' }, 401)

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  })
})

authRoutes.post('/register', async (c) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
  })
  const body = await c.req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const { email, password, name } = parsed.data
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return c.json({ error: 'E-mail já cadastrado' }, 409)

  const password_hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password_hash, name },
    select: { id: true, email: true, name: true, plan: true },
  })

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )

  return c.json({ token, user }, 201)
})
