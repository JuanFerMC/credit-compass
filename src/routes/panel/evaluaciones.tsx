import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Check, Clock3, FileSearch, Lightbulb, RefreshCw, Search, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/shared/page";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  api,
  ApiRequestError,
  isApiConfigured,
  scoreRequestSchema,
  type Evaluation,
} from "@/api/client";
import { evaluationQueryApi, isEvaluationQueryApiConfigured, type EvaluationExplanation, type EvaluationRecommendations } from "@/api/evaluation-query";
import {
  evaluationQueryApi,
  isEvaluationQueryApiConfigured,
  type EvaluationExplanation,
  type EvaluationRecommendations,
  type ApplicantEvaluationHistoryItem,
} from "@/api/evaluation-query";

export const Route = createFileRoute("/panel/evaluaciones")({
  head: () => ({
    meta: [
      { title: "Evaluaciones — Veridica" },
      { name: "description", content: "Calcula, explica y consulta el historial de evaluaciones crediticias." },
    ],
  }),
  component: EvaluationsPage,
});

function errorText(error: unknown, fallback: string): string {
  if (!(error instanceof ApiRequestError)) return fallback;
  if (error.errorCode === "EVALUACION_PENDIENTE" || error.status === 409) {
    return "La evaluación está registrada, pero todavía se están generando sus datos complementarios. Vuelve a consultar en unos instantes.";
  }
  if (error.status === 404) return "No se encontraron datos para esta evaluación o solicitante.";
  return error.message || fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CO");
}

function EvaluationsPage() {
  const [document, setDocument] = useState("");
  const [result, setResult] = useState<Evaluation | null>(null);
  const [explanation, setExplanation] = useState<EvaluationExplanation | null>(null);
  const [recommendations, setRecommendations] = useState<EvaluationRecommendations | null>(null);
  const [history, setHistory] = useState<ApplicantEvaluationHistoryItem[] | null>(null);
  const [error, setError] = useState("");
  const [queryError, setQueryError] = useState("");
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);

  async function loadQueryData(evaluation: Evaluation) {
    if (!isEvaluationQueryApiConfigured) {
      setQueryError("Configura VITE_EVALUATION_QUERY_BASE_URL para consultar explicaciones, recomendaciones e historial.");
      return;
    }
    setQueryLoading(true);
    setQueryError("");
    const [explanationResult, recommendationsResult, historyResult] = await Promise.allSettled([
      evaluationQueryApi.getExplanation(evaluation.idEvaluacion),
      evaluationQueryApi.getRecommendations(evaluation.idEvaluacion),
      evaluationQueryApi.getApplicantHistory(evaluation.idSolicitante),
    ]);
    if (explanationResult.status === "fulfilled") setExplanation(explanationResult.value);
    else {
      setExplanation(null);
      setQueryError(errorText(explanationResult.reason, "No fue posible cargar la explicación."));
    }
    if (recommendationsResult.status === "fulfilled") setRecommendations(recommendationsResult.value);
    else {
      setRecommendations(null);
      setQueryError((current) => current || errorText(recommendationsResult.reason, "No fue posible cargar las recomendaciones."));
    }
    if (historyResult.status === "fulfilled") setHistory(historyResult.value);
    else {
      setHistory(null);
      setQueryError((current) => current || errorText(historyResult.reason, "No fue posible cargar el historial."));
    }
    setQueryLoading(false);
  }

  async function calculate(event: FormEvent) {
    event.preventDefault();
    const parsed = scoreRequestSchema.safeParse({ numeroDocumento: document });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el documento.");
      return;
    }
    if (!isApiConfigured) {
      setError("Configura VITE_API_BASE_URL para calcular un score.");
      return;
    }
    setLoading(true);
    setError("");
    setQueryError("");
    setResult(null);
    setExplanation(null);
    setRecommendations(null);
    setHistory(null);
    try {
      const evaluation = await api.calculateScore(parsed.data);
      setResult(evaluation);
      void loadQueryData(evaluation);
    } catch (requestError) {
      setError(errorText(requestError, "No fue posible calcular la evaluación."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Análisis de crédito"
        title="Evaluaciones"
        description="Calcula un puntaje, revisa los factores que influyeron en el resultado y consulta las recomendaciones y el historial."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="p-5 sm:p-6">
          <form onSubmit={calculate}>
            <label htmlFor="eval-document" className="text-sm font-semibold">Documento del solicitante</label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  id="eval-document"
                  className="form-control pl-10"
                  inputMode="numeric"
                  autoComplete="off"
                  value={document}
                  onChange={(event) => {
                    setDocument(event.target.value.replace(/\D/g, "").slice(0, 15));
                    setResult(null);
                    setExplanation(null);
                    setRecommendations(null);
                    setHistory(null);
                    setError("");
                    setQueryError("");
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
          {error && <p className="mt-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive" role="alert">{error}</p>}
          {result ? (
            <div className="mt-6 border-t border-border pt-6" aria-live="polite">
              <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <div className="score-tile">
                  <span className="font-mono text-[10px] uppercase">Puntaje final</span>
                  <strong className="font-display text-5xl">{result.scoreTotal}</strong>
                  {result.categoria ? (
                    <StatusBadge tone="positive">{result.categoria}</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">Sin categoría</StatusBadge>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Resultado registrado</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Evaluación {result.idEvaluacion} · Solicitante {result.idSolicitante}
                  </p>
                  <p className="text-sm text-muted-foreground">Fecha: {formatDate(result.fechaEvaluacion)}</p>
                  {result.estado === "PENDIENTE" && (
                    <p className="mt-3 rounded-lg border border-border p-3 text-sm" role="status">
                      La evaluación está pendiente de completar sus recomendaciones. Puedes volver a consultarla más tarde.
                    </p>
                  )}
                </div>
              </div>
              <h3 className="mt-6 font-display font-bold">Detalles del cálculo</h3>
              <div className="mt-3 space-y-2">
                {result.detalles.map((detail) => (
                  <div key={detail.idRegla} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                    <Check className={`size-4 ${detail.condicionCumplida ? "text-positive" : "text-muted-foreground"}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Regla {detail.idRegla}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">Condición {detail.operadorAplicado} {detail.valorCondicionAplicado}</p>
                    </div>
                    <span className={`font-mono text-sm font-bold ${detail.puntajeObtenido >= 0 ? "text-positive" : "text-destructive"}`}>
                      {detail.puntajeObtenido >= 0 ? "+" : ""}{detail.puntajeObtenido}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-surface/60 p-6 text-center">
              <div>
                <Calculator className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <h2 className="mt-3 font-display font-bold">Resultado de la evaluación</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Ingresa un documento válido para calcularlo en el backend.</p>
              </div>
            </div>
          )}
        </Panel>
        <Panel className="h-fit p-5">
          <h2 className="font-display font-bold">Flujo de evaluación</h2>
          <ol className="mt-4 space-y-4 text-sm">
            {["Validar solicitante", "Obtener variables activas", "Aplicar reglas vigentes", "Guardar resultado histórico", "Consultar explicación y recomendaciones"].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-bold text-primary">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {result && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <FileSearch className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">Explicación de la evaluación</h2>
            </div>
            {queryLoading && !explanation ? (
              <p className="mt-4 text-sm text-muted-foreground">Consultando explicación…</p>
            ) : explanation ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Info label="Origen del puntaje" value={explanation.origenPuntaje} />
                  <Info label="Política aplicada" value={explanation.versionPolitica == null ? "No disponible" : `Versión ${explanation.versionPolitica}`} />
                  <Info label="Categoría" value={explanation.categoria ?? "Sin clasificar"} />
                  <Info label="Fecha" value={formatDate(explanation.fechaEvaluacion)} />
                </div>
                <div className="mt-4 space-y-2">
                  {explanation.factores.map((factor, index) => (
                    <div key={`${factor.idRegla}-${index}`} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{factor.variable} · Regla {factor.idRegla}</p>
                        <StatusBadge tone={factor.condicionCumplida ? "positive" : "accent"}>{factor.condicionCumplida ? "Condición cumplida" : "No cumplida"}</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Condición: {factor.operadorAplicado} {factor.valorCondicionAplicado}</p>
                      <p className="mt-1 text-sm">Contribución: <strong>{factor.contribucion > 0 ? "+" : ""}{factor.contribucion}</strong> (puntaje de regla: {factor.puntajeReglaAplicado})</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{queryError || "No se pudo recuperar la explicación."}</p>
            )}
          </Panel>

          <Panel className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">Recomendaciones</h2>
            </div>
            {queryLoading && !recommendations ? (
              <p className="mt-4 text-sm text-muted-foreground">Consultando recomendaciones…</p>
            ) : recommendations ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  {recommendations.generadas
                    ? `Catálogo ${recommendations.versionCatalogo ?? "sin versión"} · Generadas: ${recommendations.fechaGeneracion ? formatDate(recommendations.fechaGeneracion) : "fecha no disponible"}`
                    : "Esta evaluación no tiene recomendaciones generadas (puede ser anterior al proceso de recomendaciones)."}
                </p>
                {recommendations.recomendaciones.length ? (
                  <ol className="mt-4 space-y-3">
                    {recommendations.recomendaciones.map((item) => (
                      <li key={item.codigo} className="rounded-lg border border-border p-3">
                        <p className="text-xs font-mono text-muted-foreground">{item.codigo} · {item.tipoActivacion}</p>
                        <p className="mt-1 text-sm leading-6">{item.texto}</p>
                        {(item.categoria || item.variable) && <p className="mt-2 text-xs text-muted-foreground">Criterio: {item.categoria ?? item.variable}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 rounded-lg bg-surface p-3 text-sm text-muted-foreground">No hay recomendaciones disponibles para esta evaluación.</p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">Las recomendaciones son información complementaria; no representan una aprobación ni un rechazo del crédito.</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{queryError || "No se pudieron recuperar las recomendaciones."}</p>
            )}
          </Panel>

          <Panel className="p-5 sm:p-6 xl:col-span-2">
            <div className="flex items-center gap-2">
              <Clock3 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold">Historial del solicitante</h2>
            </div>
            {queryLoading && !history ? (
              <p className="mt-4 text-sm text-muted-foreground">Consultando historial…</p>
            ) : history ? (
              history.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Evaluación</th><th>Fecha</th><th>Puntaje</th><th>Categoría</th><th>Estado</th></tr></thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.idEvaluacion}>
                          <td className="font-mono">{item.idEvaluacion}</td>
                          <td>{formatDate(item.fechaEvaluacion)}</td>
                          <td className="font-mono font-semibold">{item.scoreTotal}</td>
                          <td>{item.categoria ?? "Sin clasificar"}</td>
                          <td>{item.estado ?? "Histórica"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="mt-4 text-sm text-muted-foreground">Este solicitante todavía no tiene evaluaciones completadas en el historial.</p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{queryError || "No se pudo recuperar el historial."}</p>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-surface p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
