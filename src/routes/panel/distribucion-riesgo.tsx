import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  sprint3QueryApi,
  isSprint3QueryConfigured,
  type RiskDistribution,
} from "@/api/sprint3-query";
import { ApiRequestError } from "@/api/http";
import { useRol } from "@/api/use-rol";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/shared/page";

export const Route = createFileRoute("/panel/distribucion-riesgo")({
  head: () => ({
    meta: [{ title: "Distribución de riesgo — Veridica" }],
  }),
  component: RiskDistributionPage,
});

const COLORS = {
  BAJO: "bg-positive",
  MEDIO: "bg-warning",
  ALTO: "bg-destructive",
} as const;

function RiskDistributionPage() {
  const role = useRol();
  const [data, setData] = useState<RiskDistribution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await sprint3QueryApi.getRiskDistribution());
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.message
          : "No fue posible consultar la distribución.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "ANALISTA_CREDITO" && isSprint3QueryConfigured) {
      void load();
    }
  }, [role, load]);

  return (
    <>
      <PageHeader
        eyebrow="Análisis de cartera"
        title="Distribución de riesgo"
        description="Distribución real de evaluaciones clasificadas por nivel de riesgo."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading || !isSprint3QueryConfigured}
          >
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        }
      />

      {role !== "ANALISTA_CREDITO" ? (
        <p className="rounded-lg border p-4 text-sm">
          Esta consulta está disponible únicamente para el rol analista.
        </p>
      ) : !isSprint3QueryConfigured ? (
        <p className="rounded-lg border p-4 text-sm">
          Configura VITE_EVALUATION_QUERY_BASE_URL para consultar la distribución.
        </p>
      ) : (
        <Panel className="p-5">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {loading && !data ? (
            <p>Consultando datos…</p>
          ) : data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Evaluaciones clasificadas" value={data.totalEvaluaciones} />
                <Metric label="Sin clasificar" value={data.evaluacionesSinClasificar} />
                <Metric
                  label="Riesgo alto"
                  value={
                    data.distribucion.find((item) => item.categoria === "ALTO")?.porcentaje ?? 0
                  }
                  suffix="%"
                />
              </div>
              <div
                className="mt-6 flex h-5 overflow-hidden rounded-full bg-surface"
                aria-label="Distribución porcentual"
              >
                {data.distribucion.map((item) => (
                  <div
                    key={item.categoria}
                    className={COLORS[item.categoria]}
                    style={{ width: `${item.porcentaje}%` }}
                    title={`${item.categoria}: ${item.porcentaje}%`}
                  />
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {data.distribucion.map((item) => (
                  <div key={item.categoria} className="rounded-lg border p-4">
                    <p className="text-2xl font-bold">
                      {item.porcentaje.toLocaleString("es-CO")}%
                    </p>
                    <p className="font-semibold">{item.categoria}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.cantidad.toLocaleString("es-CO")} evaluaciones
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </Panel>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value.toLocaleString("es-CO")}
        {suffix}
      </p>
    </div>
  );
}
