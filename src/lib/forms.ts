import type { ZodError } from "zod";

// Antes, cada formulario (solicitantes, variables, reglas, login, registro)
// repetía este mismo `Object.fromEntries(parsed.error.issues.map(...))` para
// convertir el resultado de zod en un `Record<string, string>` indexable por
// nombre de campo. Un solo lugar para ese mapeo.
export function zodErrors(error: ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

// Idem para el par aria-invalid/aria-describedby que se repetía en los ~19
// campos de formulario de la app. `id` debe coincidir con el que usa
// `Field` (el mensaje de error se renderiza con id={`${htmlFor}-error`}).
export function fieldA11y(id: string, error: string | undefined) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}
