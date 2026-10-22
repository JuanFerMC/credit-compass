/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Check, RefreshCw, Search, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/shared/page";
import { StatusBadge } from "@/components/shared/status-badge";
import { api, ApiRequestError, isApiConfigured, scoreRequestSchema, type Evaluation } from "@/api/client";
import { evaluationQueryApi, isEvaluationQueryApiConfigured, type EvaluationExplanation, type EvaluationRecommendations } from "@/api/evaluation-query";

export const Route = createFileRoute("/panel/evaluaciones")({ head: () => ({ meta: [
  { title: "Evaluaciones — Veridica" }, { name: "description", content: "Cálculo explicable e historial de scoring crediticio." }, { property: "og:title", content: "Evaluaciones — Veridica" }, { property: "og:description", content: "Cálculo explicable e historial de scoring crediticio." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: EvaluationsPage });

function EvaluationsPage() {
  const [document, setDocument] = useState(""); const [result, setResult] = useState<Evaluation | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [queryState, setQueryState] = useState<"idle" | "loading" | "ready" | "pending" | "error" | "unconfigured">("idle");
  const [queryExplanation, setQueryExplanation] = useState<EvaluationExplanation | null>(null);
  const [queryRecommendations, setQueryRecommendations] = useState<EvaluationRecommendations | null>(null);
  const [queryError, setQueryError] = useState("");
  async function loadQuery(idEvaluacion: number) {
    if (!isEvaluationQueryApiConfigured) { setQueryState("unconfigured"); return; }
    setQueryState("loading"); setQueryError(""); setQueryExplanation(null); setQueryRecommendations(null);
    try {
      const [explanation, recommendations] = await Promise.all([
        evaluationQueryApi.getExplanation(idEvaluacion),
        evaluationQueryApi.getRecommendations(idEvaluacion),
      ]);
      setQueryExplanation(explanation); setQueryRecommendations(recommendations); setQueryState("ready");
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.status === 409) setQueryState("pending");
      else { setQueryError(requestError instanceof ApiRequestError ? requestError.message : "No fue posible consultar Query."); setQueryState("error"); }
    }
  }
  async function calculate(event: FormEvent) { event.preventDefault(); const parsed = scoreRequestSchema.safeParse({ numeroDocumento: document }); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revisa el documento"); return; } if (!isApiConfigured) { setError("Configura VITE_API_BASE_URL para calcular un score."); return; } setLoading(true); setError(""); setQueryState("idle"); try { const evaluated = await api.calculateScore(parsed.data); setResult(evaluated); await loadQuery(evaluated.idEvaluacion); } catch (requestError) { setResult(null); setError(requestError instanceof ApiRequestError ? requestError.message : "No fue posible calcular el score."); } finally { setLoading(false); } }
  return <><PageHeader eyebrow="Análisis de crédito" title="Evaluaciones" description="Calcula un puntaje y revisa qué reglas influyeron en el resultado, sin perder la trazabilidad." />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"><Panel className="p-5 sm:p-6"><form onSubmit={calculate}><label htmlFor="eval-document" className="text-sm font-semibold">Documento del solicitante</label><div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input id="eval-document" className="form-control pl-10" inputMode="numeric" value={document} onChange={(e) => { setDocument(e.target.value.replace(/\D/g, "").slice(0, 15)); setResult(null); setError(""); }} placeholder="Ej. 1023456789" /></div><Button type="submit" disabled={loading || !/^\d{6,15}$/.test(document)}><Calculator className="size-4" />{loading ? "Calculando…" : "Calcular score"}</Button></div></form>
      {error && <p className="mt-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive" role="alert">{error}</p>}{result ? <div className="mt-6 border-t border-border pt-6" aria-live="polite"><div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]"><div className="score-tile"><span className="font-mono text-[10px] uppercase">Puntaje final</span><strong className="font-display text-5xl">{result.scoreTotal}</strong><StatusBadge tone={result.scoreTotal >= 200 ? "positive" : result.scoreTotal >= 0 ? "warning" : "negative"}>{result.scoreTotal >= 200 ? "Favorable" : result.scoreTotal >= 0 ? "Intermedio" : "Riesgo alto"}</StatusBadge></div><div><h2 className="font-display text-xl font-bold">Resultado registrado</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Evaluación {result.idEvaluacion} calculada por el motor y conservada con sus reglas aplicadas.</p></div></div><div className="mt-6 space-y-2">{result.detalles.map((detail) => <div key={detail.idRegla} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"><Check className={`size-4 ${detail.condicionCumplida ? "text-positive" : "text-muted-foreground"}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold">Regla {detail.idRegla}</p><p className="font-mono text-[10px] text-muted-foreground">Condición {detail.operadorAplicado} {detail.valorCondicionAplicado}</p></div><span className={`font-mono text-sm font-bold ${detail.puntajeObtenido >= 0 ? "text-positive" : "text-destructive"}`}>{detail.puntajeObtenido >= 0 ? "+" : ""}{detail.puntajeObtenido}</span></div>)}</div>
        <section className="mt-6 rounded-xl border border-border bg-surface p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-display font-bold"><Sparkles className="size-4 text-primary" />Explicación y recomendaciones (Query)</h3><Button type="button" variant="secondary" size="sm" onClick={() => void loadQuery(result.idEvaluacion)} disabled={queryState === "loading"}><RefreshCw className="size-4" />Actualizar</Button></div>
          {queryState === "loading" && <p className="mt-3 text-sm text-muted-foreground">Consultando la explicación y las recomendaciones…</p>}
          {queryState === "unconfigured" && <p className="mt-3 text-sm text-muted-foreground">Configura VITE_EVALUATION_QUERY_BASE_URL para conectar Query.</p>}
          {queryState === "pending" && <p className="mt-3 text-sm text-warning">La evaluación sigue pendiente en la saga. Puedes actualizar esta consulta en unos segundos.</p>}
          {queryState === "error" && <p className="mt-3 text-sm text-destructive" role="alert">{queryError}</p>}
          {queryState === "ready" && queryExplanation && queryRecommendations && <div className="mt-4 space-y-4"><p className="text-sm text-muted-foreground">Categoría persistida: <strong className="text-foreground">{queryExplanation.categoria ?? "Sin clasificar"}</strong> · política {queryExplanation.versionPolitica ?? "histórica"}</p><div><h4 className="text-sm font-semibold">Recomendaciones</h4>{queryRecommendations.generadas && queryRecommendations.recomendaciones.length > 0 ? <ul className="mt-2 space-y-2">{queryRecommendations.recomendaciones.map((item) => <li key={`${item.orden}-${item.codigo}`} className="rounded-lg border border-border px-3 py-2"><span className="font-mono text-xs text-primary">{item.codigo}</span><p className="mt-1 text-sm">{item.texto}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No hay recomendaciones registradas para esta evaluación.</p>}</div></div>}
        </section></div> : <div className="mt-8 grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-surface/60 p-6 text-center"><div><Calculator className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-display font-bold">Resultado de la evaluación</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Ingresa un documento válido para calcularlo en el backend.</p></div></div>}
    </Panel><Panel className="h-fit p-5"><h2 className="font-display font-bold">Flujo de evaluación</h2><ol className="mt-4 space-y-4 text-sm">{["Validar solicitante", "Obtener variables activas", "Aplicar reglas vigentes", "Guardar resultado histórico"].map((item, index) => <li key={item} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-bold text-primary">{index + 1}</span><span>{item}</span></li>)}</ol></Panel></div>
    <Panel className="p-5"><h2 className="font-display text-lg font-bold">Historial reciente</h2><p className="mt-2 text-sm text-muted-foreground">El historial completo se consulta desde Query por solicitante. Se habilitará aquí al seleccionar o buscar un solicitante.</p></Panel>
  </>;
}
