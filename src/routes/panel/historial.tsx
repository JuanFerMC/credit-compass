import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, History, RotateCcw, Search } from "lucide-react";
import {
  sprint3QueryApi,
  isSprint3QueryConfigured,
  type HistoryFilters,
  type HistoryPage,
  type RiskCategory,
} from "@/api/sprint3-query";
import { ApiRequestError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Field, PageHeader, Panel } from "@/components/shared/page";

export const Route = createFileRoute("/panel/historial")({
  head: () => ({
    meta: [{ title: "Historial de evaluaciones — Veridica" }],
  }),
  component: HistoryPageView,
});

type FormState = {
  fechaDesde: string;
  fechaHasta: string;
  numeroDocumento: string;
  categoria: "" | RiskCategory;
  tamano: number;
};

const EMPTY: FormState = {
  fechaDesde: "",
  fechaHasta: "",
  numeroDocumento: "",
  categoria: "",
  tamano: 20,
};

function HistoryPageView() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [applied, setApplied] = useState<FormState>(EMPTY);
  const [page, setPage] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (filters: FormState, pagina: number) => {
    if (!isSprint3QueryConfigured) return;
    setLoading(true);
    setError("");

    const query: HistoryFilters = {
      fechaDesde: filters.fechaDesde || undefined,
      fechaHasta: filters.fechaHasta || undefined,
      numeroDocumento: filters.numeroDocumento || undefined,
      categoria: filters.categoria || undefined,
      pagina,
      tamano: filters.tamano,
    };

    try {
      const result = await sprint3QueryApi.searchHistory(query);
      setApplied(filters);
      setPage(result);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.message
          : "No fue posible consultar el historial.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(EMPTY, 0);
  }, [load]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (form.fechaDesde && form.fechaHasta && form.fechaDesde > form.fechaHasta) {
      setError("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }
    if (form.numeroDocumento && !/^\d{6,15}$/.test(form.numeroDocumento)) {
      setError("El documento debe tener entre 6 y 15 dígitos.");
      return;
    }
    void load(form, 0);
  }

  const rows = page?.evaluaciones ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Consultas"
        title="Historial de evaluaciones"
        description="Busca evaluaciones por fechas, documento y nivel de riesgo."
      />

      {!isSprint3QueryConfigured && (
        <p className="rounded-lg border p-4 text-sm">
          Configura VITE_EVALUATION_QUERY_BASE_URL para consultar el historial.
        </p>
      )}

      <Panel className="p-4 sm:p-6">
        <form onSubmit={submit} className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Desde" htmlFor="history-from">
            <input
              id="history-from"
              type="date"
              className="form-control"
              value={form.fechaDesde}
              max={form.fechaHasta || undefined}
              onChange={(event) =>
                setForm({ ...form, fechaDesde: event.target.value })
              }
            />
          </Field>
          <Field label="Hasta" htmlFor="history-to">
            <input
              id="history-to"
              type="date"
              className="form-control"
              value={form.fechaHasta}
              min={form.fechaDesde || undefined}
              onChange={(event) =>
                setForm({ ...form, fechaHasta: event.target.value })
              }
            />
          </Field>
          <Field label="Documento" htmlFor="history-document">
            <input
              id="history-document"
              inputMode="numeric"
              className="form-control"
              value={form.numeroDocumento}
              onChange={(event) =>
                setForm({
                  ...form,
                  numeroDocumento: event.target.value.replace(/\D/g, "").slice(0, 15),
                })
              }
            />
          </Field>
          <Field label="Nivel de riesgo" htmlFor="history-category">
            <select
              id="history-category"
              className="form-control"
              value={form.categoria}
              onChange={(event) =>
                setForm({
                  ...form,
                  categoria: event.target.value as FormState["categoria"],
                })
              }
            >
              <option value="">Todos</option>
              <option value="BAJO">Bajo</option>
              <option value="MEDIO">Medio</option>
              <option value="ALTO">Alto</option>
            </select>
          </Field>
          <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 lg:col-span-1">
            <Button
              type="submit"
              className="w-full min-w-0 whitespace-nowrap"
              disabled={!isSprint3QueryConfigured || loading}
            >
              <Search className="size-4" />
              Buscar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full min-w-0 whitespace-nowrap"
              disabled={loading}
              onClick={() => {
                setForm(EMPTY);
                void load(EMPTY, 0);
              }}
            >
              <RotateCcw className="size-4" />
              Limpiar
            </Button>
          </div>
        </form>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center gap-3 border-b p-4">
          <History className="size-5 text-primary" />
          <div>
            <h2 className="font-display font-bold">Resultados</h2>
            <p className="text-sm text-muted-foreground">
              {page
                ? `${page.totalRegistros.toLocaleString("es-CO")} evaluación(es)`
                : "Sin consultar"}
            </p>
          </div>
        </div>

        {loading && !page ? (
          <p className="p-6 text-sm">Consultando historial…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No hay evaluaciones que coincidan con los filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr>
                  <th>Evaluación</th>
                  <th>Fecha</th>
                  <th>Puntaje</th>
                  <th>Categoría</th>
                  <th>Política</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.idEvaluacion}>
                    <td className="font-mono">#{item.idEvaluacion}</td>
                    <td>{new Date(item.fechaEvaluacion).toLocaleString("es-CO")}</td>
                    <td className="font-mono font-semibold">{item.scoreTotal}</td>
                    <td>{item.categoria ?? "Sin clasificar"}</td>
                    <td>
                      {item.versionPolitica == null
                        ? "—"
                        : `v${item.versionPolitica}`}
                    </td>
                    <td>{item.estado ?? "Histórica"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page && page.totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <span className="text-sm text-muted-foreground">
              Página {page.pagina + 1} de {page.totalPaginas}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page.pagina === 0}
                onClick={() => void load(applied, page.pagina - 1)}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page.pagina >= page.totalPaginas - 1}
                onClick={() => void load(applied, page.pagina + 1)}
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}
