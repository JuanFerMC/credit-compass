import { createFileRoute } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { AuthShell, EmailField, FormError } from "@/components/shared/auth-shell";
import { Field } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { auth, loginSchema } from "@/api/auth";
import { fieldA11y } from "@/lib/forms";
import { useAuthSubmit } from "@/lib/use-auth-submit";

export const Route = createFileRoute("/iniciar-sesion")({
  component: LoginPage,
});

const emptyForm = { email: "", password: "" };

function LoginPage() {
  const { form, setForm, errors, formError, loading, submit } = useAuthSubmit(
    loginSchema,
    auth.login,
    emptyForm,
  );

  return (
    <AuthShell
      icon={<LogIn className="size-5" />}
      title="Iniciar sesión"
      switchPath="/crear-cuenta"
      switchLabel="Crear cuenta"
      footerText="¿No tienes cuenta?"
      footerLinkText="Crea una"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <EmailField
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
          error={errors["email"]}
        />
        <Field label="Contraseña" htmlFor="password" error={errors["password"]}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="form-control"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            {...fieldA11y("password", errors["password"])}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </Button>
      </form>
    </AuthShell>
  );
}
