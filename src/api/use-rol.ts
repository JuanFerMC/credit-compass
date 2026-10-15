import { isAuthApiConfigured } from "@/api/auth";
import type { Rol } from "@/api/roles";
import { useSession } from "@/api/session";

// Rol con el que la UI decide qué mostrar. En modo demostración no hay backend
// que asigne roles: se muestra todo (el administrador). Con backend real, sin
// sesión no hay rol (null) y no se muestra nada protegido.
export function useRol(): Rol | null {
  const session = useSession();
  if (session.status === "authenticated") return session.user.rol;
  return isAuthApiConfigured ? null : "ADMINISTRADOR_RIESGO";
}
