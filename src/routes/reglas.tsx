import { createFileRoute } from "@tanstack/react-router";
import { Info, Pencil, Plus, Scale } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  api,
  ApiRequestError,
  createScoringRuleSchema,
  editScoringRuleSchema,
  isApiConfigured,
  operadoresPermitidos,
  RISK_VARIABLE_CATALOG,
  tipoDeVariable,
  type CreateScoringRuleInput,
  type EditScoringRuleInput,
  type OperatorSymbol,
  type RiskVariableName,
} from "@/lib/api";
import { scoringRules } from "@/lib/demo-data";

// La fila de la tabla "de ejemplo" trae valores con formato de lectura
// ("$4.000.000", "30%", "3 años"), no el valorCondicion crudo que espera la
// API. Este helper hace una traducción best-effort para precargar el
// formulario de edición: conserva palabras (BUENO/REGULAR/MALO) tal cual, y
// para el resto se queda solo con los dígitos.
function demoValueToCondicion(value: string): string {
  if (/^[a-zA-ZÁÉÍÓÚáéíóú]+$/.test(value)) return value.toUpperCase();
  const digits = value.replace(/[^\d]/g, "");
  return digits || value;
}

export const Route = createFileRoute("/reglas")({
  head: () => ({
    meta: [
      { title: "Reglas de scoring — Veridica" },
      {
        name: "description",
        content: "Reglas que convierten variables de riesgo en puntuaciones crediticias.",
      },
      { property: "og:title", content: "Reglas de scoring — Veridica" },
      {
        property: "og:description",
        content: "Reglas que convierten variables de riesgo en puntuaciones crediticias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

const emptyCreateForm: Omit<CreateScoringRuleInput, "idRiesgo"> & { idRiesgo: string } = {
  idRiesgo: "",
  operador: ">",
  valorCondicion: "",
  puntaje: 0,
};
const emptyEditForm: Omit<EditScoringRuleInput, "idRegla"> & { idRegla: string } = {
  idRegla: "",
  operador: ">",
  valorCondicion: "",
  puntaje: 0,
};

function RulesPage() {
  const [variable, setVariable] = useState<RiskVariableName>("INGRESOS_MENSUALES");
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editMessage, setEditMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const editPanelRef = useRef<HTMLElement>(null);
  const editIdInputRef = useRef<HTMLInputElement>(null);

  function prefillEdit(rule: (typeof scoringRules)[number]) {
    setEditForm({
      idRegla: String(rule.id),
      operador: rule.operator as OperatorSymbol,
      valorCondicion: demoValueToCondicion(rule.value),
      puntaje: rule.points,
    });
    setEditErrors({});
    setEditMessage(
      "Se cargó la fila de ejemplo en el formulario. Confirma que el idRegla corresponda a un registro real antes de guardar.",
    );
    editPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    editIdInputRef.current?.focus();
  }

  const tipo = tipoDeVariable(variable);
  const operadoresDisponibles = operadoresPermitidos(tipo);

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    setCreateMessage("");
    const parsed = createScoringRuleSchema.safeParse(createForm);
    if (!parsed.success) {
      setCreateErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setCreateErrors({});
    setCreating(true);
    try {
      if (isApiConfigured) {
        const created = await api.createScoringRule(parsed.data);
        setCreateMessage(`Regla #${created.idRegla} creada correctamente.`);
      } else {
        setCreateMessage("Regla validada. Conecta la API para guardarla.");
      }
      setCreateForm({ ...emptyCreateForm, idRiesgo: createForm.idRiesgo });
    } catch (error) {
      setCreateMessage(
        error instanceof ApiRequestError
          ? `${error.message}${error.traceId ? ` · Referencia ${error.traceId}` : ""}`
          : "No fue posible crear la regla.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    setEditMessage("");
    const parsed = editScoringRuleSchema.safeParse(editForm);
    if (!parsed.success) {
      setEditErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setEditErrors({});
    setEditing(true);
    try {
      if (isApiConfigured) {
        const updated = await api.editScoringRule(parsed.data);
        setEditMessage(`Regla #${updated.idRegla} actualizada correctamente.`);
      } else {
        setEditMessage("Edición validada. Conecta la API para aplicarla.");
      }
    } catch (error) {
      setEditMessage(
        error instanceof ApiRequestError
          ? `${error.message}${error.traceId ? ` · Referencia ${error.traceId}` : ""}`
          : "No fue posible editar la regla.",
      );
    } finally {
      setEditing(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuración del modelo"
        title="Reglas de scoring"
        description="Configura cómo cada condición suma o resta puntos. Solo se aplican reglas activas asociadas a variables activas."
      />
      <DemoNotice />
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <p>
          El backend todavía no expone un endpoint para <strong>listar</strong> las variables ni las
          reglas existentes (solo crear y editar). Por eso el idRiesgo/idRegla se ingresan a mano
          abajo — usa el valor que te devolvió la API al crear la variable o la regla. La tabla de
          la izquierda es un ejemplo de referencia, no datos en vivo.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">Reglas configuradas (ejemplo)</h2>
            <p className="text-sm text-muted-foreground">
              Ejemplo académico alineado con la documentación del proyecto.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Condición</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                  <th className="sr-only">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {scoringRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="font-semibold">{rule.variable}</td>
                    <td className="font-mono">
                      {rule.operator} {rule.value}
                    </td>
                    <td className={rule.points >= 0 ? "text-positive" : "text-destructive"}>
                      {rule.points >= 0 ? "+" : ""}
                      {rule.points}
                    </td>
                    <td>
                      <span
                        className={`status-dot ${rule.active ? "status-active" : "status-inactive"}`}
                      >
                        {rule.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => prefillEdit(rule)}
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel className="h-fit p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
                <Scale className="size-5" />
              </span>
              <div>
                <h2 className="font-display font-bold">Crear regla</h2>
                <p className="text-xs text-muted-foreground">
                  Asocia una condición y un puntaje a una variable activa.
                </p>
              </div>
            </div>
            {createMessage && (
              <p className="mb-4 rounded-lg bg-info-soft p-3 text-sm text-info" role="status">
                {createMessage}
              </p>
            )}
            <form onSubmit={submitCreate} className="space-y-4">
              <Field label="Variable (para saber qué operadores aplican)" htmlFor="rule-variable">
                <select
                  id="rule-variable"
                  className="form-control"
                  value={variable}
                  onChange={(e) => {
                    const next = e.target.value as RiskVariableName;
                    setVariable(next);
                    const nextOps = operadoresPermitidos(tipoDeVariable(next));
                    setCreateForm((current) => ({
                      ...current,
                      valorCondicion: "",
                      operador: nextOps.includes(current.operador)
                        ? current.operador
                        : (nextOps[0] ?? ">"),
                    }));
                  }}
                >
                  {RISK_VARIABLE_CATALOG.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="idRiesgo"
                htmlFor="id-riesgo"
                hint="ID devuelto por el backend al crear esta variable."
                error={createErrors["idRiesgo"]}
              >
                <input
                  id="id-riesgo"
                  className="form-control"
                  inputMode="numeric"
                  value={createForm.idRiesgo}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, idRiesgo: e.target.value.replace(/\D/g, "") })
                  }
                  aria-invalid={Boolean(createErrors["idRiesgo"])}
                  aria-describedby={createErrors["idRiesgo"] ? "id-riesgo-error" : undefined}
                />
              </Field>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                <Field label="Operador" htmlFor="operator">
                  <select
                    id="operator"
                    className="form-control"
                    value={createForm.operador}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, operador: e.target.value as OperatorSymbol })
                    }
                  >
                    {operadoresDisponibles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                {tipo === "CATEGORICO" ? (
                  <Field label="Valor" htmlFor="value" error={createErrors["valorCondicion"]}>
                    <select
                      id="value"
                      className="form-control"
                      value={createForm.valorCondicion}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, valorCondicion: e.target.value })
                      }
                    >
                      <option value="">Selecciona…</option>
                      <option value="BUENO">Bueno</option>
                      <option value="REGULAR">Regular</option>
                      <option value="MALO">Malo</option>
                    </select>
                  </Field>
                ) : (
                  <Field label="Valor" htmlFor="value" error={createErrors["valorCondicion"]}>
                    <input
                      id="value"
                      className="form-control"
                      inputMode="decimal"
                      value={createForm.valorCondicion}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, valorCondicion: e.target.value })
                      }
                      aria-invalid={Boolean(createErrors["valorCondicion"])}
                      aria-describedby={createErrors["valorCondicion"] ? "value-error" : undefined}
                    />
                  </Field>
                )}
              </div>
              <Field label="Puntaje (-100 a 100)" htmlFor="points" error={createErrors["puntaje"]}>
                <input
                  id="points"
                  type="number"
                  step="1"
                  min={-100}
                  max={100}
                  className="form-control"
                  value={createForm.puntaje}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, puntaje: Number(e.target.value) })
                  }
                  aria-invalid={Boolean(createErrors["puntaje"])}
                  aria-describedby={createErrors["puntaje"] ? "points-error" : undefined}
                />
              </Field>
              <Button className="w-full" type="submit" disabled={creating}>
                <Plus className="size-4" />
                {creating ? "Creando…" : "Crear regla"}
              </Button>
            </form>
          </Panel>
          <Panel className="h-fit p-5" ref={editPanelRef}>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
                <Pencil className="size-5" />
              </span>
              <div>
                <h2 className="font-display font-bold">Editar regla existente</h2>
                <p className="text-xs text-muted-foreground">
                  La variable asociada (idRiesgo) no se puede cambiar aquí.
                </p>
              </div>
            </div>
            {editMessage && (
              <p className="mb-4 rounded-lg bg-info-soft p-3 text-sm text-info" role="status">
                {editMessage}
              </p>
            )}
            <form onSubmit={submitEdit} className="space-y-4">
              <Field label="idRegla" htmlFor="id-regla" error={editErrors["idRegla"]}>
                <input
                  id="id-regla"
                  ref={editIdInputRef}
                  className="form-control"
                  inputMode="numeric"
                  value={editForm.idRegla}
                  onChange={(e) =>
                    setEditForm({ ...editForm, idRegla: e.target.value.replace(/\D/g, "") })
                  }
                  aria-invalid={Boolean(editErrors["idRegla"])}
                  aria-describedby={editErrors["idRegla"] ? "id-regla-error" : undefined}
                />
              </Field>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                <Field label="Operador" htmlFor="edit-operator">
                  <select
                    id="edit-operator"
                    className="form-control"
                    value={editForm.operador}
                    onChange={(e) =>
                      setEditForm({ ...editForm, operador: e.target.value as OperatorSymbol })
                    }
                  >
                    {["=", ">", ">=", "<", "<="].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Valor" htmlFor="edit-value" error={editErrors["valorCondicion"]}>
                  <input
                    id="edit-value"
                    className="form-control"
                    value={editForm.valorCondicion}
                    onChange={(e) => setEditForm({ ...editForm, valorCondicion: e.target.value })}
                    aria-invalid={Boolean(editErrors["valorCondicion"])}
                    aria-describedby={editErrors["valorCondicion"] ? "edit-value-error" : undefined}
                  />
                </Field>
              </div>
              <Field
                label="Puntaje (-100 a 100)"
                htmlFor="edit-points"
                error={editErrors["puntaje"]}
              >
                <input
                  id="edit-points"
                  type="number"
                  step="1"
                  min={-100}
                  max={100}
                  className="form-control"
                  value={editForm.puntaje}
                  onChange={(e) => setEditForm({ ...editForm, puntaje: Number(e.target.value) })}
                  aria-invalid={Boolean(editErrors["puntaje"])}
                  aria-describedby={editErrors["puntaje"] ? "edit-points-error" : undefined}
                />
              </Field>
              <Button className="w-full" variant="secondary" type="submit" disabled={editing}>
                {editing ? "Guardando…" : "Guardar cambios"}
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
