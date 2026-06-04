// =============================================================================
// Entrafy — prisma/seed.ts
// npx prisma db seed
// =============================================================================

import { PrismaClient, Plan, TransactionType, CategoryType, MatchType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'
import { randomUUID, createHash } from 'crypto'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// =============================================================================
// HELPERS
// =============================================================================

/** Gera hash SHA-256 simples para dedup (em produção use crypto.createHash) */
function makeHash(userId: string, date: string, description: string, amount: string): string {
  return createHash('sha256')
    .update(`${userId}|${date}|${description.toLowerCase().trim()}|${amount}`)
    .digest('hex')
    .slice(0, 64)
}

function d(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00Z')
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🌱 Iniciando seed do Entrafy...\n')

  // ---------------------------------------------------------------------------
  // 1. USUÁRIO DE TESTE
  // ---------------------------------------------------------------------------
  console.log('👤 Criando usuário demo...')

  const passwordHash = await bcrypt.hash('demo123', 12)
  const userId = randomUUID()

  const user = await prisma.user.upsert({
    where: { email: 'demo@entrafy.dev' },
    update: {},
    create: {
      id: userId,
      email: 'demo@entrafy.dev',
      password_hash: passwordHash,
      name: 'Demo User',
      plan: Plan.pro,
      ai_provider: 'openai',
    },
  })

  console.log(`   ✅ Usuário: ${user.email} (id: ${user.id})\n`)

  // ---------------------------------------------------------------------------
  // 2. CATEGORIAS GLOBAIS DO SISTEMA (13 categorias)
  // ---------------------------------------------------------------------------
  console.log('🗂️  Criando categorias globais...')

  const categoryDefs = [
    // Despesas
    { name: 'Alimentação',      icon: 'utensils',        color: '#F97316', type: CategoryType.expense, sort_order: 1  },
    { name: 'Transporte',       icon: 'car',             color: '#3B82F6', type: CategoryType.expense, sort_order: 2  },
    { name: 'Moradia',          icon: 'home',            color: '#8B5CF6', type: CategoryType.expense, sort_order: 3  },
    { name: 'Saúde',            icon: 'heart-pulse',     color: '#EF4444', type: CategoryType.expense, sort_order: 4  },
    { name: 'Educação',         icon: 'graduation-cap',  color: '#06B6D4', type: CategoryType.expense, sort_order: 5  },
    { name: 'Lazer',            icon: 'gamepad-2',       color: '#A855F7', type: CategoryType.expense, sort_order: 6  },
    { name: 'Vestuário',        icon: 'shirt',           color: '#EC4899', type: CategoryType.expense, sort_order: 7  },
    { name: 'Assinaturas',      icon: 'repeat',          color: '#64748B', type: CategoryType.expense, sort_order: 8  },
    // Receitas
    { name: 'Salário',          icon: 'banknote',        color: '#22C55E', type: CategoryType.income,  sort_order: 9  },
    { name: 'Freelance',        icon: 'laptop',          color: '#10B981', type: CategoryType.income,  sort_order: 10 },
    { name: 'Investimentos',    icon: 'trending-up',     color: '#F59E0B', type: CategoryType.income,  sort_order: 11 },
    // Ambas
    { name: 'Transferência',    icon: 'arrow-right-left', color: '#94A3B8', type: CategoryType.both,   sort_order: 12 },
    { name: 'Outros',           icon: 'circle-ellipsis', color: '#CBD5E1', type: CategoryType.both,    sort_order: 13 },
  ]

  const categories: Record<string, string> = {}

  for (const def of categoryDefs) {
    const existing = await prisma.category.findFirst({
      where: { name: def.name, user_id: null, is_system: true },
    })

    const cat = existing
      ? existing
      : await prisma.category.create({
          data: {
            id: randomUUID(),
            user_id: null,
            is_system: true,
            ...def,
          },
        })

    categories[def.name] = cat.id
    console.log(`   ✅ ${def.name}`)
  }

  console.log()

  // ---------------------------------------------------------------------------
  // 3. 50 TRANSAÇÕES REALISTAS — MAIO/2026
  // ---------------------------------------------------------------------------
  console.log('💳 Criando 50 transações de maio/2026...')

  type TxDef = {
    date: string
    description: string
    amount: string
    type: TransactionType
    category: string
    is_recurring?: boolean
    tags?: string[]
    notes?: string
    ai_confidence?: number
  }

  const txDefs: TxDef[] = [
    // ── RECEITAS ──────────────────────────────────────────────────────────────
    { date:'2026-05-05', description:'Salário maio/2026 - Empresa XPTO',          amount:'8500.00',  type: TransactionType.income,  category:'Salário',       is_recurring:true,  tags:['salário','fixo'] },
    { date:'2026-05-05', description:'Vale Refeição maio/2026',                   amount:'880.00',   type: TransactionType.income,  category:'Salário',       is_recurring:true,  tags:['benefício'] },
    { date:'2026-05-10', description:'Pagamento freelance - site landing page',   amount:'2200.00',  type: TransactionType.income,  category:'Freelance',     tags:['cliente','web'] },
    { date:'2026-05-15', description:'Dividendos FII KNRI11',                     amount:'342.50',   type: TransactionType.income,  category:'Investimentos', tags:['fii','dividendo'] },
    { date:'2026-05-20', description:'Rendimento CDB Nubank',                     amount:'185.30',   type: TransactionType.income,  category:'Investimentos', tags:['cdb','renda-fixa'] },
    { date:'2026-05-22', description:'Freelance - consultoria SEO',               amount:'900.00',   type: TransactionType.income,  category:'Freelance',     tags:['consultoria'] },
    { date:'2026-05-28', description:'Cashback cartão Nubank',                    amount:'47.80',    type: TransactionType.income,  category:'Outros',        tags:['cashback'] },

    // ── MORADIA ───────────────────────────────────────────────────────────────
    { date:'2026-05-01', description:'Aluguel apartamento maio',                  amount:'2100.00',  type: TransactionType.expense, category:'Moradia',       is_recurring:true,  tags:['aluguel','fixo'],     notes:'Vencimento dia 1' },
    { date:'2026-05-05', description:'Condomínio maio/2026',                      amount:'520.00',   type: TransactionType.expense, category:'Moradia',       is_recurring:true,  tags:['condomínio','fixo'] },
    { date:'2026-05-08', description:'Conta de luz - Enel maio',                  amount:'187.40',   type: TransactionType.expense, category:'Moradia',       is_recurring:true,  tags:['energia','utilidade'] },
    { date:'2026-05-10', description:'Conta de água - Sabesp',                    amount:'98.60',    type: TransactionType.expense, category:'Moradia',       is_recurring:true,  tags:['água','utilidade'] },
    { date:'2026-05-12', description:'Internet fibra 500MB - Vivo',               amount:'119.90',   type: TransactionType.expense, category:'Moradia',       is_recurring:true,  tags:['internet','fixo'] },
    { date:'2026-05-15', description:'Gás de cozinha - Ultragaz',                 amount:'135.00',   type: TransactionType.expense, category:'Moradia',       tags:['gás'] },

    // ── ALIMENTAÇÃO ───────────────────────────────────────────────────────────
    { date:'2026-05-02', description:'Supermercado Pão de Açúcar',                amount:'487.30',   type: TransactionType.expense, category:'Alimentação',   tags:['mercado','compras'] },
    { date:'2026-05-07', description:'iFood - Pizza Sábado',                      amount:'89.90',    type: TransactionType.expense, category:'Alimentação',   tags:['delivery','restaurante'] },
    { date:'2026-05-09', description:'Padaria Boulangerie - café da manhã',        amount:'28.50',    type: TransactionType.expense, category:'Alimentação',   tags:['café'] },
    { date:'2026-05-14', description:'Supermercado Carrefour',                    amount:'312.80',   type: TransactionType.expense, category:'Alimentação',   tags:['mercado'] },
    { date:'2026-05-16', description:'Restaurante japonês Sakura',                amount:'124.00',   type: TransactionType.expense, category:'Alimentação',   tags:['restaurante','jantar'] },
    { date:'2026-05-19', description:'iFood - Hambúrguer Madero',                 amount:'67.40',    type: TransactionType.expense, category:'Alimentação',   tags:['delivery'] },
    { date:'2026-05-21', description:'Hortifruti Vila Madalena',                  amount:'76.20',    type: TransactionType.expense, category:'Alimentação',   tags:['hortifruti','saudável'] },
    { date:'2026-05-26', description:'Supermercado Mercadona compra semanal',     amount:'253.60',   type: TransactionType.expense, category:'Alimentação',   tags:['mercado'] },
    { date:'2026-05-29', description:'Bar do Zé - happy hour',                    amount:'94.00',    type: TransactionType.expense, category:'Alimentação',   tags:['bar','lazer'] },

    // ── TRANSPORTE ────────────────────────────────────────────────────────────
    { date:'2026-05-03', description:'Uber - trajeto trabalho',                   amount:'34.70',    type: TransactionType.expense, category:'Transporte',    tags:['uber','trabalho'] },
    { date:'2026-05-06', description:'Recarga Bilhete Único',                     amount:'150.00',   type: TransactionType.expense, category:'Transporte',    is_recurring:true, tags:['metrô','transporte-público'] },
    { date:'2026-05-11', description:'Posto Shell - combustível',                 amount:'286.00',   type: TransactionType.expense, category:'Transporte',    tags:['combustível','carro'] },
    { date:'2026-05-17', description:'Uber - ida ao aeroporto',                   amount:'78.90',    type: TransactionType.expense, category:'Transporte',    tags:['uber','viagem'] },
    { date:'2026-05-24', description:'Estacionamento Shopping Ibirapuera',        amount:'42.00',    type: TransactionType.expense, category:'Transporte',    tags:['estacionamento'] },

    // ── SAÚDE ─────────────────────────────────────────────────────────────────
    { date:'2026-05-03', description:'Plano de saúde Amil maio',                  amount:'680.00',   type: TransactionType.expense, category:'Saúde',         is_recurring:true, tags:['plano-saúde','fixo'] },
    { date:'2026-05-13', description:'Farmácia Drogasil - medicamentos',           amount:'143.60',   type: TransactionType.expense, category:'Saúde',         tags:['remédio','farmácia'] },
    { date:'2026-05-20', description:'Consulta médica dermatologista',            amount:'350.00',   type: TransactionType.expense, category:'Saúde',         tags:['consulta','médico'] },
    { date:'2026-05-27', description:'Academia Smart Fit - mensalidade',          amount:'109.90',   type: TransactionType.expense, category:'Saúde',         is_recurring:true, tags:['academia','exercício','fixo'] },

    // ── EDUCAÇÃO ──────────────────────────────────────────────────────────────
    { date:'2026-05-05', description:'Curso Udemy - React Advanced',              amount:'47.90',    type: TransactionType.expense, category:'Educação',      tags:['curso','programação','online'] },
    { date:'2026-05-15', description:'Livro Clean Architecture - Amazon',          amount:'89.90',    type: TransactionType.expense, category:'Educação',      tags:['livro','desenvolvimento'] },
    { date:'2026-05-20', description:'Alura - assinatura mensal',                 amount:'89.90',    type: TransactionType.expense, category:'Educação',      is_recurring:true, tags:['alura','programação','fixo'] },

    // ── ASSINATURAS ───────────────────────────────────────────────────────────
    { date:'2026-05-01', description:'Netflix - plano premium',                   amount:'55.90',    type: TransactionType.expense, category:'Assinaturas',   is_recurring:true, tags:['streaming','entretenimento'] },
    { date:'2026-05-01', description:'Spotify Premium',                           amount:'21.90',    type: TransactionType.expense, category:'Assinaturas',   is_recurring:true, tags:['música','streaming'] },
    { date:'2026-05-01', description:'ChatGPT Plus - OpenAI',                     amount:'100.00',   type: TransactionType.expense, category:'Assinaturas',   is_recurring:true, tags:['ia','produtividade'] },
    { date:'2026-05-08', description:'Adobe Creative Cloud',                      amount:'239.00',   type: TransactionType.expense, category:'Assinaturas',   is_recurring:true, tags:['design','adobe','fixo'] },
    { date:'2026-05-15', description:'GitHub Copilot',                            amount:'50.00',    type: TransactionType.expense, category:'Assinaturas',   is_recurring:true, tags:['dev','ia','github'] },

    // ── LAZER ─────────────────────────────────────────────────────────────────
    { date:'2026-05-10', description:'Cinema Cinemark - 2 ingressos',             amount:'78.00',    type: TransactionType.expense, category:'Lazer',         tags:['cinema','lazer'] },
    { date:'2026-05-17', description:'Ingresso show Coldplay - Allianz Parque',   amount:'450.00',   type: TransactionType.expense, category:'Lazer',         tags:['show','música','evento'] },
    { date:'2026-05-24', description:'Steam - jogo Baldur\'s Gate 3',             amount:'149.90',   type: TransactionType.expense, category:'Lazer',         tags:['jogo','steam'] },
    { date:'2026-05-31', description:'Passeio de barco Angra dos Reis',           amount:'320.00',   type: TransactionType.expense, category:'Lazer',         tags:['viagem','passeio'] },

    // ── VESTUÁRIO ─────────────────────────────────────────────────────────────
    { date:'2026-05-18', description:'Zara - camisas e calças',                   amount:'389.80',   type: TransactionType.expense, category:'Vestuário',     tags:['roupa','zara'] },
    { date:'2026-05-25', description:'Nike Store - tênis running',                amount:'649.90',   type: TransactionType.expense, category:'Vestuário',     tags:['tênis','esporte'] },

    // ── OUTROS ────────────────────────────────────────────────────────────────
    { date:'2026-05-04', description:'Presente aniversário - amigo',              amount:'120.00',   type: TransactionType.expense, category:'Outros',        tags:['presente','social'] },
    { date:'2026-05-23', description:'Petshop - ração Golden Retriever',          amount:'215.00',   type: TransactionType.expense, category:'Outros',        tags:['pet','animal'] },
  ]

  let txCount = 0
  for (const def of txDefs) {
    const hash = makeHash(user.id, def.date, def.description, def.amount)

    await prisma.transaction.upsert({
      where: { uq_transaction_user_hash: { user_id: user.id, hash } },
      update: {},
      create: {
        id: randomUUID(),
        user_id: user.id,
        date: d(def.date),
        description: def.description,
        description_normalized: def.description.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
        amount: def.amount,
        type: def.type,
        category_id: categories[def.category],
        ai_category_id: categories[def.category],
        ai_confidence: def.ai_confidence ?? (0.85 + Math.random() * 0.14),
        ai_model: 'gpt-4o-mini',
        is_ai_confirmed: true,
        is_recurring: def.is_recurring ?? false,
        tags: def.tags ?? [],
        notes: def.notes ?? null,
        hash,
      },
    })
    txCount++
  }

  console.log(`   ✅ ${txCount} transações criadas\n`)

  // ---------------------------------------------------------------------------
  // 4. AI RULES (5 regras de exemplo)
  // ---------------------------------------------------------------------------
  console.log('🤖 Criando regras de IA...')

  const ruleDefs = [
    {
      pattern: 'ifood',
      match_type: MatchType.contains,
      category: 'Alimentação',
      priority: 100,
    },
    {
      pattern: 'uber',
      match_type: MatchType.contains,
      category: 'Transporte',
      priority: 100,
    },
    {
      pattern: 'netflix',
      match_type: MatchType.contains,
      category: 'Assinaturas',
      priority: 90,
    },
    {
      pattern: '^salário',
      match_type: MatchType.regex,
      category: 'Salário',
      priority: 110,
    },
    {
      pattern: 'supermercado',
      match_type: MatchType.contains,
      category: 'Alimentação',
      priority: 80,
    },
  ]

  for (const rule of ruleDefs) {
    const existing = await prisma.aiRule.findFirst({
      where: { user_id: user.id, pattern: rule.pattern },
    })

    if (!existing) {
      await prisma.aiRule.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          pattern: rule.pattern,
          match_type: rule.match_type,
          category_id: categories[rule.category],
          priority: rule.priority,
          times_applied: Math.floor(Math.random() * 20) + 1,
        },
      })
    }
    console.log(`   ✅ Regra: "${rule.pattern}" → ${rule.category}`)
  }

  // ---------------------------------------------------------------------------
  // SUMÁRIO
  // ---------------------------------------------------------------------------
  const [txTotal, catTotal, ruleTotal] = await Promise.all([
    prisma.transaction.count({ where: { user_id: user.id } }),
    prisma.category.count({ where: { is_system: true } }),
    prisma.aiRule.count({ where: { user_id: user.id } }),
  ])

  const totalIncome = await prisma.transaction.aggregate({
    where: { user_id: user.id, type: 'income' },
    _sum: { amount: true },
  })
  const totalExpense = await prisma.transaction.aggregate({
    where: { user_id: user.id, type: 'expense' },
    _sum: { amount: true },
  })

  console.log('\n═══════════════════════════════════════════════')
  console.log('  Entrafy — Seed concluído com sucesso!')
  console.log('═══════════════════════════════════════════════')
  console.log(`  📧 Login:       demo@entrafy.dev`)
  console.log(`  🔑 Senha:       demo123`)
  console.log(`  💳 Transações:  ${txTotal}`)
  console.log(`  🗂️  Categorias:  ${catTotal} (sistema)`)
  console.log(`  🤖 Regras IA:   ${ruleTotal}`)
  console.log(`  📈 Receitas:    R$ ${Number(totalIncome._sum.amount ?? 0).toFixed(2)}`)
  console.log(`  📉 Despesas:    R$ ${Number(totalExpense._sum.amount ?? 0).toFixed(2)}`)
  const balance = Number(totalIncome._sum.amount ?? 0) - Number(totalExpense._sum.amount ?? 0)
  console.log(`  💰 Saldo:       R$ ${balance.toFixed(2)}`)
  console.log('═══════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
