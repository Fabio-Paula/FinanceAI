// =============================================================================
// Entrafy — tipos globais
// =============================================================================

export type Plan = 'free' | 'pro'
export type AiProvider = 'openai' | 'anthropic' | 'google'
export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'
export type ImportStatus = 'pending' | 'processing' | 'done' | 'error'
export type MatchType = 'exact' | 'contains' | 'starts_with' | 'regex'

// ── Entidades ────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  plan: Plan
  ai_provider?: AiProvider | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon?: string | null
  color?: string | null
  type: CategoryType
  parent_id?: string | null
  is_system: boolean
  sort_order: number
  children?: Category[]
}

export interface Transaction {
  id: string
  user_id: string
  import_id?: string | null
  date: string
  description: string
  description_normalized?: string | null
  amount: string
  type: TransactionType
  category_id?: string | null
  ai_category_id?: string | null
  ai_confidence?: number | null
  ai_model?: string | null
  is_ai_confirmed: boolean
  is_recurring: boolean
  tags: string[]
  notes?: string | null
  created_at: string
  updated_at: string
  // relations
  category?: Category | null
  ai_category?: Category | null
}

export interface Import {
  id: string
  user_id: string
  filename: string
  storage_path: string
  institution?: string | null
  status: ImportStatus
  total_rows?: number | null
  processed_rows?: number | null
  error_log?: unknown
  column_mapping?: unknown
  month_ref?: string | null
  created_at: string
}

export interface AiRule {
  id: string
  user_id: string
  pattern: string
  match_type: MatchType
  category_id: string
  priority: number
  times_applied: number
  created_at: string
  category?: Category
}

export interface RecurringItem {
  id: string
  user_id: string
  description: string
  type: TransactionType
  category_id?: string | null
  day_of_month?: number | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  entries?: RecurringEntry[]
}

export interface RecurringEntry {
  id: string
  item_id: string
  user_id: string
  month_ref: string
  amount: string
  is_paid: boolean
  paid_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CursorPage<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  pendingReview: number
  month: string
}

export interface CategoryBreakdown {
  category_id: string
  category_name: string
  color: string | null
  icon: string | null
  total: number
  count: number
  percentage: number
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  sub: string // user id
  email: string
  name: string
  plan: Plan
  iat: number
  exp: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: Omit<User, 'created_at' | 'updated_at'>
}
