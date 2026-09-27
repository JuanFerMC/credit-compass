import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { AuthShell, EmailField } from "@/components/shared/auth-shell";
import { Field } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { auth, signupSchema } from "@/api/auth";
import { fieldA11y } from "@/lib/forms";
import { useAuthSubmit } from "@/lib/use-auth-submit";

export const Route = createFileRoute("/crear-cuenta")({
  component: SignupPage,
});

const emptyForm = { nombre: "", email: "", password: "" };

function SignupPage() {
  const { form, setForm, errors, loading, submit } = useAuthSubmit(
    signupSchema,
    auth.signup,
    emptyForm,
  );

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
        <EmailField
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
          error={errors["email"]}
        />
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
