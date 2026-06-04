import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    fontFamily: {
      sans: ['IBM Plex Sans', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      mono: ['IBM Plex Sans', 'var(--font-mono)', 'monospace'],
    },
    extend: {
      colors: {
        // ── shadcn/ui semantic tokens ──────────────────────────────────
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // ── chart tokens ───────────────────────────────────────────────
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // ── 13 category colors ─────────────────────────────────────────
        category: {
          mercado: 'var(--category-mercado)',
          restaurante: 'var(--category-restaurante)',
          transporte: 'var(--category-transporte)',
          streaming: 'var(--category-streaming)',
          saude: 'var(--category-saude)',
          farmacia: 'var(--category-farmacia)',
          lazer: 'var(--category-lazer)',
          assinaturas: 'var(--category-assinaturas)',
          combustivel: 'var(--category-combustivel)',
          educacao: 'var(--category-educacao)',
          salario: 'var(--category-salario)',
          investimentos: 'var(--category-investimentos)',
          outros: 'var(--category-outros)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // ── Entrafy brand colors (raw, for reference) ──────────────────
      // primary:  #1E3A5F  (azul escuro)
      // accent:   #2E75B6  (azul médio)
    },
  },
  plugins: [],
} satisfies Config

export default config
