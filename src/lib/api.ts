import { z } from "zod";

export const applicantSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "Escribe al menos 3 caracteres").max(100),
  numeroDocumento: z.string().trim().regex(/^\d{6,15}$/, "Usa entre 6 y 15 dígitos"),
  ingresosMensuales: z.coerce.number().min(0, "No puede ser negativo"),
  deudasMensuales: z.coerce.number().min(0, "No puede ser negativo"),
  numeroMoras: z.coerce.number().int("Debe ser un número entero").min(0, "No puede ser negativo"),
  historialCrediticio: z.enum(["BUENO", "REGULAR", "MALO"]),
  antiguedadLaboral: z.coerce.number().min(0, "No puede ser negativa"),
});

export const riskVariableSchema = z.object({
  variable: z.enum(["INGRESOS_MENSUALES", "NIVEL_ENDEUDAMIENTO", "NUMERO_MORAS", "HISTORIAL_CREDITICIO", "ANTIGUEDAD_LABORAL"]),
  descripcion: z.string().trim().min(10, "Escribe al menos 10 caracteres").max(255),
});

export type ApplicantInput = z.infer<typeof applicantSchema>;
export type RiskVariableInput = z.infer<typeof riskVariableSchema>;

export type ApplicantDetail = ApplicantInput & {
  idSolicitante: number;
  fechaRegistro: string;
};

export type ApiError = { errorCode?: string; message?: string; details?: string[]; traceId?: string };

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public details: string[] = [], public traceId?: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new ApiRequestError("La API no está configurada. La información de demostración sigue disponible.", 0);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new ApiRequestError(error.message ?? "No fue posible completar la solicitud", response.status, error.details ?? [], error.traceId);
  }
  return response.json() as Promise<T>;
}

export const api = {
  registerApplicant: (input: ApplicantInput) => request<Pick<ApplicantDetail, "idSolicitante" | "nombreCompleto" | "numeroDocumento" | "fechaRegistro">>("/api/v1/solicitantes", { method: "POST", body: JSON.stringify(input) }),
  findApplicant: (document: string) => request<ApplicantDetail>(`/api/v1/solicitantes/documento/${encodeURIComponent(document)}`),
  createRiskVariable: (input: RiskVariableInput) => request<{ idVariableRiesgo: number; variable: string; tipo: string; descripcion: string; estado: string }>("/api/v1/variables-riesgo", { method: "POST", body: JSON.stringify(input) }),
};

export const isApiConfigured = Boolean(API_BASE_URL);