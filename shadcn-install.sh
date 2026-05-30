#!/usr/bin/env bash
# FinanceAI — shadcn/ui component installation
# Run from the project root after `npx shadcn@latest init`

npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add popover
npx shadcn@latest add skeleton
npx shadcn@latest add sonner        # toast (Sonner — recommended over toast in shadcn v2)
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add sheet
npx shadcn@latest add chart         # Recharts wrapper — includes AreaChart, BarChart, PieChart

# ── Or install all at once ────────────────────────────────────────────────────
# npx shadcn@latest add button card badge table input select dialog \
#   dropdown-menu popover skeleton sonner separator avatar sheet chart
