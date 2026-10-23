import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  api,
  ApiRequestError,
  isApiConfigured,
  type ClassificationCategory,
  type ClassificationPolicy,
} from "@/api/client";
import { isAdmin } from "@/api/roles";
import { useSession } from "@/api/session";
import { Button } from "@/components/ui/button";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/shared/page";
import { fieldA11y } from "@/lib/forms";

export const Route = createFileRoute("/panel/politica-clasificacion")({
  head: () => ({
    meta: [
      { title: "Política de clasificación — Veridica" },
      {
        name: "description",
        content: "Consulta y publica los rangos de clasificación del puntaje crediticio.",
      },
    ],
  }),
  component: ClassificationPolicyPage,
});

const categories = ["BAJO", "MEDIO", "ALTO"] as const;
const rangeFormSchema = z.object({
  categoria: z.enum(categories),
  limiteInferior: z.string().regex(/^-?\d+$/, "Usa un número entero."),
  limiteSuperior: z.string().regex(/^-?\d+$/, "Usa un número entero."),
});

const policyFormSchema = z
  .object({ rangos: z.array(rangeFormSchema).length(3, "Define exactamente tres rangos.") })
  .superRefine(({ rangos }, context) => {
    const normalized = rangos.map((range, index) => ({
      index,
      categoria: range.categoria,
      inferior: Number(range.limiteInferior),
      superior: Number(range.limiteSuperior),
    }));

    for (const range of normalized) {
      if (range.inferior < -100 || range.inferior > 130) {
        context.addIssue({
          code: "custom",
          path: ["rangos", range.index, "limiteInferior"],
          message: "Debe estar entre -100 y 130.",
        });
      }
      if (range.superior < -100 || range.superior > 130) {
        context.addIssue({
          code: "custom",
          path: ["rangos", range.index, "limiteSuperior"],
          message: "Debe estar entre -100 y 130.",
        });
      }
      if (range.inferior > range.superior) {
        context.addIssue({
          code: "custom",
          path: ["rangos", range.index, "limiteInferior"],
          message: "El límite inferior no puede superar al superior.",
        });
      }
    }

    const categoriesSeen = new Set<ClassificationCategory>();
    for (const range of normalized) {
      if (categoriesSeen.has(range.categoria)) {
        context.addIssue({
          code: "custom",
          path: ["rangos", range.index, "categoria"],
          message: "Cada categoría debe aparecer una sola vez.",
        });
      }
      categoriesSeen.add(range.categoria);
    }

    const ordered = [...normalized].sort((left, right) => left.inferior - right.inferior);
    if (ordered[0]?.inferior !== -100) {
      context.addIssue({
        code: "custom",
        path: ["rangos", ordered[0]?.index ?? 0, "limiteInferior"],
        message: "Los rangos deben iniciar en -100.",
      });
    }
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      if (previous && current && current.inferior !== previous.superior + 1) {
        context.addIssue({
          code: "custom",
          path: ["rangos", current.index, "limiteInferior"],
          message: "Los rangos no deben tener huecos ni superponerse.",
        });
      }
    }
    const last = ordered.at(-1);
    if (last?.superior !== 130) {
      context.addIssue({
        code: "custom",
        path: ["rangos", last?.index ?? 2, "limiteSuperior"],
        message: "Los rangos deben terminar en 130.",
      });
    }
  })
  .transform(({ rangos }) => ({
    rangos: rangos
      .map((range) => ({
        categoria: range.categoria,
        limiteInferior: Number(range.limiteInferior),
        limiteSuperior: Number(range.limiteSuperior),
      }))
      .sort((left, right) => left.limiteInferior - right.limiteInferior),
  }));

type PolicyForm = {
  rangos: Array<{
    categoria: ClassificationCategory;
    limiteInferior: string;
    limiteSuperior: string;
  }>;
};
type PolicyState = "loading" | "available" | "missing" | "error" | "unconfigured";

const initialForm: PolicyForm = {
  rangos: [
    { categoria: "BAJO", limiteInferior: "-100", limiteSuperior: "29" },
    { categoria: "MEDIO", limiteInferior: "30", limiteSuperior: "79" },
    { categoria: "ALTO", limiteInferior: "80", limiteSuperior: "130" },
  ],
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function requestMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiRequestError)) return fallback;
  const reference = error.traceId ? ` · Referencia ${error.traceId}` : "";
  return `${error.message}${reference}`;
}

function ClassificationPolicyPage() {
  const session = useSession();
  const admin = session.status === "authenticated" && isAdmin(session.user.rol);
  const [policy, setPolicy] = useState<ClassificationPolicy | null>(null);
  const [policyState, setPolicyState] = useState<PolicyState>("loading");
  const [form, setForm] = useState<PolicyForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function loadCurrentPolicy() {
    if (!isApiConfigured) {
      setPolicyState("unconfigured");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const current = await api.getCurrentClassificationPolicy();
      setPolicy(current);
      setPolicyState("available");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setPolicy(null);
        setPolicyState("missing");
      } else {
        setPolicyState("error");
        setMessage(requestMessage(error, "No fue posible consultar la política vigente."));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCurrentPolicy();
  }, []);

  function updateRange(index: number, key: keyof PolicyForm["rangos"][number], value: string) {
    setForm((current) => ({
      rangos: current.rangos.map((range, rangeIndex) =>
        rangeIndex === index ? { ...range, [key]: value } : range,
      ),
    }));
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const parsed = policyFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    setPublishing(true);
    try {
      const published = await api.publishClassificationPolicy(parsed.data);
      setPolicy(published);
      setPolicyState("available");
      setMessage(`La versión ${published.version} quedó publicada y vigente.`);
    } catch (error) {
      setMessage(requestMessage(error, "No fue posible publicar la política."));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuración del modelo"
        title="Política de clasificación"
        description="Define cómo se traduce el puntaje de una evaluación a una categoría de riesgo."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCurrentPolicy()}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />
      <DemoNotice />
      {message && (
        <div
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Política vigente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta versión se usa para clasificar las nuevas evaluaciones.
            </p>
          </div>
          {policy && (
            <span className="rounded-md bg-positive-soft px-2.5 py-1 text-xs font-semibold text-positive">
              Versión {policy.version}
            </span>
          )}
        </div>

        {policyState === "loading" && (
          <p className="mt-5 text-sm text-muted-foreground">Consultando Scoring…</p>
        )}
        {policyState === "unconfigured" && (
          <p className="mt-5 text-sm text-muted-foreground">
            Configura `VITE_API_BASE_URL` para consultar la política real.
          </p>
        )}
        {policyState === "missing" && (
          <p className="mt-5 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
            No existe una política vigente. Admin debe publicar una antes de realizar evaluaciones.
          </p>
        )}
        {policyState === "error" && (
          <p className="mt-5 text-sm text-destructive" role="alert">
            {message || "No fue posible consultar la política vigente."}
          </p>
        )}

        {policy && policyState === "available" && (
          <>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Publicada</dt>
                <dd className="mt-1 font-medium">{formatDate(policy.fechaPublicacion)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Creada</dt>
                <dd className="mt-1 font-medium">{formatDate(policy.fechaCreacion)}</dd>
              </div>
            </dl>
            <div className="mt-5 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Puntaje mínimo</th>
                    <th>Puntaje máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...policy.rangos]
                    .sort((left, right) => left.limiteInferior - right.limiteInferior)
                    .map((range) => (
                      <tr key={range.idRango}>
                        <td className="font-semibold">{range.categoria}</td>
                        <td>{range.limiteInferior}</td>
                        <td>{range.limiteSuperior}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      {admin && (
        <Panel className="p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg font-bold">
              {policy ? "Publicar nueva versión" : "Configurar primera política"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Los tres rangos deben cubrir todos los puntajes de -100 a 130, sin huecos ni
              solapamientos. Publicar crea una versión inmutable y la convierte en vigente para las
              siguientes evaluaciones.
            </p>
          </div>
          <form onSubmit={publish} className="space-y-5">
            {form.rangos.map((range, index) => {
              const prefix = `rangos.${index}`;
              const categoryId = `categoria-${index}`;
              const lowerId = `limite-inferior-${index}`;
              const upperId = `limite-superior-${index}`;
              const categoryError = errors[`${prefix}.categoria`];
              const lowerError = errors[`${prefix}.limiteInferior`];
              const upperError = errors[`${prefix}.limiteSuperior`];
              return (
                <fieldset
                  key={index}
                  className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <legend className="px-1 text-sm font-semibold">Rango {index + 1}</legend>
                  <Field label="Categoría" htmlFor={categoryId} error={categoryError}>
                    <select
                      id={categoryId}
                      className="form-control"
                      value={range.categoria}
                      onChange={(event) => updateRange(index, "categoria", event.target.value)}
                      {...fieldA11y(categoryId, categoryError)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Puntaje mínimo"
                    htmlFor={lowerId}
                    error={lowerError}
                    hint="Entero entre -100 y 130."
                  >
                    <input
                      id={lowerId}
                      type="number"
                      step="1"
                      min="-100"
                      max="130"
                      className="form-control"
                      value={range.limiteInferior}
                      onChange={(event) => updateRange(index, "limiteInferior", event.target.value)}
                      {...fieldA11y(lowerId, lowerError)}
                    />
                  </Field>
                  <Field
                    label="Puntaje máximo"
                    htmlFor={upperId}
                    error={upperError}
                    hint="Entero entre -100 y 130."
                  >
                    <input
                      id={upperId}
                      type="number"
                      step="1"
                      min="-100"
                      max="130"
                      className="form-control"
                      value={range.limiteSuperior}
                      onChange={(event) => updateRange(index, "limiteSuperior", event.target.value)}
                      {...fieldA11y(upperId, upperError)}
                    />
                  </Field>
                </fieldset>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                La API valida de nuevo los rangos y registra quién publicó la política.
              </p>
              <Button
                type="submit"
                disabled={
                  !isApiConfigured ||
                  publishing ||
                  policyState === "loading" ||
                  policyState === "error"
                }
              >
                <Save className="size-4" aria-hidden="true" />
                {publishing ? "Publicando…" : "Publicar política"}
              </Button>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}
