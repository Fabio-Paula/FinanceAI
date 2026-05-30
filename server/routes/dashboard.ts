import { Hono } from 'hono'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

export const dashboardRoutes = new Hono()
dashboardRoutes.use('*', authMiddleware)

// GET /api/dashboard/summary?month=2026-05
dashboardRoutes.get('/summary', async (c) => {
  const userId = c.get('userId')
  const monthParam = c.req.query('month') // ex: "2026-05"

  let from: Date, to: Date
  if (monthParam) {
    const [year, month] = monthParam.split('-').map(Number)
    from = new Date(year, month - 1, 1)
    to = new Date(year, month, 0, 23, 59, 59)
  } else {
    const now = new Date()
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  }

  const [income, expense, count] = await Promise.all([
    prisma.transaction.aggregate({
      where: { user_id: userId, type: 'income', date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { user_id: userId, type: 'expense', date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { user_id: userId, date: { gte: from, lte: to } },
    }),
  ])

  const totalIncome = Number(income._sum.amount ?? 0)
  const totalExpense = Number(expense._sum.amount ?? 0)

  return c.json({
    data: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: count,
      month: monthParam ?? `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`,
    },
  })
})

// GET /api/dashboard/by-category?month=2026-05&type=expense
dashboardRoutes.get('/by-category', async (c) => {
  const userId = c.get('userId')
  const monthParam = c.req.query('month')
  const type = c.req.query('type') ?? 'expense'

  let from: Date, to: Date
  if (monthParam) {
    const [year, month] = monthParam.split('-').map(Number)
    from = new Date(year, month - 1, 1)
    to = new Date(year, month, 0, 23, 59, 59)
  } else {
    const now = new Date()
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  }

  const rows = await prisma.transaction.groupBy({
    by: ['category_id'],
    where: {
      user_id: userId,
      type: type as 'income' | 'expense',
      date: { gte: from, lte: to },
      category_id: { not: null },
    },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  })

  const categoryIds = rows.map((r) => r.category_id).filter(Boolean) as string[]
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const grandTotal = rows.reduce((acc, r) => acc + Number(r._sum.amount ?? 0), 0)

  const data = rows.map((r) => {
    const cat = catMap[r.category_id!]
    return {
      category_id: r.category_id,
      category_name: cat?.name ?? 'Sem categoria',
      color: cat?.color ?? '#CBD5E1',
      icon: cat?.icon ?? null,
      total: Number(r._sum.amount ?? 0),
      count: r._count,
      percentage: grandTotal > 0 ? (Number(r._sum.amount ?? 0) / grandTotal) * 100 : 0,
    }
  })

  return c.json({ data })
})

// GET /api/dashboard/monthly-trend?months=6
dashboardRoutes.get('/monthly-trend', async (c) => {
  const userId = c.get('userId')
  const months = Number(c.req.query('months') ?? 6)

  const results: Array<{ month: string; income: number; expense: number; balance: number }> = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const monthKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`

    const [inc, exp] = await Promise.all([
      prisma.transaction.aggregate({
        where: { user_id: userId, type: 'income', date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { user_id: userId, type: 'expense', date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
    ])

    const income = Number(inc._sum.amount ?? 0)
    const expense = Number(exp._sum.amount ?? 0)
    results.push({ month: monthKey, income, expense, balance: income - expense })
  }

  return c.json({ data: results })
})
