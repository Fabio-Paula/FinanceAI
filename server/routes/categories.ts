import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

export const categoryRoutes = new Hono()
categoryRoutes.use('*', authMiddleware)

// GET /api/categories — globais + do usuário
categoryRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { type } = c.req.query()

  const where: Record<string, unknown> = {
    OR: [{ user_id: null }, { user_id: userId }],
  }
  if (type) where.type = { in: [type, 'both'] }

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
  })
  return c.json({ data: categories })
})

// POST /api/categories
categoryRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const schema = z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    type: z.enum(['income', 'expense', 'both']).default('both'),
    parent_id: z.string().uuid().optional().nullable(),
    sort_order: z.number().int().optional(),
  })
  const body = await c.req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const cat = await prisma.category.create({
    data: { ...parsed.data, user_id: userId, is_system: false },
  })
  return c.json({ data: cat }, 201)
})

// PATCH /api/categories/:id
categoryRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.category.findFirst({
    where: { id: c.req.param('id'), user_id: userId, is_system: false },
  })
  if (!existing) return c.json({ error: 'Categoria não encontrada ou não editável' }, 404)

  const body = await c.req.json().catch(() => null)
  const cat = await prisma.category.update({
    where: { id: c.req.param('id') },
    data: body,
  })
  return c.json({ data: cat })
})

// DELETE /api/categories/:id
categoryRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.category.findFirst({
    where: { id: c.req.param('id'), user_id: userId, is_system: false },
  })
  if (!existing) return c.json({ error: 'Categoria não encontrada ou não removível' }, 404)
  await prisma.category.delete({ where: { id: c.req.param('id') } })
  return c.json({ message: 'Categoria removida' })
})
