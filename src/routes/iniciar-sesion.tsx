import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PublicHeader, PublicFooter } from "@/components/public-shell";
import { Panel, Field } from "@/components/page";
import { Button } from "@/components/ui/button";
import { auth, loginSchema } from "@/lib/auth";

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
      await auth.login(parsed.data);
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
            <Link to="/crear-cuenta">Crear cuenta</Link>
          </Button>
        }
      />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Panel className="w-full max-w-sm p-6">
          <div className="mb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <LogIn className="size-5" />
            </span>
            <h1 className="mt-3 font-display text-xl font-bold">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Modo demostrativo: no hay backend de autenticación todavía, esto solo simula tu sesión
              en este navegador.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
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
                autoComplete="current-password"
                className="form-control"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                aria-invalid={Boolean(errors["password"])}
                aria-describedby={errors["password"] ? "password-error" : undefined}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/crear-cuenta" className="font-semibold text-primary underline">
              Crea una
            </Link>
          </p>
        </Panel>
      </main>
      <PublicFooter />
    </div>
  );
}
