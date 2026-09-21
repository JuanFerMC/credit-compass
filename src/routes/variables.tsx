import { createFileRoute } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/page";
import { api, isApiConfigured, riskVariableSchema, type RiskVariableInput } from "@/lib/api";
import { riskVariables } from "@/lib/demo-data";

export const Route = createFileRoute("/variables")({
  head: () => ({
    meta: [
      { title: "Variables de riesgo — Veridica" },
      {
        name: "description",
        content: "Configuración de variables del modelo de riesgo crediticio.",
      },
      { property: "og:title", content: "Variables de riesgo — Veridica" },
      {
        property: "og:description",
        content: "Configuración de variables del modelo de riesgo crediticio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VariablesPage,
});

function VariablesPage() {
  const [form, setForm] = useState<RiskVariableInput>({
    variable: "INGRESOS_MENSUALES",
    descripcion: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = riskVariableSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isApiConfigured) await api.createRiskVariable(parsed.data);
      setMessage(
        isApiConfigured
          ? "Variable creada correctamente."
          : "Variable validada. Conecta la API para guardarla.",
      );
      setForm({ ...form, descripcion: "" });
    } catch {
      setError("No fue posible crear la variable.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Configuración del modelo"
        title="Variables de riesgo"
        description="Define los factores que pueden participar en las nuevas evaluaciones de crédito."
      />
      <DemoNotice />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">Variables configuradas</h2>
            <p className="text-sm text-muted-foreground">
              El estado se apoya con texto para no depender únicamente del color.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {riskVariables.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-semibold">{item.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{item.code}</p>
                    </td>
                    <td>{item.type}</td>
                    <td className="max-w-xs text-muted-foreground">{item.description}</td>
                    <td>
                      <span
                        className={`status-dot ${item.active ? "status-active" : "status-inactive"}`}
                      >
                        {item.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel className="h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <SlidersHorizontal className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-bold">Nueva variable</h2>
              <p className="text-xs text-muted-foreground">Se crea en estado activa.</p>
            </div>
          </div>
          {message && (
            <p className="mb-4 rounded-lg bg-positive-soft p-3 text-sm text-positive" role="status">
              {message}
            </p>
          )}
          {error && (
            <p
              className="mb-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
          <form onSubmit={submit} className="space-y-4">
            <Field label="Variable" htmlFor="variable">
              <select
                id="variable"
                className="form-control"
                value={form.variable}
                onChange={(e) =>
                  setForm({ ...form, variable: e.target.value as RiskVariableInput["variable"] })
                }
              >
                <option value="INGRESOS_MENSUALES">Ingresos mensuales</option>
                <option value="NIVEL_ENDEUDAMIENTO">Nivel de endeudamiento</option>
                <option value="NUMERO_MORAS">Número de moras</option>
                <option value="HISTORIAL_CREDITICIO">Historial crediticio</option>
                <option value="ANTIGUEDAD_LABORAL">Antigüedad laboral</option>
              </select>
            </Field>
            <Field
              label="Descripción"
              htmlFor="descripcion"
              hint={`${form.descripcion.length}/255 caracteres`}
            >
              <textarea
                id="descripcion"
                className="form-control min-h-28 resize-y"
                maxLength={255}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="size-4" />
              {loading ? "Creando…" : "Crear variable"}
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
