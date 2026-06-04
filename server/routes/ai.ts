import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { encryptKey, decryptKey } from '../lib/crypto.js'
import {
  categorizeWithGemini,
  categorizeWithOpenAI,
  categorizeWithAnthropic,
} from '../lib/ai.js'

export const aiRoutes = new Hono()
aiRoutes.use('*', authMiddleware)

// GET /api/ai/settings
aiRoutes.get('/settings', async (c) => {
  const userId = c.get('userId')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ai_provider: true, ai_api_key_enc: true },
  })
  return c.json({
    provider: user?.ai_provider ?? null,
    has_key: !!user?.ai_api_key_enc,
  })
})

// PUT /api/ai/settings
aiRoutes.put('/settings', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)

  const schema = z.object({
    provider: z.enum(['openai', 'anthropic', 'google']),
    api_key: z.string().min(1).optional(),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const updateData: { ai_provider: string; ai_api_key_enc?: string } = {
    ai_provider: parsed.data.provider,
  }

  if (parsed.data.api_key) {
    updateData.ai_api_key_enc = encryptKey(parsed.data.api_key)
  }

  await prisma.user.update({ where: { id: userId }, data: updateData })

  return c.json({ provider: parsed.data.provider, has_key: true })
})

// POST /api/ai/categorize
aiRoutes.post('/categorize', async (c) => {
  const userId = c.get('userId')

  const body = await c.req.json().catch(() => null)
  const schema = z.object({
    description: z.string().min(1),
    amount: z.string().or(z.number()).transform(String),
    type: z.enum(['income', 'expense']),
  })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ai_provider: true, ai_api_key_enc: true },
  })

  if (!user?.ai_provider || !user.ai_api_key_enc) {
    return c.json({ error: 'Provedor de IA não configurado. Configure em Configurações.' }, 422)
  }

  const apiKey = decryptKey(user.ai_api_key_enc)

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ user_id: userId }, { user_id: null }],
      type: { in: [parsed.data.type, 'both'] },
    },
    select: { id: true, name: true },
    orderBy: { sort_order: 'asc' },
  })

  const { description, amount, type } = parsed.data

  try {
    let result

    if (user.ai_provider === 'google') {
      result = await categorizeWithGemini(apiKey, description, amount, type, categories)
    } else if (user.ai_provider === 'openai') {
      result = await categorizeWithOpenAI(apiKey, description, amount, type, categories)
    } else if (user.ai_provider === 'anthropic') {
      result = await categorizeWithAnthropic(apiKey, description, amount, type, categories)
    } else {
      return c.json({ error: 'Provedor não suportado' }, 400)
    }

    if (!categories.find(cat => cat.id === result.category_id)) {
      const byName = categories.find(cat => cat.name.toLowerCase() === result.category_name.toLowerCase())
      if (byName) result.category_id = byName.id
    }

    return c.json({ data: { ...result, model: user.ai_provider } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao chamar IA'
    return c.json({ error: message }, 502)
  }
})
