# Entrafy — Setup PostgreSQL + Prisma

## 1. Dependências

```bash
npm install prisma @prisma/client bcryptjs
npm install -D ts-node typescript @types/node @types/bcryptjs
npx prisma init
```

## 2. Configurar `.env`

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/entrafy?schema=public"
```

## 3. Copiar `schema.prisma`

Mova o arquivo `schema.prisma` para `prisma/schema.prisma`.

## 4. Configurar seed no `package.json`

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

O arquivo `seed.ts` deve ficar em `prisma/seed.ts`.

## 5. Índice GIN para `tags` (migration customizada)

Após o `migrate dev`, adicione em uma migration manual:

```sql
-- CreateIndex GIN para busca em array de tags
CREATE INDEX idx_tx_tags_gin ON transactions USING GIN (tags);
```

Ou use `prisma migrate dev --create-only` para editar a migration antes de aplicar.

## 6. Executar

```bash
# Criar banco e aplicar schema
npx prisma migrate dev --name init

# Popular com dados de teste
npx prisma db seed

# Abrir Prisma Studio (opcional)
npx prisma studio
```

## 7. Verificar

```bash
npx prisma migrate status
```

---

## Credenciais de Teste

| Campo | Valor              |
| ----- | ------------------ |
| Email | `demo@entrafy.dev` |
| Senha | `demo123`          |

---

## Resumo do Schema

| Tabela         | Descrição                                      |
| -------------- | ---------------------------------------------- |
| `users`        | Conta do usuário + config de IA                |
| `imports`      | Arquivos importados (CSV/OFX)                  |
| `transactions` | Lançamentos financeiros com suporte a IA       |
| `categories`   | Hierárquicas, globais (sistema) ou por usuário |
| `ai_rules`     | Regras de categorização automática por padrão  |

## Índices de Performance — Resumo

| Índice                      | Tabela       | Justificativa                            |
| --------------------------- | ------------ | ---------------------------------------- |
| `uq_transaction_user_hash`  | transactions | Deduplicação de importação               |
| `idx_tx_user_date`          | transactions | Query raiz do extrato (90% das leituras) |
| `idx_tx_user_date_type`     | transactions | Filtro receita/despesa no dashboard      |
| `idx_tx_user_category_date` | transactions | Drill-down por categoria + período       |
| `idx_tx_ai_review`          | transactions | Fila de revisão manual IA                |
| `idx_tx_import`             | transactions | JOIN com imports                         |
| `idx_tx_tags_gin`           | transactions | Busca `@>` em array de tags (GIN)        |
| `idx_imports_user_created`  | imports      | Listagem de imports por data             |
| `idx_imports_user_status`   | imports      | Polling do worker de processamento       |
| `idx_imports_user_month`    | imports      | Filtro por competência mensal            |
| `idx_cat_user_type_order`   | categories   | Listar categorias na ordem correta       |
| `idx_rules_user_priority`   | ai_rules     | Motor de regras (ordem de prioridade)    |
