import { createFileRoute } from "@tanstack/react-router";
import { Info, Plus, SlidersHorizontal, ToggleLeft } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/shared/page";
import {
  api,
  ApiRequestError,
  changeRiskVariableStatusSchema,
  isApiConfigured,
  riskVariableSchema,
  type RiskVariableInput,
} from "@/lib/api";
import { riskVariables } from "@/data/demo-data";

export const Route = createFileRoute("/panel/variables")({
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

  const [statusForm, setStatusForm] = useState<{ idRiesgo: string; estado: "ACTIVA" | "INACTIVA" }>(
    { idRiesgo: "", estado: "INACTIVA" },
  );
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const statusPanelRef = useRef<HTMLElement>(null);
  const statusIdInputRef = useRef<HTMLInputElement>(null);

  function prefillStatus(item: (typeof riskVariables)[number]) {
    setStatusForm({
      idRiesgo: String(item.id),
      estado: item.active ? "INACTIVA" : "ACTIVA",
    });
    setStatusErrors({});
    setStatusMessage(
      "Se cargó la fila de ejemplo en el formulario. Confirma que el idRiesgo corresponda a un registro real antes de aplicar.",
    );
    statusPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    statusIdInputRef.current?.focus();
  }

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

  async function submitStatus(event: FormEvent) {
    event.preventDefault();
    setStatusMessage("");
    const parsed = changeRiskVariableStatusSchema.safeParse(statusForm);
    if (!parsed.success) {
      setStatusErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setStatusErrors({});
    setStatusLoading(true);
    try {
      if (isApiConfigured) {
        const result = await api.changeRiskVariableStatus(parsed.data);
        setStatusMessage(
          `idRiesgo ${result.idRiesgo}: ${result.estadoAnterior} → ${result.estadoNuevo}.`,
        );
      } else {
        setStatusMessage("Cambio validado. Conecta la API para aplicarlo.");
      }
    } catch (error) {
      setStatusMessage(
        error instanceof ApiRequestError
          ? `${error.message}${error.traceId ? ` · Referencia ${error.traceId}` : ""}`
          : "No fue posible cambiar el estado.",
      );
    } finally {
      setStatusLoading(false);
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
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <p>
          El backend todavía no expone un endpoint para <strong>listar</strong> variables de riesgo
          (solo crear y cambiar estado). La tabla de abajo es un ejemplo de referencia, no datos en
          vivo — para cambiar el estado de una variable real, usa su idRiesgo en el panel de la
          derecha.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">Variables configuradas (ejemplo)</h2>
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
                  <th className="sr-only">Acciones</th>
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
                    <td className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => prefillStatus(item)}
                      >
                        <ToggleLeft className="size-3.5" />
                        {item.active ? "Desactivar" : "Activar"}
                      </Button>
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
      <Panel className="p-5" ref={statusPanelRef}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
            <ToggleLeft className="size-5" />
          </span>
          <div>
            <h2 className="font-display font-bold">Cambiar estado (HU4)</h2>
            <p className="text-xs text-muted-foreground">
              Activa o desactiva una variable existente por su idRiesgo. Al desactivarla, sus reglas
              de scoring dejan de considerarse en nuevos cálculos.
            </p>
          </div>
        </div>
        {statusMessage && (
          <p className="mb-4 rounded-lg bg-info-soft p-3 text-sm text-info" role="status">
            {statusMessage}
          </p>
        )}
        <form
          onSubmit={submitStatus}
          className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
        >
          <Field label="idRiesgo" htmlFor="status-id" error={statusErrors["idRiesgo"]}>
            <input
              id="status-id"
              ref={statusIdInputRef}
              className="form-control"
              inputMode="numeric"
              value={statusForm.idRiesgo}
              onChange={(e) =>
                setStatusForm({ ...statusForm, idRiesgo: e.target.value.replace(/\D/g, "") })
              }
              aria-invalid={Boolean(statusErrors["idRiesgo"])}
              aria-describedby={statusErrors["idRiesgo"] ? "status-id-error" : undefined}
            />
          </Field>
          <Field label="Nuevo estado" htmlFor="status-estado">
            <select
              id="status-estado"
              className="form-control"
              value={statusForm.estado}
              onChange={(e) =>
                setStatusForm({
                  ...statusForm,
                  estado: e.target.value as typeof statusForm.estado,
                })
              }
            >
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
            </select>
          </Field>
          <Button type="submit" variant="secondary" className="self-end" disabled={statusLoading}>
            {statusLoading ? "Aplicando…" : "Aplicar"}
          </Button>
        </form>
      </Panel>
    </>
  );
}
