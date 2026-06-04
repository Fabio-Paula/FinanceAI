import { Hono } from 'hono'
import { createHash } from 'crypto'
import { prisma } from '../../src/lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { parseCSV, parseAmount, parseDate } from '../lib/csv.js'

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

// POST /api/imports
// Body: multipart/form-data — `file` (CSV) + `mapping` (JSON: { date, description, amount, type? })
// mapping fields are CSV column names: { "date": "Data", "description": "Histórico", "amount": "Valor" }
importRoutes.post('/', async (c) => {
  const userId = c.get('userId')

  const body = await c.req.parseBody()
  const file = body['file']
  const mappingStr = body['mapping'] as string | undefined

  if (!file || typeof file === 'string') {
    return c.json({ error: 'Arquivo CSV não enviado' }, 400)
  }

  let mapping: Record<string, string> = {}
  try {
    mapping = mappingStr ? JSON.parse(mappingStr) : {}
  } catch {
    return c.json({ error: 'Mapeamento inválido' }, 400)
  }

  if (!mapping.date || !mapping.description || !mapping.amount) {
    return c.json({ error: 'Mapeamento deve incluir: date, description e amount' }, 400)
  }

  const text = await (file as File).text()
  const { rows } = parseCSV(text)

  if (rows.length === 0) {
    return c.json({ error: 'CSV vazio ou sem linhas de dados' }, 400)
  }

  // Detect duplicate file by SHA-256 of its content
  const fileHash = createHash('sha256').update(text).digest('hex')
  const existing = await prisma.import.findFirst({
    where: { user_id: userId, storage_path: `sha256:${fileHash}` },
    select: { id: true, filename: true, created_at: true },
  })
  if (existing) {
    return c.json({
      error: `Este arquivo já foi importado anteriormente (${existing.filename}, ${new Date(existing.created_at).toLocaleDateString('pt-BR')}).`,
    }, 409)
  }

  const imp = await prisma.import.create({
    data: {
      user_id: userId,
      filename: (file as File).name,
      storage_path: `sha256:${fileHash}`,
      status: 'processing',
      total_rows: rows.length,
      column_mapping: mapping,
    },
  })

  let created = 0
  let skipped = 0
  const errors: string[] = []
  const months = new Set<string>()

  for (const row of rows) {
    const rawDate = row[mapping.date] ?? ''
    const rawDesc = row[mapping.description] ?? ''
    const rawAmount = row[mapping.amount] ?? ''
    const rawType = mapping.type ? (row[mapping.type] ?? '') : ''

    const parsedDate = parseDate(rawDate)
    if (!parsedDate || !rawDesc.trim() || !rawAmount.trim()) {
      skipped++
      continue
    }
    const date = parsedDate

    const amount = parseAmount(rawAmount)
    if (amount === 0) { skipped++; continue }

    // Fatura/extrato: tudo é despesa por padrão.
    // Exceções identificadas pela descrição: estornos, cashback, reembolsos, PIX/TED recebidos, pagamento recebido.
    // A coluna "tipo" do CSV (se mapeada) pode confirmar crédito explicitamente.
    const INCOME_DESC = /estorno|cashback|cash\s*back|reembolso|devolu[cç][aã]o|crédito\s+em\s+conta|pix\s+recebido|ted\s+recebida|pagamento\s+recebido|transfer[eê]ncia\s+recebida|depósito\s+recebido/i
    let type: 'income' | 'expense'
    if (rawType && /cr[eé]d|receb|entrada|depósito/i.test(rawType)) {
      type = 'income'
    } else if (INCOME_DESC.test(rawDesc)) {
      type = 'income'
    } else {
      type = 'expense'
    }

    const absAmount = Math.abs(amount).toFixed(2)
    const hash = createHash('sha256')
      .update(`${userId}|${date.toISOString().split('T')[0]}|${rawDesc.toLowerCase().trim()}|${absAmount}`)
      .digest('hex')
      .slice(0, 64)

    try {
      await prisma.transaction.create({
        data: {
          user_id: userId,
          import_id: imp.id,
          date,
          description: rawDesc.trim(),
          description_normalized: rawDesc.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
          amount: absAmount,
          type,
          is_recurring: false,
          tags: [],
          hash,
        },
      })
      months.add(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`)
      created++
    } catch (e: unknown) {
      // P2002 = unique constraint violation (duplicate hash)
      if ((e as { code?: string }).code === 'P2002') {
        skipped++
      } else {
        errors.push(String(e))
      }
    }
  }

  await prisma.import.update({
    where: { id: imp.id },
    data: {
      status: created === 0 && errors.length > 0 ? 'error' : 'done',
      processed_rows: created,
      error_log: errors.length > 0 ? errors : undefined,
    },
  })

  return c.json({
    data: {
      import_id: imp.id,
      total_rows: rows.length,
      created,
      skipped,
      errors: errors.length,
      months: Array.from(months).sort(),
    },
  }, 201)
})

// DELETE /api/imports/:id — remove import and all its transactions
importRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const importId = c.req.param('id')

  const imp = await prisma.import.findFirst({
    where: { id: importId, user_id: userId },
    select: { id: true, processed_rows: true },
  })
  if (!imp) return c.json({ error: 'Import não encontrado' }, 404)

  const { count } = await prisma.transaction.deleteMany({
    where: { import_id: importId, user_id: userId },
  })

  await prisma.import.delete({ where: { id: importId } })

  return c.json({ data: { deleted_transactions: count } })
})
