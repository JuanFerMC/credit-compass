import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/shared/auth-shell";
import { Field } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { auth, signupSchema } from "@/api/auth";
import { fieldA11y, zodErrors } from "@/lib/forms";

export const Route = createFileRoute("/crear-cuenta")({
  component: SignupPage,
});

const emptyForm = { nombre: "", email: "", password: "" };

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await auth.signup(parsed.data);
      await navigate({ to: "/panel" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      icon={<UserPlus className="size-5" />}
      title="Crear cuenta"
      switchPath="/iniciar-sesion"
      switchLabel="Iniciar sesión"
      footerText="¿Ya tienes cuenta?"
      footerLinkText="Inicia sesión"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre" htmlFor="nombre" error={errors["nombre"]}>
          <input
            id="nombre"
            autoComplete="name"
            className="form-control"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            {...fieldA11y("nombre", errors["nombre"])}
          />
        </Field>
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
            autoComplete="new-password"
            className="form-control"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            {...fieldA11y("password", errors["password"])}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthShell>
  );
}
