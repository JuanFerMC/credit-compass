import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoNotice, PageHeader, Panel } from "@/components/page";
import { StatusBadge } from "@/components/status-badge";
import { evaluations } from "@/lib/demo-data";

export const Route = createFileRoute("/")({ head: () => ({ meta: [
  { title: "Panel general — Veridica" }, { name: "description", content: "Resumen de cartera y actividad del motor de scoring crediticio." }, { property: "og:title", content: "Panel general — Veridica" }, { property: "og:description", content: "Resumen de cartera y actividad del motor de scoring crediticio." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: Dashboard });

const metrics = [
  { label: "Cartera evaluada", value: "1.284", note: "3,2% este mes", icon: Users, tone: "positive" },
  { label: "Score promedio", value: "712", note: "+18 puntos", icon: TrendingUp, tone: "positive" },
  { label: "Evaluaciones hoy", value: "47", note: "12 pendientes", icon: ClipboardCheck, tone: "accent" },
  { label: "Riesgo alto", value: "17%", note: "−2,1 puntos", icon: TrendingDown, tone: "warning" },
] as const;
const distribution = [
  { label: "Muy bajo", count: 412, percent: 32, className: "bg-positive", marker: "A" }, { label: "Bajo", count: 388, percent: 30, className: "bg-info", marker: "B" }, { label: "Medio", count: 296, percent: 23, className: "bg-warning", marker: "C" }, { label: "Alto y muy alto", count: 188, percent: 15, className: "bg-destructive", marker: "D" },
];

function Dashboard() {
  return <><PageHeader eyebrow="Panel general" title="Resumen de cartera" description="Una vista clara de las evaluaciones, el riesgo y el comportamiento reciente del portafolio." action={<Button asChild><Link to="/evaluaciones">Nueva evaluación<ArrowRight className="size-4" /></Link></Button>} /><DemoNotice />
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicadores principales">{metrics.map(({ label, value, note, icon: Icon, tone }, index) => <Panel key={label} className="animate-rise p-4 sm:p-5" ><div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold sm:text-3xl">{value}</p><p className={`mt-1 text-xs font-semibold text-${tone}`}>{note}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-primary"><Icon className="size-4" /></span></div></Panel>)}</section>
    <section className="grid gap-6 lg:grid-cols-5"><Panel className="p-5 lg:col-span-2"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><div><h2 className="font-display text-lg font-bold">Distribución por nivel</h2><p className="text-sm text-muted-foreground">Cartera actual por categoría.</p></div><span className="font-mono text-xs text-muted-foreground">SEP 2026</span></div><div className="mt-6 space-y-5">{distribution.map((item) => <div key={item.label}><div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm"><span className="flex min-w-0 items-center gap-2 font-semibold"><span className={`grid size-6 shrink-0 place-items-center rounded text-[10px] text-primary-foreground ${item.className}`}>{item.marker}</span><span className="truncate">{item.label}</span></span><span className="font-mono text-xs text-muted-foreground">{item.count} · {item.percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full ${item.className}`} style={{ width: `${item.percent}%` }} /></div></div>)}</div></Panel>
      <Panel className="overflow-hidden lg:col-span-3"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border px-5 py-4"><div><h2 className="font-display text-lg font-bold">Evaluaciones recientes</h2><p className="text-sm text-muted-foreground">Últimos cálculos del motor.</p></div><Button asChild variant="ghost" size="sm"><Link to="/evaluaciones">Ver todas</Link></Button></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Solicitante</th><th>Score</th><th>Nivel</th><th>Fecha</th></tr></thead><tbody>{evaluations.slice(0, 4).map((item) => <tr key={item.id}><td><p className="font-semibold">{item.name}</p><p className="font-mono text-[10px] text-muted-foreground">{item.document}</p></td><td className="font-mono font-bold">{item.score}</td><td><StatusBadge tone={item.tone}>{item.level}</StatusBadge></td><td className="whitespace-nowrap text-muted-foreground">{item.date}</td></tr>)}</tbody></table></div></Panel>
    </section>
    <Panel className="overflow-hidden"><div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)]"><div className="p-5 sm:p-6"><p className="font-mono text-[10px] uppercase text-primary">Interpretación del modelo</p><h2 className="mt-2 font-display text-xl font-bold">El riesgo se explica, no solo se puntúa.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Cada evaluación conserva las reglas consideradas, condiciones cumplidas y puntos obtenidos. Esto permite auditar el resultado sin recalcular el pasado cuando cambia el modelo.</p></div><div className="border-t border-border bg-surface p-5 md:border-l md:border-t-0"><div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4"><div className="score-orbit"><span>712</span></div><div><p className="font-semibold">Score promedio</p><p className="mt-1 text-sm text-muted-foreground">Riesgo bajo en el período</p><div className="mt-3 flex gap-1"><span className="h-2 flex-[3] rounded bg-positive" /><span className="h-2 flex-[2] rounded bg-info" /><span className="h-2 flex-1 rounded bg-warning" /></div></div></div></div></div></Panel>
  </>;
}
