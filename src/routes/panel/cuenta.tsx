import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isAuthApiConfigured } from "@/api/auth";
import { ApiRequestError } from "@/api/http";
import { ROLE_LABEL } from "@/api/roles";
import { useSession } from "@/api/session";
import { makeChangePasswordSchema } from "@/api/users-client";
import { usersApi } from "@/api/users";
import { FormError } from "@/components/shared/auth-shell";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { describeAuthError } from "@/lib/auth-errors";
import { fieldA11y, zodErrors } from "@/lib/forms";

export const Route = createFileRoute("/panel/cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta — Veridica" },
      { name: "description", content: "Tu perfil y el cambio de tu contraseña." },
    ],
  }),
  component: AccountPage,
});

const emptyForm = { currentPassword: "", newPassword: "", confirm: "" };

function AccountPage() {
  const session = useSession();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Con backend real el guard del panel garantiza sesión; en demostración se
  // puede llegar sin haber iniciado sesión.
  if (session.status !== "authenticated") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cuenta"
          title="Mi cuenta"
          description="Tu perfil y el cambio de tu contraseña."
        />
        <Panel className="p-5 text-sm text-muted-foreground">
          Inicia sesión para ver tu cuenta.{" "}
          <Link to="/iniciar-sesion" className="font-semibold text-primary underline">
            Iniciar sesión
          </Link>
        </Panel>
      </div>
    );
  }

  const { user } = session;
  // El analista debe confirmar su contraseña actual; el administrador no (el
  // backend no se la pide).
  const requireCurrent = user.rol === "ANALISTA_CREDITO";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const parsed = makeChangePasswordSchema(requireCurrent).safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      if (isAuthApiConfigured && user.userId !== null) {
        await usersApi.changePassword(
          user.userId,
          parsed.data.newPassword,
          requireCurrent ? parsed.data.currentPassword : undefined,
        );
      }
      setForm(emptyForm);
      setNotice(
        "Contraseña actualizada. Tus otras sesiones abiertas seguirán activas hasta que expiren (hasta 7 días).",
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.errorCode === "INVALID_CREDENTIALS") {
        // Mensaje propio: el genérico dice "Correo o contraseña incorrectos".
        setErrors({ currentPassword: "La contraseña actual no es correcta." });
      } else {
        setFormError(describeAuthError(error));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cuenta"
        title="Mi cuenta"
        description="Consulta tu perfil y cambia tu contraseña."
      />
      {!isAuthApiConfigured && <DemoNotice />}

      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <UserRound className="size-5" />
            </span>
            <h2 className="font-display font-bold">Perfil</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">Nombre</dt>
              <dd className="font-semibold">{user.nombre}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">Correo</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted-foreground">Rol</dt>
              <dd>{ROLE_LABEL[user.rol]}</dd>
            </div>
          </dl>
        </Panel>

        <Panel className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-bold">Cambiar contraseña</h2>
              <p className="text-xs text-muted-foreground">Entre 12 y 72 caracteres.</p>
            </div>
          </div>
          {notice && (
            <output className="mb-4 block rounded-lg bg-positive-soft p-3 text-sm text-positive">
              {notice}
            </output>
          )}
          <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
            <FormError message={formError} />
            {requireCurrent && (
              <Field
                label="Contraseña actual"
                htmlFor="current-password"
                error={errors["currentPassword"]}
              >
                <input
                  id="current-password"
                  type="password"
                  className="form-control"
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  {...fieldA11y("current-password", errors["currentPassword"])}
                />
              </Field>
            )}
            <Field label="Contraseña nueva" htmlFor="new-password" error={errors["newPassword"]}>
              <input
                id="new-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                {...fieldA11y("new-password", errors["newPassword"])}
              />
            </Field>
            <Field
              label="Confirmar contraseña nueva"
              htmlFor="confirm-password"
              error={errors["confirm"]}
            >
              <input
                id="confirm-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                {...fieldA11y("confirm-password", errors["confirm"])}
              />
            </Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Cambiar contraseña"}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
