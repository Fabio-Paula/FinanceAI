# Entrafy — Guia de Setup

Guia completo para rodar o projeto localmente após clonar o repositório.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Como instalar                                                   |
| ---------- | ------------- | --------------------------------------------------------------- |
| Node.js    | 18+           | [nodejs.org](https://nodejs.org)                                |
| pnpm       | 8+            | `npm install -g pnpm`                                           |
| Docker     | qualquer      | [docker.com](https://www.docker.com) _(opcional, para o banco)_ |

> Se preferir usar um PostgreSQL já instalado localmente, o Docker não é obrigatório.

---

## 1. Instalar dependências

```bash
pnpm install
```

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e preencha as variáveis obrigatórias:

```env
# PostgreSQL — veja opção A ou B abaixo
DATABASE_URL="postgresql://entrafy:entrafy123@localhost:5432/entrafy?schema=public"

# JWT — gere um segredo forte com:
# openssl rand -base64 32
JWT_SECRET="troque-por-um-valor-secreto-seguro"

# Porta da API (padrão: 3001)
PORT=3001

# Chaves de IA (opcional — configure conforme o provedor que for usar)
# OPENAI_API_KEY=""
# ANTHROPIC_API_KEY=""
# GEMINI_API_KEY=""
```

---

## 3. Subir o banco de dados

### Opção A — Docker (recomendado)

```bash
docker compose up -d
```

Isso sobe o PostgreSQL 16 na porta `5432` e o Adminer (interface web) na porta `8080`.

Credenciais configuradas no `docker-compose.yml`:

| Campo    | Valor        |
| -------- | ------------ |
| Usuário  | `entrafy`    |
| Senha    | `entrafy123` |
| Database | `entrafy`    |

A `DATABASE_URL` correspondente (já preenchida no exemplo acima):

```
postgresql://entrafy:entrafy123@localhost:5432/entrafy?schema=public
```

### Opção B — PostgreSQL local já instalado

Crie o banco manualmente e ajuste a `DATABASE_URL` no `.env`:

```bash
createdb entrafy
```

---

## 4. Aplicar as migrations e popular o banco

```bash
# Criar tabelas e aplicar schema
npx prisma migrate dev --name init
```

### Índice GIN (passo obrigatório após migrate)

O Prisma não suporta criar índices GIN nativamente. Após rodar as migrations, execute esse SQL **uma vez**:

```sql
CREATE INDEX idx_tx_tags_gin ON transactions USING GIN (tags);
```

Via psql:

```bash
psql postgresql://entrafy:entrafy123@localhost:5432/entrafy -c "CREATE INDEX idx_tx_tags_gin ON transactions USING GIN (tags);"
```

Via Adminer: acesse `http://localhost:8080` e execute o SQL acima.

---

## 5. Rodar a aplicação

O projeto tem **dois processos** que precisam rodar simultaneamente:

- **Frontend** — Vite na porta `5173`
- **Backend** — Hono na porta `3001`

### Opção A — Comando único (recomendado)

```bash
pnpm dev:all
```

### Opção B — Dois terminais separados

```bash
# Terminal 1 — Frontend
pnpm dev

# Terminal 2 — Backend
pnpm server
```

Acesse em: **http://localhost:5173**

> **Primeiro acesso:** a tela inicial redireciona para o login. Para criar sua conta acesse **http://localhost:5173/register**.

---

## Scripts úteis

| Comando                     | O que faz                           |
| --------------------------- | ----------------------------------- |
| `pnpm dev:all`              | Inicia frontend + backend juntos    |
| `pnpm dev`                  | Apenas frontend (Vite, porta 5173)  |
| `pnpm server`               | Apenas backend (Hono, porta 3001)   |
| `pnpm db:migrate`           | Aplica novas migrations             |
| `npx prisma studio`         | Abre o Prisma Studio (GUI do banco) |
| `npx prisma migrate status` | Verifica estado das migrations      |
| `pnpm typecheck`            | Checa tipos TypeScript              |
| `pnpm test`                 | Roda os testes                      |

---

## Checklist rápido

- [ ] Node.js 18+ e pnpm instalados
- [ ] `.env` criado a partir de `.env.example` com `DATABASE_URL` e `JWT_SECRET` preenchidos
- [ ] Banco rodando (`docker compose up -d` ou PostgreSQL local)
- [ ] `pnpm install` executado
- [ ] `npx prisma migrate dev --name init` executado
- [ ] Índice GIN criado (`CREATE INDEX idx_tx_tags_gin ON transactions USING GIN (tags);`)
- [ ] `pnpm dev:all` rodando — acesse http://localhost:5173
- [ ] Criar conta em http://localhost:5173/register

---

## Estrutura do banco

| Tabela         | Descrição                                      |
| -------------- | ---------------------------------------------- |
| `users`        | Conta do usuário + config de IA                |
| `imports`      | Arquivos importados (CSV/OFX)                  |
| `transactions` | Lançamentos financeiros com suporte a IA       |
| `categories`   | Hierárquicas, globais (sistema) ou por usuário |
| `ai_rules`     | Regras de categorização automática por padrão  |

## Índices de performance

| Índice                      | Tabela         | Justificativa                            |
| --------------------------- | -------------- | ---------------------------------------- |
| `uq_transaction_user_hash`  | `transactions` | Deduplicação de importação               |
| `idx_tx_user_date`          | `transactions` | Query raiz do extrato (90% das leituras) |
| `idx_tx_user_date_type`     | `transactions` | Filtro receita/despesa no dashboard      |
| `idx_tx_user_category_date` | `transactions` | Drill-down por categoria + período       |
| `idx_tx_ai_review`          | `transactions` | Fila de revisão manual IA                |
| `idx_tx_import`             | `transactions` | JOIN com imports                         |
| `idx_tx_tags_gin`           | `transactions` | Busca `@>` em array de tags (GIN)        |
| `idx_imports_user_created`  | `imports`      | Listagem de imports por data             |
| `idx_imports_user_status`   | `imports`      | Polling do worker de processamento       |
| `idx_imports_user_month`    | `imports`      | Filtro por competência mensal            |
| `idx_cat_user_type_order`   | `categories`   | Listar categorias na ordem correta       |
| `idx_rules_user_priority`   | `ai_rules`     | Motor de regras (ordem de prioridade)    |
