import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { isAuthApiConfigured } from "@/api/auth";
import { AuthShell } from "@/components/shared/auth-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recuperar-cuenta")({
  component: RecoverAccountPage,
});

// El Security-Module NO tiene recuperación por correo ("olvidé mi contraseña"):
// solo un administrador puede resetear la contraseña de alguien
// (PATCH /usuarios/{id}/password) y no existe registro público. Esta pantalla
// explica ese proceso en vez de simular un envío de correo que no existiría.
// Cuando el backend publique el endpoint de recuperación, aquí va el formulario
// de correo (mismo patrón que iniciar-sesion.tsx con useAuthSubmit).
function RecoverAccountPage() {
  return (
    <AuthShell
      icon={<KeyRound className="size-5" />}
      title="Recuperar acceso"
      switchPath="/iniciar-sesion"
      switchLabel="Iniciar sesión"
      footerText="¿Recordaste tu contraseña?"
      footerLinkText="Inicia sesión"
    >
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        {isAuthApiConfigured ? (
          <>
            <p>
              Por seguridad, las cuentas las crea y administra un{" "}
              <strong className="text-foreground">administrador de riesgo</strong>. No hay
              recuperación automática por correo.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Olvidé mi contraseña:</strong> pídele a un
                administrador que la restablezca desde el módulo de usuarios.
              </li>
              <li>
                <strong className="text-foreground">Aún no tengo cuenta:</strong> solicita el alta a
                un administrador.
              </li>
            </ul>
          </>
        ) : (
          <p>
            Estás en modo demostración: no hay cuentas reales que recuperar. Con el servicio de
            autenticación activo, el restablecimiento lo hace un administrador de riesgo.
          </p>
        )}
        <Button asChild variant="secondary" className="w-full">
          <Link to="/iniciar-sesion">Volver a iniciar sesión</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
