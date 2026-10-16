import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { auth, isAuthApiConfigured, loginSchema } from "@/api/auth";
import { safeRedirect } from "@/api/guard";
import { useSession } from "@/api/session";
import { AuthShell, EmailField, FormError, FormNotice } from "@/components/shared/auth-shell";
import { Field } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { fieldA11y } from "@/lib/forms";
import { useAuthSubmit } from "@/lib/use-auth-submit";

export const Route = createFileRoute("/iniciar-sesion")({
  // `redirect`: sección del panel que se intentaba abrir (se valida: solo rutas
  // internas del panel). `motivo=expirada`: el guard nos trajo aquí porque la
  // sesión terminó.
  validateSearch: (search: Record<string, unknown>) => {
    const redirect = safeRedirect(search["redirect"]);
    return {
      ...(redirect ? { redirect } : {}),
      ...(search["motivo"] === "expirada" ? { motivo: "expirada" as const } : {}),
    };
  },
  component: LoginPage,
});

const emptyForm = { email: "", password: "" };

function LoginPage() {
  const { redirect, motivo } = Route.useSearch();
  const router = useRouter();
  const session = useSession();
  const { form, setForm, errors, formError, loading, submit } = useAuthSubmit(
    loginSchema,
    auth.login,
    emptyForm,
    redirect ?? "/panel",
  );

  // Ya hay sesión (p. ej. el usuario abrió /iniciar-sesion a mano): al panel.
  useEffect(() => {
    if (session.status === "authenticated") router.history.replace(redirect ?? "/panel");
  }, [session.status, redirect, router]);

  // Con backend real no hay registro público: el alta la hace un administrador,
  // así que en vez de "Crear cuenta" se ofrece cómo recuperar/solicitar acceso.
  const shell = isAuthApiConfigured
    ? {
        switchPath: "/recuperar-cuenta" as const,
        switchLabel: "¿Sin acceso?",
        footerText: "¿No tienes cuenta u olvidaste tu contraseña?",
        footerLinkText: "Cómo recuperar el acceso",
      }
    : {
        switchPath: "/crear-cuenta" as const,
        switchLabel: "Crear cuenta",
        footerText: "¿No tienes cuenta?",
        footerLinkText: "Crea una",
      };

  return (
    <AuthShell icon={<LogIn className="size-5" />} title="Iniciar sesión" {...shell}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {motivo === "expirada" && (
          <FormNotice message="Tu sesión terminó. Inicia sesión de nuevo." />
        )}
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
        {isAuthApiConfigured && (
          <p className="text-center text-xs">
            <Link to="/recuperar-cuenta" className="text-muted-foreground underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}
