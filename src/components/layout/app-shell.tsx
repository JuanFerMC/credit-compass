import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  LogOut,
  Menu,
  UserCog,
  Scale,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { auth, isAuthApiConfigured } from "@/api/auth";
import { ROLE_LABEL } from "@/api/roles";
import { canAccess } from "@/api/permissions";
import { useSession } from "@/api/session";
import { useRol } from "@/api/use-rol";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

const navItems = [
  { to: "/panel", label: "Panel general", icon: Gauge },
  { to: "/panel/solicitantes", label: "Solicitantes", icon: Users },
  { to: "/panel/variables", label: "Variables de riesgo", icon: Settings2 },
  { to: "/panel/reglas", label: "Reglas de scoring", icon: Scale },
  { to: "/panel/evaluaciones", label: "Evaluaciones", icon: ClipboardCheck },
  { to: "/panel/informes", label: "Informes", icon: BarChart3 },
  { to: "/panel/usuarios", label: "Gestión de usuarios", icon: UserCog },
] as const;

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const rol = useRol();
  const visibleItems = navItems.filter(({ to }) => rol !== null && canAccess(rol, to));
  return (
    <nav aria-label="Navegación principal" className="mt-2 flex-1 space-y-1 px-3">
      {visibleItems.map(({ to, label, icon: Icon }) => {
        const active = to === "/panel" ? pathname === "/panel" : pathname.startsWith(to);
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
      to="/panel"
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
            <div className="flex min-h-16 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-8">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="hidden font-mono text-[10px] uppercase text-muted-foreground sm:block">
                  Motor de decisión
                </p>
                <p className="truncate font-display text-sm font-bold sm:text-base">
                  Riesgo claro. Decisiones trazables.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <HeaderAccountActions />
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <main
            id="contenido"
            className="mx-auto w-full max-w-none space-y-6 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function initialsOf(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0] ?? "?"];
  return letters
    .map((part) => part?.[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


function HeaderAccountActions() {
  const session = useSession();
  const navigate = useNavigate();

  async function logout() {
    await auth.logout();
    await navigate({ to: "/" });
  }

  if (session.status !== "authenticated") return null;
  const { nombre } = session.user;

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-full"
        aria-label="Mi cuenta"
        title="Mi cuenta"
      >
        <Link to="/panel/cuenta">
          <span className="grid size-8 place-items-center rounded-full bg-foreground font-display text-xs font-bold text-background">
            {initialsOf(nombre)}
          </span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="size-9 shrink-0 px-0 sm:h-9 sm:w-auto sm:px-3"
        onClick={logout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="size-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Cerrar sesión</span>
      </Button>
    </>
  );
}

function UserSummary() {
  const session = useSession();

  if (session.status !== "authenticated") {
    return (
      <div className="border-t border-border p-3">
        <p className="px-2 py-2 font-mono text-[10px] uppercase text-muted-foreground">
          {session.status === "restoring" ? "Cargando sesión…" : "Sin sesión"}
        </p>
        {session.status === "anonymous" && (
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link to="/iniciar-sesion">Iniciar sesión</Link>
          </Button>
        )}
      </div>
    );
  }

  const { nombre, rol } = session.user;
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground font-display text-xs font-bold text-background">
          {initialsOf(nombre)}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{nombre}</p>
          <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
            {ROLE_LABEL[rol]}
            {!isAuthApiConfigured && " · demo"}
          </p>
        </div>
      </div>
      <p className="mt-1 px-2 text-xs text-muted-foreground">
        Gestiona tu cuenta desde el avatar de la cabecera.
      </p>
    </div>
  );
}
