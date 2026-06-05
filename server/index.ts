import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma.js'
import { authRoutes } from './routes/auth.js'
import { transactionRoutes } from './routes/transactions.js'
import { categoryRoutes } from './routes/categories.js'
import { importRoutes } from './routes/imports.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { recurringRoutes } from './routes/recurrents.js'
import { aiRoutes } from './routes/ai.js'

const DB_ERROR_CODES = ['P1001', 'P1002', 'P1003', 'P1008', 'P1017']

function isDbConnectionError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError && DB_ERROR_CODES.includes(err.code))
  )
}

const app = new Hono()

// ── Middleware global ────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch {
    return c.json(
      { status: 'degraded', error: 'Banco de dados indisponível', code: 'DATABASE_UNAVAILABLE' },
      503
    )
  }
})

// ── Rotas ────────────────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes)
app.route('/api/transactions', transactionRoutes)
app.route('/api/categories', categoryRoutes)
app.route('/api/imports', importRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/recurrents', recurringRoutes)
app.route('/api/ai', aiRoutes)

// ── 404 ──────────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Rota não encontrada' }, 404))
app.onError((err, c) => {
  console.error(err)
  if (isDbConnectionError(err)) {
    return c.json(
      {
        error: 'Banco de dados indisponível. Verifique a conexão e tente novamente.',
        code: 'DATABASE_UNAVAILABLE',
      },
      503
    )
  }
  return c.json({ error: 'Erro interno do servidor' }, 500)
})

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 Entrafy API rodando em http://localhost:${PORT}`)
})

export default app
