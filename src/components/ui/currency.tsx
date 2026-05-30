import { cn } from "@/lib/utils";

// ─── Formatter ────────────────────────────────────────────────────────────────

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style:    "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurrencyProps {
  /** Raw numeric value (positive = credit, negative = debit) */
  value: number;
  /**
   * Visual size variant
   * - sm: text-sm  (12 / 14 px)
   * - md: text-base (16 px) — default
   * - lg: text-xl  (20 px)
   */
  size?: "sm" | "md" | "lg";
  /**
   * Color strategy:
   * - "auto"  : green for positive, red for negative, muted for zero
   * - "muted" : always use muted foreground (neutral, table columns)
   */
  color?: "auto" | "muted";
  /** Extra className forwarded to the span */
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeClass: Record<NonNullable<CurrencyProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Currency({
  value,
  size  = "md",
  color = "auto",
  className,
}: CurrencyProps) {
  const formatted = brlFormatter.format(value);

  const colorClass =
    color === "muted"
      ? "text-muted-foreground"
      : value > 0
        ? "text-[hsl(var(--success))]"
        : value < 0
          ? "text-[hsl(var(--destructive))]"
          : "text-muted-foreground";

  return (
    <span
      data-currency
      data-value={value}
      className={cn(
        "font-mono tabular-nums",
        sizeClass[size],
        colorClass,
        className,
      )}
    >
      {formatted}
    </span>
  );
}
