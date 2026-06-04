# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Entrafy** is a personal finance management app with AI-assisted transaction categorization. It has two processes that must run simultaneously:

- **Frontend**: React + Vite + TanStack Router (port 5173)
- **Backend API**: Hono on Node.js (port 3001)

The Vite dev server proxies `/api` → `http://localhost:3001`, so the frontend always calls relative `/api/...` paths.

## Commands

### Quick Commands

- `/commit` — Analyze staged git changes and create a smart conventional commit
- `/commit-help` — Show help for the commit command

### Project Scripts

```bash
# Frontend (dev)
npm run dev          # starts Vite on :5173, auto-generates routeTree.gen.ts

# Backend (dev) — run in a separate terminal
npx ts-node server/index.ts
# or if a script exists:
npm run server

# Database
npx prisma migrate dev --name <name>   # apply schema changes
npx prisma db seed                     # seed with demo data (demo@entrafy.dev / demo123)
npx prisma studio                      # GUI to inspect DB
npx prisma migrate status              # check migration state

# After a fresh clone
cp .env.example .env.local             # fill DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npx prisma db seed
```

> After `npx prisma migrate dev`, manually add the GIN index for tag searches:
>
> ```sql
> CREATE INDEX idx_tx_tags_gin ON transactions USING GIN (tags);
> ```

## Architecture

### Frontend (`src/`)

- **Routing**: TanStack Router with file-based routing — `src/routes/` maps directly to URL paths. `routeTree.gen.ts` is auto-generated on `npm run dev`; never edit it manually.
  - `__root.tsx` — root layout
  - `_auth.tsx` / `_auth/login.tsx` — unauthenticated shell + login page
  - `_app.tsx` / `_app/` — authenticated shell; all protected routes live here
- **Data fetching**: TanStack Query (`QueryClient` in `main.tsx`). API calls go through `src/lib/api.ts` helpers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`), which read the JWT from `localStorage` and redirect to `/login` on 401.
- **UI**: shadcn/ui components in `src/components/ui/`. Path alias `@` resolves to `src/`.
- **Types**: All shared TypeScript types are in `src/types/index.ts` — used by both frontend and backend.
- **Mock data**: `src/lib/mock-data.ts` holds static fixture data used while the real API is not yet wired up on a given screen.

### Backend (`server/`)

- **Framework**: Hono on `@hono/node-server` (port 3001).
- **Entry point**: `server/index.ts` mounts all route groups under `/api/`.
- **Auth**: JWT-based. `server/middleware/auth.ts` verifies the `Authorization: Bearer <token>` header and injects `userId`, `userEmail`, `userPlan` into the Hono context. Every route group except `/api/auth` uses this middleware.
- **Validation**: Zod schemas inline in each route file.
- **Database**: Prisma 5 + PostgreSQL 16. The `prisma` client is instantiated in `src/lib/prisma.ts` (shared by both layers — note the import path `../../src/lib/prisma.js` from server files).

### Database schema (`schema.prisma`)

Five models: `User`, `Import`, `Transaction`, `Category`, `AiRule`.

Key design decisions:

- `Transaction.hash` is `SHA-256(userId|date|description|amount)` — unique per user, used for dedup on import.
- `Transaction.description_normalized` is the lowercased, NFD-stripped version used for search.
- `Category.user_id = NULL` means a system-global category; user-owned categories have `user_id` set.
- `Transaction` has two category FK columns: `category_id` (manual override) and `ai_category_id` (AI suggestion).
- The GIN index on `tags` must be created via raw SQL migration (Prisma does not support it natively).

## Environment Variables

| Variable       | Required | Description                                                                          |
| -------------- | -------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string                                                         |
| `JWT_SECRET`   | Yes      | Signs/verifies auth tokens (default falls back to `dev-secret-change-in-production`) |
| `PORT`         | No       | API port (default `3001`)                                                            |

## Slash Commands

This project includes custom slash commands for quick workflows:

### `/commit`

**Quick Smart Commit** — Analyze staged git changes and create a conventional commit automatically.

```bash
# Example workflow:
git add src/components/Button.tsx
/commit
# → Claude analyzes changes and proposes: style(ui): improve button component styling
```

**How it works:**

1. Analyzes `git diff --cached`
2. Detects scope (frontend, backend, database, etc.)
3. Classifies change type (feat, fix, style, refactor, etc.)
4. Generates descriptive bullet points
5. Shows proposed message and waits for approval
6. Creates commit automatically on confirmation

**Installed skills:**

- `git-smart-commit` — Full skill with detailed options
- `commit` — Quick `/commit` command shorthand

See `.COMMIT_HELP.md` for detailed documentation.
