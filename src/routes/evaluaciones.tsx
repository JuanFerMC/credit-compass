import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Calculator, Check, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PendingBadge } from "@/components/page";
import { StatusBadge } from "@/components/status-badge";
import { evaluations, scoringRules } from "@/lib/demo-data";

export const Route = createFileRoute("/evaluaciones")({
  head: () => ({
    meta: [
      { title: "Evaluaciones — Veridica" },
      { name: "description", content: "Cálculo explicable e historial de scoring crediticio." },
      { property: "og:title", content: "Evaluaciones — Veridica" },
      {
        property: "og:description",
        content: "Cálculo explicable e historial de scoring crediticio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvaluationsPage,
});

function EvaluationsPage() {
  const [document, setDocument] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  function calculate(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6,15}$/.test(document)) return;
    setLoading(true);
    window.setTimeout(() => {
      setComplete(true);
      setLoading(false);
    }, 650);
  }
  return (
    <>
      <PageHeader
        eyebrow="Análisis de crédito"
        title="Evaluaciones"
        description="Calcula un puntaje y revisa qué reglas influyeron en el resultado, sin perder la trazabilidad."
        action={<PendingBadge />}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5 sm:p-6">
          <form onSubmit={calculate}>
            <label htmlFor="eval-document" className="text-sm font-semibold">
              Documento del solicitante
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  id="eval-document"
                  className="form-control pl-10"
                  inputMode="numeric"
                  value={document}
                  onChange={(e) => {
                    setDocument(e.target.value.replace(/\D/g, "").slice(0, 15));
                    setComplete(false);
                  }}
                  placeholder="Ej. 1023456789"
                />
              </div>
              <Button type="submit" disabled={loading || !/^\d{6,15}$/.test(document)}>
                <Calculator className="size-4" />
                {loading ? "Calculando…" : "Calcular score"}
              </Button>
            </div>
          </form>
          {complete ? (
            <div className="mt-6 border-t border-border pt-6" aria-live="polite">
              <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <div className="score-tile">
                  <span className="font-mono text-[10px] uppercase">Puntaje final</span>
                  <strong className="font-display text-5xl">950</strong>
                  <StatusBadge tone="positive">Muy bajo riesgo</StatusBadge>
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">
                    Resultado favorable y explicable
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cinco condiciones aportaron al puntaje. La decisión final debe considerar las
                    políticas vigentes de la entidad.
                  </p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[95%] bg-positive" />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>0 · Muy alto</span>
                    <span>500 · Medio</span>
                    <span>1000 · Muy bajo</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {scoringRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <Check className="size-4 text-positive" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{rule.variable}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        Condición {rule.operator} {rule.value}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-positive">
                      +{rule.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-surface/60 p-6 text-center">
              <div>
                <Calculator className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-3 font-display font-bold">Resultado de la evaluación</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Ingresa un documento válido para ver una simulación completa del cálculo.
                </p>
              </div>
            </div>
          )}
        </Panel>
        <Panel className="h-fit p-5">
          <h2 className="font-display font-bold">Flujo de evaluación</h2>
          <ol className="mt-4 space-y-4 text-sm">
            {[
              "Validar solicitante",
              "Obtener variables activas",
              "Aplicar reglas vigentes",
              "Guardar resultado histórico",
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold">Historial reciente</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Documento</th>
                <th>Score</th>
                <th>Nivel</th>
                <th>Fecha</th>
                <th aria-label="Acción" />
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.name}</td>
                  <td className="font-mono">{item.document}</td>
                  <td className="font-mono font-bold">{item.score}</td>
                  <td>
                    <StatusBadge tone={item.tone}>{item.level}</StatusBadge>
                  </td>
                  <td>{item.date}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ver evaluación de ${item.name}`}
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
