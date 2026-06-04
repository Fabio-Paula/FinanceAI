import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { authRoutes } from './routes/auth.js'
import { transactionRoutes } from './routes/transactions.js'
import { categoryRoutes } from './routes/categories.js'
import { importRoutes } from './routes/imports.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { recurringRoutes } from './routes/recurrents.js'
import { aiRoutes } from './routes/ai.js'

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
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

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
  return c.json({ error: 'Erro interno do servidor' }, 500)
})

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 Entrafy API rodando em http://localhost:${PORT}`)
})

export default app
