import { Hono } from 'hono'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

export const importRoutes = new Hono()
importRoutes.use('*', authMiddleware)

// GET /api/imports
importRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const imports = await prisma.import.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 50,
  })
  return c.json({ data: imports })
})

// GET /api/imports/:id
importRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const imp = await prisma.import.findFirst({
    where: { id: c.req.param('id'), user_id: userId },
    include: { transactions: { take: 10, orderBy: { date: 'desc' } } },
  })
  if (!imp) return c.json({ error: 'Import não encontrado' }, 404)
  return c.json({ data: imp })
})
