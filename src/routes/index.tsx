import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Scale,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { isAuthApiConfigured } from "@/api/auth";
import { PublicHeader, PublicFooter } from "@/components/layout/public-shell";
import { Panel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    icon: Users,
    title: "Solicitantes",
    text: "Registra solicitantes y consulta su información por número de documento.",
  },
  {
    icon: Settings2,
    title: "Variables de riesgo",
    text: "Define qué variables entran al modelo (ingresos, moras, historial…) y actívalas o desactívalas.",
  },
  {
    icon: Scale,
    title: "Reglas de scoring",
    text: "Configura condiciones y puntajes por variable, y edítalas cuando el criterio de negocio cambie.",
  },
  {
    icon: ClipboardCheck,
    title: "Evaluaciones e informes",
    text: "Calcula el score de un solicitante cruzando sus datos contra las reglas activas, con el detalle de cada regla aplicada.",
  },
] as const;

function LandingPage() {
  // Sin backend de autenticación la landing ofrece el recorrido demo; con él,
  // solo el acceso con cuenta (no hay registro público).
  const demo = !isAuthApiConfigured;
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/iniciar-sesion">Iniciar sesión</Link>
            </Button>
            {demo && (
              <Button asChild size="sm">
                <Link to="/crear-cuenta">Crear cuenta</Link>
              </Button>
            )}
          </>
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            Scoring crediticio
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-5xl">
            Decisiones de crédito más rápidas, consistentes y trazables
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Veridica centraliza solicitantes, variables de riesgo y reglas de scoring en un solo
            panel, para que cada evaluación de crédito quede documentada y sea fácil de auditar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {demo ? (
              <>
                <Button asChild>
                  <Link to="/crear-cuenta">
                    Crear cuenta gratis
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/panel">Ver panel de demostración</Link>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/iniciar-sesion">
                  Iniciar sesión
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Qué hacemos */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="font-display text-2xl font-bold">Qué hacemos</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Un módulo por cada paso del proceso de evaluación crediticia.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <Panel key={title} className="p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
              </Panel>
            ))}
          </div>
        </section>

        {/* Quiénes somos */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <Panel className="grid gap-6 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-8">
            <span className="grid size-12 place-items-center rounded-lg bg-accent-soft text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Quiénes somos</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Veridica es un proyecto de scoring crediticio pensado para equipos de riesgo que
                necesitan un criterio de evaluación claro y auditable: cada puntaje se puede
                explicar regla por regla, en vez de depender de una decisión manual sin registro.
                Este panel está en desarrollo activo.{" "}
                {demo
                  ? "Hoy mismo puedes explorarlo en modo demostración, sin necesidad de crear una cuenta."
                  : "El acceso es con la cuenta que te asigne un administrador de riesgo."}
              </p>
            </div>
          </Panel>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <Panel className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-display text-xl font-bold">
                {demo ? "Explora el panel ahora" : "Accede a tu panel"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {demo
                  ? "Sin registro: puedes recorrer todos los módulos en modo demostración."
                  : "Inicia sesión con tu cuenta para trabajar con los módulos de tu rol."}
              </p>
            </div>
            <Button asChild>
              <Link to={demo ? "/panel" : "/iniciar-sesion"}>
                {demo ? "Ir al panel" : "Iniciar sesión"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Panel>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
