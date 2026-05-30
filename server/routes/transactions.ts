import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

export const transactionRoutes = new Hono()
transactionRoutes.use('*', authMiddleware)

const txSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  amount: z.string().or(z.number()).transform(String),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid().optional().nullable(),
  is_recurring: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
})

// GET /api/transactions
transactionRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { page = '1', pageSize = '20', type, category_id, from, to, search } = c.req.query()

  const where: Record<string, unknown> = { user_id: userId }
  if (type) where.type = type
  if (category_id) where.category_id = category_id
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }
  if (search) {
    where.description_normalized = { contains: search.toLowerCase(), mode: 'insensitive' }
  }

  const skip = (Number(page) - 1) * Number(pageSize)
  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, ai_category: true },
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
      skip,
      take: Number(pageSize),
    }),
    prisma.transaction.count({ where }),
  ])

  return c.json({
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  })
})

// GET /api/transactions/:id
transactionRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const tx = await prisma.transaction.findFirst({
    where: { id: c.req.param('id'), user_id: userId },
    include: { category: true, ai_category: true },
  })
  if (!tx) return c.json({ error: 'Transação não encontrada' }, 404)
  return c.json({ data: tx })
})

// POST /api/transactions
transactionRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  const parsed = txSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const { createHash } = await import('crypto')
  const hash = createHash('sha256')
    .update(`${userId}|${parsed.data.date}|${parsed.data.description.toLowerCase().trim()}|${parsed.data.amount}`)
    .digest('hex').slice(0, 64)

  const tx = await prisma.transaction.create({
    data: {
      user_id: userId,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      description_normalized: parsed.data.description.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
      amount: parsed.data.amount,
      type: parsed.data.type,
      category_id: parsed.data.category_id ?? null,
      is_recurring: parsed.data.is_recurring ?? false,
      tags: parsed.data.tags ?? [],
      notes: parsed.data.notes ?? null,
      hash,
    },
    include: { category: true },
  })
  return c.json({ data: tx }, 201)
})

// PATCH /api/transactions/:id
transactionRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.transaction.findFirst({ where: { id: c.req.param('id'), user_id: userId } })
  if (!existing) return c.json({ error: 'Transação não encontrada' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = txSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const tx = await prisma.transaction.update({
    where: { id: c.req.param('id') },
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
    },
    include: { category: true },
  })
  return c.json({ data: tx })
})

// DELETE /api/transactions/:id
transactionRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.transaction.findFirst({ where: { id: c.req.param('id'), user_id: userId } })
  if (!existing) return c.json({ error: 'Transação não encontrada' }, 404)
  await prisma.transaction.delete({ where: { id: c.req.param('id') } })
  return c.json({ message: 'Transação removida' })
})
