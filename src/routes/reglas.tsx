import { createFileRoute } from "@tanstack/react-router";
import { Plus, Scale } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { PageHeader, Panel, PendingBadge, Field } from "@/components/page";
import { Button } from "@/components/ui/button";
import { scoringRules } from "@/lib/demo-data";

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

const schema = z.object({
  variable: z.string().min(1),
  operator: z.enum(["=", ">", ">=", "<", "<="]),
  value: z.string().trim().min(1, "Indica un valor"),
  points: z.coerce.number().int("Usa un número entero"),
});
function RulesPage() {
  const [form, setForm] = useState({
    variable: "Ingresos mensuales",
    operator: ">" as const,
    value: "",
    points: 0,
  });
  const [message, setMessage] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    setMessage(
      parsed.success
        ? "Regla validada y lista para enviarse cuando el endpoint esté disponible."
        : (parsed.error.issues[0]?.message ?? "Revisa los datos"),
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Configuración del modelo"
        title="Reglas de scoring"
        description="Configura cómo cada condición suma o resta puntos. Solo se aplican reglas activas asociadas a variables activas."
        action={<PendingBadge />}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">Reglas configuradas</h2>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel className="h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <Scale className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-bold">Probar nueva regla</h2>
              <p className="text-xs text-muted-foreground">
                No se guarda mientras la API esté pendiente.
              </p>
            </div>
          </div>
          {message && (
            <p className="mb-4 rounded-lg bg-info-soft p-3 text-sm text-info" role="status">
              {message}
            </p>
          )}
          <form onSubmit={submit} className="space-y-4">
            <Field label="Variable" htmlFor="rule-variable">
              <select
                id="rule-variable"
                className="form-control"
                value={form.variable}
                onChange={(e) => setForm({ ...form, variable: e.target.value })}
              >
                <option>Ingresos mensuales</option>
                <option>Nivel de endeudamiento</option>
                <option>Número de moras</option>
                <option>Historial crediticio</option>
              </select>
            </Field>
            <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
              <Field label="Operador" htmlFor="operator">
                <select
                  id="operator"
                  className="form-control"
                  value={form.operator}
                  onChange={(e) =>
                    setForm({ ...form, operator: e.target.value as typeof form.operator })
                  }
                >
                  {["=", ">", ">=", "<", "<="].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Valor" htmlFor="value">
                <input
                  id="value"
                  className="form-control"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Puntaje" htmlFor="points">
              <input
                id="points"
                type="number"
                step="1"
                className="form-control"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              />
            </Field>
            <Button className="w-full" type="submit">
              <Plus className="size-4" />
              Validar regla
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
