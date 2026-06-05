import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryKey =
  | 'Mercado'
  | 'Restaurante'
  | 'Transporte'
  | 'Streaming'
  | 'Saúde'
  | 'Farmácia'
  | 'Lazer'
  | 'Assinaturas'
  | 'Combustível'
  | 'Educação'
  | 'Salário'
  | 'Investimentos'
  | 'Outros'

interface CategoryColorTokens {
  /** CSS variable name for the background color */
  bg: string
  /** CSS variable name for the foreground (text) color */
  fg: string
  /** CSS variable name for the muted (10 % opacity bg) color */
  muted: string
  /** Hex value for light mode (for charts / non-CSS contexts) */
  hex: string
}

// ─── Category color map ───────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<CategoryKey, CategoryColorTokens> = {
  Mercado: {
    bg: 'var(--category-mercado)',
    fg: 'var(--category-mercado-fg)',
    muted: 'var(--category-mercado-muted)',
    hex: '#2D7D46',
  },
  Restaurante: {
    bg: 'var(--category-restaurante)',
    fg: 'var(--category-restaurante-fg)',
    muted: 'var(--category-restaurante-muted)',
    hex: '#C2410C',
  },
  Transporte: {
    bg: 'var(--category-transporte)',
    fg: 'var(--category-transporte-fg)',
    muted: 'var(--category-transporte-muted)',
    hex: '#1D4ED8',
  },
  Streaming: {
    bg: 'var(--category-streaming)',
    fg: 'var(--category-streaming-fg)',
    muted: 'var(--category-streaming-muted)',
    hex: '#7C3AED',
  },
  Saúde: {
    bg: 'var(--category-saude)',
    fg: 'var(--category-saude-fg)',
    muted: 'var(--category-saude-muted)',
    hex: '#0891B2',
  },
  Farmácia: {
    bg: 'var(--category-farmacia)',
    fg: 'var(--category-farmacia-fg)',
    muted: 'var(--category-farmacia-muted)',
    hex: '#0D9488',
  },
  Lazer: {
    bg: 'var(--category-lazer)',
    fg: 'var(--category-lazer-fg)',
    muted: 'var(--category-lazer-muted)',
    hex: '#DB2777',
  },
  Assinaturas: {
    bg: 'var(--category-assinaturas)',
    fg: 'var(--category-assinaturas-fg)',
    muted: 'var(--category-assinaturas-muted)',
    hex: '#9333EA',
  },
  Combustível: {
    bg: 'var(--category-combustivel)',
    fg: 'var(--category-combustivel-fg)',
    muted: 'var(--category-combustivel-muted)',
    hex: '#D97706',
  },
  Educação: {
    bg: 'var(--category-educacao)',
    fg: 'var(--category-educacao-fg)',
    muted: 'var(--category-educacao-muted)',
    hex: '#2563EB',
  },
  Salário: {
    bg: 'var(--category-salario)',
    fg: 'var(--category-salario-fg)',
    muted: 'var(--category-salario-muted)',
    hex: '#16A34A',
  },
  Investimentos: {
    bg: 'var(--category-investimentos)',
    fg: 'var(--category-investimentos-fg)',
    muted: 'var(--category-investimentos-muted)',
    hex: '#1E3A5F',
  },
  Outros: {
    bg: 'var(--category-outros)',
    fg: 'var(--category-outros-fg)',
    muted: 'var(--category-outros-muted)',
    hex: '#64748B',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface CategoryBadgeProps {
  /** Name of the financial category */
  category: string
  /** AI confidence score from 0 to 1 (optional) */
  confidence?: number
  /** Visual size variant */
  size?: 'sm' | 'md'
  /** Extra className */
  className?: string
  /** Hex color from DB (overrides theme map) */
  color?: string | null
}

export function CategoryBadge({
  category,
  confidence,
  size = 'md',
  className,
  color,
}: CategoryBadgeProps) {
  const themeColors = CATEGORY_COLORS[category as CategoryKey] ?? CATEGORY_COLORS.Outros

  const showWarning = confidence !== undefined && confidence < 0.75
  const showCheck = confidence !== undefined && confidence >= 0.95

  const hexColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null
  const style = hexColor
    ? {
        backgroundColor: hexToRgba(hexColor, 0.12),
        color: hexColor,
        borderColor: hexToRgba(hexColor, 0.3),
      }
    : {
        backgroundColor: themeColors.bg,
        color: themeColors.fg,
        borderColor: `color-mix(in srgb, ${themeColors.fg} 20%, transparent)`,
      }

  return (
    <div
      data-category={category}
      className={cn(
        'inline-flex items-center gap-2 rounded-md font-semibold leading-none border',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
        className
      )}
      style={style}
    >
      {showWarning && (
        <AlertTriangle
          aria-label="Baixa confiança"
          className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
        />
      )}
      {showCheck && (
        <CheckCircle2
          aria-label="Alta confiança"
          className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
        />
      )}
      {category}
    </div>
  )
}
