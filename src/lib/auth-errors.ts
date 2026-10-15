import { ApiRequestError } from "@/api/http";

// Mensajes de UI por `errorCode` del Security-Module (INTEGRACION_FRONTEND.md,
// sección 7). El backend envía `message` en español, pero depender de su texto
// para decidir qué mostrar es frágil: el código es el contrato estable.
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  UNAUTHORIZED: "Tu sesión terminó. Inicia sesión de nuevo.",
  ACCESS_DENIED: "No tienes permisos para realizar esta acción.",
  USER_NOT_FOUND: "No se encontró el usuario.",
  DUPLICATE_EMAIL: "Ya existe un usuario con ese correo.",
  VALIDATION_ERROR: "Revisa los datos ingresados.",
  ROL_NOT_FOUND: "El rol seleccionado no existe.",
  ROL_NOT_ALLOWED: "El rol seleccionado no está permitido.",
};

export function describeAuthError(error: unknown, fallback = "No fue posible continuar."): string {
  if (error instanceof ApiRequestError) {
    // status 0 = sin red / timeout / backend sin configurar: el mensaje ya es útil.
    if (error.status === 0) return error.message;
    return (error.errorCode && MESSAGES[error.errorCode]) || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
