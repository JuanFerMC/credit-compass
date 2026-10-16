import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isAuthApiConfigured } from "@/api/auth";
import { ApiRequestError } from "@/api/http";
import { useSession } from "@/api/session";
import { changeOwnPasswordSchema, usersApi } from "@/api/users";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { fieldA11y } from "@/lib/forms";

export const Route = createFileRoute("/panel/cuenta")({
  head: () => ({ meta: [{ title: "Mi cuenta — Veridica" }] }),
  component: AccountPage,
});

function AccountPage() {
  const session = useSession();
  const user = session.status === "authenticated" ? session.user : null;
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const parsed = changeOwnPasswordSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }
    if (parsed.data.newPassword !== form.confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    if (!user?.userId) {
      setError("No se pudo identificar tu cuenta. Inicia sesión nuevamente.");
      return;
    }

    setSaving(true);
    try {
      await usersApi.changeOwnPassword(
        user.userId,
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Tu contraseña se actualizó correctamente.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "No fue posible cambiar la contraseña.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perfil"
        title="Mi cuenta"
        description="Consulta tu identidad y cambia tu contraseña de acceso."
      />
      {!isAuthApiConfigured && <DemoNotice />}

      <Panel className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Datos de la sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.nombre ?? "Usuario"}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            <p className="mt-2 text-xs font-semibold">
              {user?.rol === "ADMINISTRADOR_RIESGO"
                ? "Administrador de riesgo"
                : user?.rol === "ANALISTA_CREDITO"
                  ? "Analista de crédito"
                  : "Modo demostración"}
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="max-w-2xl p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Cambiar contraseña</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Debes conocer tu contraseña actual. La nueva debe tener entre 12 y 72 caracteres.
            </p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <Field label="Contraseña actual" htmlFor="currentPassword">
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className="form-control"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              {...fieldA11y("currentPassword", undefined)}
              disabled={!isAuthApiConfigured || saving}
            />
          </Field>
          <Field label="Nueva contraseña" htmlFor="newPassword">
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="form-control"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              {...fieldA11y("newPassword", undefined)}
              disabled={!isAuthApiConfigured || saving}
            />
          </Field>
          <Field label="Confirmar nueva contraseña" htmlFor="confirmPassword">
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="form-control"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              {...fieldA11y("confirmPassword", undefined)}
              disabled={!isAuthApiConfigured || saving}
            />
          </Field>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-lg border border-positive/30 bg-positive/5 p-3 text-sm"
            >
              {message}
            </p>
          )}
          <Button type="submit" disabled={!isAuthApiConfigured || saving}>
            {saving ? "Actualizando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
