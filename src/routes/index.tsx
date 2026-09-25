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
import { PublicHeader, PublicFooter } from "@/components/public-shell";
import { Panel } from "@/components/page";
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
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/iniciar-sesion">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/crear-cuenta">Crear cuenta</Link>
            </Button>
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
            <Button asChild>
              <Link to="/crear-cuenta">
                Crear cuenta gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/panel">Ver panel de demostración</Link>
            </Button>
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
                Este panel está en desarrollo activo — hoy mismo puedes explorarlo en modo
                demostración, sin necesidad de crear una cuenta.
              </p>
            </div>
          </Panel>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <Panel className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-display text-xl font-bold">Explora el panel ahora</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sin registro: puedes recorrer todos los módulos en modo demostración.
              </p>
            </div>
            <Button asChild>
              <Link to="/panel">
                Ir al panel
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
