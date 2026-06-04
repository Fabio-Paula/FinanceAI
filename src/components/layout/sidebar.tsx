import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  LayoutDashboard, ArrowDownUp, Upload, Tag, Settings, TrendingUp, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard",    to: "/",             icon: LayoutDashboard },
  { label: "Transações",   to: "/transactions", icon: ArrowDownUp },
  { label: "Importar",     to: "/import",       icon: Upload },
  { label: "Categorias",   to: "/categories",   icon: Tag },
  { label: "Configurações",to: "/settings",     icon: Settings },
] as const;

export function Sidebar() {
  const matchRoute = useMatchRoute();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <TrendingUp className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm text-foreground tracking-tight">Entrafy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ label, to, icon: Icon }) => {
          const active = !!matchRoute({ to, fuzzy: to === "/" ? false : true });
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors group">
          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            F
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Fabio</p>
            <p className="text-xs text-muted-foreground truncate">demo@entrafy.dev</p>
          </div>
          <LogOut className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </aside>
  );
}
