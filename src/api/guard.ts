import { canAccess } from "@/api/permissions";
import type { SessionState } from "@/api/session";

// Decisión del guard de /panel/*, como función pura para poder probarla.
export type GuardDecision =
  | { type: "allow" }
  | { type: "loading" } // sesión todavía restaurándose: NO mostrar el panel ni redirigir
  | { type: "login"; expired: boolean } // llevar a /iniciar-sesion
  | { type: "home" } // el usuario salió: llevar a la landing
  | { type: "forbidden" }; // autenticado, pero su rol no puede ver esta sección

export function decideGuard(input: {
  authConfigured: boolean;
  session: SessionState;
  pathname: string;
}): GuardDecision {
  const { authConfigured, session, pathname } = input;
  // Modo demostración: el panel queda abierto (no hay backend que valide nada).
  if (!authConfigured) return { type: "allow" };

  if (session.status === "restoring") return { type: "loading" };
  if (session.status === "anonymous") {
    if (session.reason === "logout") return { type: "home" };
    return { type: "login", expired: session.reason === "expired" };
  }
  return canAccess(session.user.rol, pathname) ? { type: "allow" } : { type: "forbidden" };
}

// Solo se vuelve a rutas internas del panel: el parámetro `redirect` lo controla
// quien arma la URL, así que se valida para evitar un open redirect
// (p. ej. "//evil.com" o "https://evil.com").
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  // Cada segmento no vacío y que no empiece por "." (bloquea "//" y "..").
  if (!/^\/panel(\/[A-Za-z0-9_~-][A-Za-z0-9._~-]*)*$/.test(value)) return undefined;
  return value;
}
