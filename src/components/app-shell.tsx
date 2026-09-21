import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  Menu,
  Scale,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const navItems = [
  { to: "/", label: "Panel general", icon: Gauge },
  { to: "/solicitantes", label: "Solicitantes", icon: Users },
  { to: "/variables", label: "Variables de riesgo", icon: Settings2 },
  { to: "/reglas", label: "Reglas de scoring", icon: Scale },
  { to: "/evaluaciones", label: "Evaluaciones", icon: ClipboardCheck },
  { to: "/informes", label: "Informes", icon: BarChart3 },
] as const;

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav aria-label="Navegación principal" className="mt-2 flex-1 space-y-1 px-3">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? "bg-accent-soft font-semibold text-foreground" : "text-muted-foreground hover:bg-accent-soft/60 hover:text-foreground"}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={`size-4 shrink-0 ${active ? "text-primary" : ""}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {active && <ChevronRight className="size-3.5 text-primary" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 px-5 py-5"
      aria-label="Veridica, ir al panel general"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
        V
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-bold">Veridica</span>
        <span className="block font-mono text-[10px] uppercase text-muted-foreground">
          Scoring crediticio
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#contenido"
        className="sr-only z-50 bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <div className="relative flex min-h-screen">
        <aside className="glass sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border md:flex">
          <Brand />
          <Navigation />
          <UserSummary />
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              className="absolute inset-0 bg-overlay"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="glass relative flex h-full w-[min(19rem,86vw)] flex-col border-r border-border shadow-xl">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
                <Brand />
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-3"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <Navigation onNavigate={() => setMobileOpen(false)} />
              <UserSummary />
            </aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="glass sticky top-0 z-30 border-b border-border">
            <div className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 md:px-8">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  Motor de decisión
                </p>
                <p className="truncate font-display text-sm font-bold sm:text-base">
                  Riesgo claro. Decisiones trazables.
                </p>
              </div>
              <ThemeSwitcher />
            </div>
          </header>
          <main
            id="contenido"
            className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function UserSummary() {
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground font-display text-xs font-bold text-background">
          AR
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Ana Ríos</p>
          <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
            Analista de crédito
          </p>
        </div>
      </div>
    </div>
  );
}
