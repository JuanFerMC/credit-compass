import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/shared/auth-shell";
import { Field } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { auth, loginSchema } from "@/api/auth";
import { fieldA11y, zodErrors } from "@/lib/forms";

export const Route = createFileRoute("/iniciar-sesion")({
  component: LoginPage,
});

const emptyForm = { email: "", password: "" };

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await auth.login(parsed.data);
      await navigate({ to: "/panel" });
    } finally {
      setLoading(false);
    }
  }

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
        <Field label="Correo" htmlFor="email" error={errors["email"]}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="form-control"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            {...fieldA11y("email", errors["email"])}
          />
        </Field>
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
