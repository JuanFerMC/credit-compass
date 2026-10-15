import { useSyncExternalStore } from "react";
import type { Rol } from "@/api/roles";

// Estado de sesión observable por la UI.
//
//  restoring     → al cargar la página, todavía no se sabe si hay sesión
//                  (se está intentando restaurarla con el refresh token). Las
//                  rutas protegidas deben ESPERAR este estado, no redirigir.
//  anonymous     → sin sesión.
//  authenticated → hay usuario.
//
// El estado inicial es "restoring" tanto en servidor como en el primer render
// del cliente, así la hidratación coincide.

export type SessionUser = {
  userId: number | null; // null en modo demo (no hay backend que lo asigne)
  nombre: string;
  email: string;
  rol: Rol;
};

// Por qué terminó la sesión (solo en "anonymous"):
//   "logout"  → el usuario salió voluntariamente.
//   "expired" → el backend la invalidó (refresh vencido/revocado, 401 sin remedio).
//   null      → nunca hubo sesión (visita nueva, o un intento de login fallido).
export type EndReason = "logout" | "expired" | null;

export type SessionState =
  | { status: "restoring"; user: null }
  | { status: "anonymous"; user: null; reason: EndReason }
  | { status: "authenticated"; user: SessionUser };

let state: SessionState = { status: "restoring", user: null };
const listeners = new Set<() => void>();

function emit(next: SessionState) {
  state = next;
  for (const listener of listeners) listener();
}

export function startSession(user: SessionUser): void {
  emit({ status: "authenticated", user });
}

export function endSession(reason: EndReason = null): void {
  emit({ status: "anonymous", user: null, reason });
}

export function getSessionState(): SessionState {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: SessionState = { status: "restoring", user: null };

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSessionState, () => SERVER_STATE);
}
