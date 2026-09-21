import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Download, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PendingBadge } from "@/components/page";

export const Route = createFileRoute("/informes")({
  head: () => ({
    meta: [
      { title: "Informes de riesgo — Veridica" },
      {
        name: "description",
        content: "Distribución y tendencias de riesgo de la cartera crediticia.",
      },
      { property: "og:title", content: "Informes de riesgo — Veridica" },
      {
        property: "og:description",
        content: "Distribución y tendencias de riesgo de la cartera crediticia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});
const periods = [
  { month: "Abr", score: 661 },
  { month: "May", score: 675 },
  { month: "Jun", score: 668 },
  { month: "Jul", score: 690 },
  { month: "Ago", score: 701 },
  { month: "Sep", score: 712 },
];
// Tailwind analiza las clases estáticamente en build time, así que no puede
// detectar clases construidas dinámicamente como `bg-${tone}-soft`; ese
// patrón generaba clases inexistentes y, por lo tanto, elementos sin
// estilo. Este mapa fijo resuelve tono -> clases reales que sí compilan.
const toneClasses: Record<string, { soft: string; text: string }> = {
  positive: { soft: "bg-positive-soft", text: "text-positive" },
  info: { soft: "bg-info-soft", text: "text-info" },
  warning: { soft: "bg-warning-soft", text: "text-warning" },
  destructive: { soft: "bg-destructive-soft", text: "text-destructive" },
  critical: { soft: "bg-critical-soft", text: "text-critical" },
};
function toneClass(tone: keyof typeof toneClasses) {
  return toneClasses[tone] ?? toneClasses["info"]!;
}
function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Análisis de cartera"
        title="Informes"
        description="Monitorea la distribución del riesgo y detecta cambios relevantes para la estrategia de crédito."
        action={
          <div className="flex items-center gap-2">
            <PendingBadge />
            <Button variant="secondary" disabled>
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <ReportMetric title="Evaluaciones" value="1.284" detail="+6,2%" positive />
        <ReportMetric title="Score promedio" value="712" detail="+18 pts" positive />
        <ReportMetric title="Riesgo alto" value="17%" detail="−2,1 pts" positive />
      </section>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <FileBarChart className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">Evolución del score</h2>
              <p className="text-sm text-muted-foreground">Promedio mensual de la cartera.</p>
            </div>
          </div>
          <div className="mt-8 flex h-64 items-end gap-3 border-b border-border px-2">
            {periods.map((period) => (
              <div key={period.month} className="flex h-full flex-1 flex-col justify-end gap-2">
                <span className="text-center font-mono text-xs font-semibold">{period.score}</span>
                <div
                  className="rounded-t-md bg-primary"
                  style={{ height: `${(period.score - 500) / 2.2}%` }}
                />
                <span className="pb-2 text-center font-mono text-[10px] text-muted-foreground">
                  {period.month}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Hallazgos del período</h2>
          <div className="mt-5 space-y-4">
            <Finding
              icon={<ArrowUpRight />}
              title="Mejora sostenida"
              text="El score promedio creció durante tres meses consecutivos."
              tone="positive"
            />
            <Finding
              icon={<ArrowDownRight />}
              title="Menos riesgo alto"
              text="La proporción de casos de riesgo alto disminuyó 2,1 puntos."
              tone="info"
            />
            <Finding
              icon={<FileBarChart />}
              title="Mayor actividad"
              text="Se completaron 76 evaluaciones más que el período anterior."
              tone="warning"
            />
          </div>
        </Panel>
      </section>
      <Panel className="p-5">
        <h2 className="font-display text-lg font-bold">Distribución de cartera</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {(
            [
              ["Muy bajo", "35%", "positive"],
              ["Bajo", "28%", "info"],
              ["Medio", "20%", "warning"],
              ["Alto", "12%", "destructive"],
              ["Muy alto", "5%", "critical"],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className={`rounded-lg p-4 ${toneClass(tone).soft}`}>
              <p className={`font-display text-2xl font-bold ${toneClass(tone).text}`}>{value}</p>
              <p className="mt-1 text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
function ReportMetric({
  title,
  value,
  detail,
  positive,
}: {
  title: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <Panel className="p-5">
      <p className="font-mono text-[10px] uppercase text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <strong className="font-display text-3xl">{value}</strong>
        <span className={positive ? "text-positive" : "text-destructive"}>{detail}</span>
      </div>
    </Panel>
  );
}
function Finding({
  icon,
  title,
  text,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: keyof typeof toneClasses;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <span
        className={`grid size-9 place-items-center rounded-lg [&>svg]:size-4 ${toneClass(tone).soft} ${toneClass(tone).text}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
