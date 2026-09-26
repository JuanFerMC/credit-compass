import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PublicHeader, PublicFooter } from "@/components/layout/public-shell";
import { Panel, Field } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { auth, signupSchema } from "@/lib/auth";

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
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
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
    <div className="flex min-h-screen flex-col">
      <PublicHeader
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/iniciar-sesion">Iniciar sesión</Link>
          </Button>
        }
      />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Panel className="w-full max-w-sm p-6">
          <div className="mb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <UserPlus className="size-5" />
            </span>
            <h1 className="mt-3 font-display text-xl font-bold">Crear cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Modo demostrativo: no hay backend de autenticación todavía, esto solo simula tu sesión
              en este navegador.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Nombre" htmlFor="nombre" error={errors["nombre"]}>
              <input
                id="nombre"
                autoComplete="name"
                className="form-control"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                aria-invalid={Boolean(errors["nombre"])}
                aria-describedby={errors["nombre"] ? "nombre-error" : undefined}
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
                aria-invalid={Boolean(errors["email"])}
                aria-describedby={errors["email"] ? "email-error" : undefined}
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
                aria-invalid={Boolean(errors["password"])}
                aria-describedby={errors["password"] ? "password-error" : undefined}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/iniciar-sesion" className="font-semibold text-primary underline">
              Inicia sesión
            </Link>
          </p>
        </Panel>
      </main>
      <PublicFooter />
    </div>
  );
}
