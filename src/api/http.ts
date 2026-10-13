// Cliente HTTP genérico, reutilizable para más de un backend.
//
// Antes, `src/api/client.ts` tenía un único `request()` atado a
// VITE_API_BASE_URL (Motor de Scoring, :8080). Con el nuevo backend de
// autenticación (Security-Module, :8081) hacen falta DOS clientes con la
// misma lógica de timeout / errores / JSON seguro pero distinta URL base y
// distinta política de token. `createHttpClient` es esa lógica, una sola vez.

const REQUEST_TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: string[] = [],
    public traceId?: string,
    public errorCode?: string,
  ) {
    super(message);
  }
}

// Los dos backends no devuelven `details` con la misma forma:
//  - Motor de Scoring:  details: string[]
//  - Security-Module:   details: { campo: "mensaje" }   (solo VALIDATION_ERROR)
// Se normaliza a string[] para que ApiRequestError tenga un contrato único.
function normalizeDetails(details: unknown): string[] {
  if (Array.isArray(details)) return details.map(String);
  if (details && typeof details === "object") {
    return Object.entries(details as Record<string, unknown>).map(
      ([field, message]) => `${field}: ${String(message)}`,
    );
  }
  return [];
}

type ErrorBody = {
  errorCode?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
};

export type HttpClientOptions = {
  // undefined => backend sin configurar: toda llamada falla con `notConfiguredMessage`
  // y la UI cae a datos de demostración (mismo comportamiento que antes).
  baseUrl: string | undefined;
  notConfiguredMessage: string;
  // Si devuelve un token, se envía como `Authorization: Bearer <token>`.
  getToken?: (() => string | null) | undefined;
  // Se invoca cuando el backend responde 401 a una petición que llevaba token
  // (token vencido/revocado, usuario desactivado): la sesión ya no sirve.
  onUnauthorized?: (() => void) | undefined;
};

export function createHttpClient(options: HttpClientOptions) {
  const { baseUrl, notConfiguredMessage, getToken, onUnauthorized } = options;

  return async function request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!baseUrl) throw new ApiRequestError(notConfiguredMessage, 0);

    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const token = getToken?.() ?? null;
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      throw new ApiRequestError(
        timedOut
          ? "El backend tardó demasiado en responder."
          : "No fue posible conectar con el backend.",
        0,
      );
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      if (response.status === 401 && token) onUnauthorized?.();
      throw new ApiRequestError(
        body.message ?? "No fue posible completar la solicitud",
        response.status,
        normalizeDetails(body.details),
        body.traceId,
        body.errorCode,
      );
    }

    // 200/201/204 con body vacío (p. ej. PATCH .../password responde 204).
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiRequestError(
        "La respuesta del backend no tiene un formato válido.",
        response.status,
      );
    }
  };
}

// Quita la barra final de una URL base de entorno ("http://x:8080/" -> "http://x:8080").
export function cleanBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : undefined;
}
