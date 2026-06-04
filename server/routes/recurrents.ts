import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

export const recurringRoutes = new Hono()
recurringRoutes.use('*', authMiddleware)

// GET /api/recurrents?month=2026-05
recurringRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { month } = c.req.query()

  const now = new Date()
  const monthRef = month
    ? new Date(`${month}-01T00:00:00.000Z`)
    : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))

  const items = await prisma.recurringItem.findMany({
    where: { user_id: userId, is_active: true },
    include: { entries: { where: { month_ref: monthRef } } },
    orderBy: [{ type: 'asc' }, { description: 'asc' }],
  })

  return c.json({ data: items })
})

// POST /api/recurrents — create item template
recurringRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const schema = z.object({
    description: z.string().min(1).max(255),
    type: z.enum(['income', 'expense']),
    category_id: z.string().uuid().optional().nullable(),
    day_of_month: z.number().int().min(1).max(31).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  const body = await c.req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const item = await prisma.recurringItem.create({
    data: { ...parsed.data, user_id: userId },
  })
  return c.json({ data: item }, 201)
})

// PATCH /api/recurrents/:id — update item template
recurringRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.recurringItem.findFirst({
    where: { id: c.req.param('id'), user_id: userId },
  })
  if (!existing) return c.json({ error: 'Item não encontrado' }, 404)

  const schema = z.object({
    description: z.string().min(1).max(255).optional(),
    type: z.enum(['income', 'expense']).optional(),
    category_id: z.string().uuid().optional().nullable(),
    day_of_month: z.number().int().min(1).max(31).optional().nullable(),
    is_active: z.boolean().optional(),
    notes: z.string().optional().nullable(),
  })
  const body = await c.req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const item = await prisma.recurringItem.update({
    where: { id: c.req.param('id') },
    data: parsed.data,
  })
  return c.json({ data: item })
})

// DELETE /api/recurrents/:id
recurringRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.recurringItem.findFirst({
    where: { id: c.req.param('id'), user_id: userId },
  })
  if (!existing) return c.json({ error: 'Item não encontrado' }, 404)

  await prisma.recurringItem.delete({ where: { id: c.req.param('id') } })
  return c.json({ message: 'Item removido' })
})

// PUT /api/recurrents/:id/entry — upsert entry for a month
recurringRoutes.put('/:id/entry', async (c) => {
  const userId = c.get('userId')
  const schema = z.object({
    month_ref: z.string().regex(/^\d{4}-\d{2}$/),
    amount: z.number().positive(),
    is_paid: z.boolean().optional(),
    paid_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  const body = await c.req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const existing = await prisma.recurringItem.findFirst({
    where: { id: c.req.param('id'), user_id: userId },
  })
  if (!existing) return c.json({ error: 'Item não encontrado' }, 404)

  const monthRef = new Date(`${parsed.data.month_ref}-01T00:00:00.000Z`)

  const entry = await prisma.recurringEntry.upsert({
    where: { uq_entry_item_month: { item_id: c.req.param('id'), month_ref: monthRef } },
    create: {
      item_id: c.req.param('id'),
      user_id: userId,
      month_ref: monthRef,
      amount: parsed.data.amount,
      is_paid: parsed.data.is_paid ?? false,
      paid_date: parsed.data.paid_date ? new Date(parsed.data.paid_date) : null,
      notes: parsed.data.notes ?? null,
    },
    update: {
      amount: parsed.data.amount,
      is_paid: parsed.data.is_paid ?? false,
      paid_date: parsed.data.paid_date ? new Date(parsed.data.paid_date) : null,
      notes: parsed.data.notes ?? null,
    },
  })
  return c.json({ data: entry })
})

// PATCH /api/recurrents/:id/entry/:entryId — mark paid/unpaid
recurringRoutes.patch('/:id/entry/:entryId', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.recurringEntry.findFirst({
    where: { id: c.req.param('entryId'), user_id: userId },
  })
  if (!existing) return c.json({ error: 'Lançamento não encontrado' }, 404)

  const body = await c.req.json().catch(() => null)
  const entry = await prisma.recurringEntry.update({
    where: { id: c.req.param('entryId') },
    data: { is_paid: body?.is_paid, paid_date: body?.paid_date ? new Date(body.paid_date) : null },
  })
  return c.json({ data: entry })
})

// DELETE /api/recurrents/:id/entry/:entryId — remove entry for a month
recurringRoutes.delete('/:id/entry/:entryId', async (c) => {
  const userId = c.get('userId')
  const existing = await prisma.recurringEntry.findFirst({
    where: { id: c.req.param('entryId'), user_id: userId },
  })
  if (!existing) return c.json({ error: 'Lançamento não encontrado' }, 404)

  await prisma.recurringEntry.delete({ where: { id: c.req.param('entryId') } })
  return c.json({ message: 'Lançamento removido' })
})
