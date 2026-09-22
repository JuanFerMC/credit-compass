import { z } from "zod";

/*
 * Catálogo cerrado de variables de riesgo (HU3, RF01) y su tipo asociado.
 * El backend valida esto de forma autoritativa (NombreVariableRiesgo /
 * TipoVariableRiesgo), pero no expone un endpoint para listar variables
 * existentes (ver nota en README de /reglas y /variables). Este catálogo
 * estático permite ofrecer una UI útil (derivar qué operadores aplican,
 * qué forma tiene valorCondicion) sin depender de ese endpoint ausente.
 */
export const RISK_VARIABLE_CATALOG = [
  { value: "INGRESOS_MENSUALES", label: "Ingresos mensuales", tipo: "NUMERICO" },
  { value: "NIVEL_ENDEUDAMIENTO", label: "Nivel de endeudamiento", tipo: "NUMERICO" },
  { value: "NUMERO_MORAS", label: "Número de moras", tipo: "NUMERICO" },
  { value: "HISTORIAL_CREDITICIO", label: "Historial crediticio", tipo: "CATEGORICO" },
  { value: "ANTIGUEDAD_LABORAL", label: "Antigüedad laboral", tipo: "NUMERICO" },
] as const;

export type RiskVariableName = (typeof RISK_VARIABLE_CATALOG)[number]["value"];
export type RiskVariableType = "NUMERICO" | "CATEGORICO";

export function tipoDeVariable(variable: RiskVariableName): RiskVariableType {
  return RISK_VARIABLE_CATALOG.find((item) => item.value === variable)?.tipo ?? "NUMERICO";
}

// HU05 RF04/RF05: numéricas permiten los 5 operadores; categóricas solo "=".
export const OPERATOR_SYMBOLS = ["=", ">", ">=", "<", "<="] as const;
export type OperatorSymbol = (typeof OPERATOR_SYMBOLS)[number];
export function operadoresPermitidos(tipo: RiskVariableType): readonly OperatorSymbol[] {
  return tipo === "CATEGORICO" ? ["="] : OPERATOR_SYMBOLS;
}

export const applicantSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "Escribe al menos 3 caracteres").max(100),
  numeroDocumento: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Usa entre 6 y 15 dígitos"),
  ingresosMensuales: z.coerce.number().min(0, "No puede ser negativo"),
  deudasMensuales: z.coerce.number().min(0, "No puede ser negativo"),
  numeroMoras: z.coerce.number().int("Debe ser un número entero").min(0, "No puede ser negativo"),
  historialCrediticio: z.enum(["BUENO", "REGULAR", "MALO"]),
  antiguedadLaboral: z.coerce.number().min(0, "No puede ser negativa"),
});

export const riskVariableSchema = z.object({
  variable: z.enum([
    "INGRESOS_MENSUALES",
    "NIVEL_ENDEUDAMIENTO",
    "NUMERO_MORAS",
    "HISTORIAL_CREDITICIO",
    "ANTIGUEDAD_LABORAL",
  ]),
  descripcion: z.string().trim().min(10, "Escribe al menos 10 caracteres").max(255),
});

// HU4: activar/desactivar una variable de riesgo existente.
export const changeRiskVariableStatusSchema = z.object({
  idRiesgo: z.coerce.number().int().positive("Ingresa un idRiesgo válido"),
  estado: z.enum(["ACTIVA", "INACTIVA"]),
});

/*
 * HU05/HU06: crear y editar reglas de scoring. valorCondicion se valida
 * aquí como texto no vacío (igual que hace el backend) — la validación
 * "numérico vs. BUENO/REGULAR/MALO según el tipo de variable" (RF06/RF07)
 * se hace en la UI de reglas.tsx a partir de RISK_VARIABLE_CATALOG, porque
 * el tipo no viaja en este payload (solo idRiesgo).
 */
const scoringRuleFields = {
  operador: z.enum(OPERATOR_SYMBOLS),
  valorCondicion: z.string().trim().min(1, "Indica un valor"),
  // El backend rechaza decimales incluso si llegan como "20.0" (ver
  // PuntajeReglaScoringDeserializer); z.int() ya cubre ese caso porque
  // coerce.number().int() falla ante cualquier valor no entero.
  puntaje: z.coerce
    .number()
    .int("El puntaje debe ser un número entero, sin decimales")
    .min(-100, "El puntaje debe ser mayor o igual a -100")
    .max(100, "El puntaje debe ser menor o igual a 100"),
};

export const createScoringRuleSchema = z.object({
  idRiesgo: z.coerce.number().int().positive("Ingresa el idRiesgo de la variable"),
  ...scoringRuleFields,
});

export const editScoringRuleSchema = z.object({
  idRegla: z.coerce.number().int().positive("Ingresa el idRegla a editar"),
  ...scoringRuleFields,
});

export type ApplicantInput = z.infer<typeof applicantSchema>;
export type RiskVariableInput = z.infer<typeof riskVariableSchema>;
export type ChangeRiskVariableStatusInput = z.infer<typeof changeRiskVariableStatusSchema>;
export type CreateScoringRuleInput = z.infer<typeof createScoringRuleSchema>;
export type EditScoringRuleInput = z.infer<typeof editScoringRuleSchema>;

export type ApplicantDetail = ApplicantInput & {
  idSolicitante: number;
  fechaRegistro: string;
};

export type RiskVariableDetail = {
  idVariableRiesgo: number;
  variable: RiskVariableName;
  tipo: RiskVariableType;
  descripcion: string;
  estado: "ACTIVA" | "INACTIVA";
};

export type ChangeRiskVariableStatusResult = {
  idRiesgo: number;
  estadoAnterior: "ACTIVA" | "INACTIVA";
  estadoNuevo: "ACTIVA" | "INACTIVA";
};

export type ScoringRuleDetail = {
  idRegla: number;
  idRiesgo: number;
  operador: OperatorSymbol;
  valorCondicion: string;
  puntaje: number;
};

export type ApiError = {
  errorCode?: string;
  message?: string;
  details?: string[];
  traceId?: string;
};

const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(
  /\/$/,
  "",
);

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: string[] = [],
    public traceId?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL)
    throw new ApiRequestError(
      "La API no está configurada. La información de demostración sigue disponible.",
      0,
    );
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new ApiRequestError(
      error.message ?? "No fue posible completar la solicitud",
      response.status,
      error.details ?? [],
      error.traceId,
    );
  }
  // 200/201 con body vacío no debería ocurrir en esta API, pero por si acaso
  // evitamos que `response.json()` reviente un flujo que sí fue exitoso.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  // HU1
  registerApplicant: (input: ApplicantInput) =>
    request<
      Pick<
        ApplicantDetail,
        "idSolicitante" | "nombreCompleto" | "numeroDocumento" | "fechaRegistro"
      >
    >("/api/v1/solicitantes", { method: "POST", body: JSON.stringify(input) }),
  // HU2
  findApplicant: (document: string) =>
    request<ApplicantDetail>(`/api/v1/solicitantes/documento/${encodeURIComponent(document)}`),
  // HU3
  createRiskVariable: (input: RiskVariableInput) =>
    request<RiskVariableDetail>("/api/v1/variables-riesgo", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  // HU4
  changeRiskVariableStatus: ({ idRiesgo, estado }: ChangeRiskVariableStatusInput) =>
    request<ChangeRiskVariableStatusResult>(`/api/v1/variables-riesgo/${idRiesgo}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
  // HU5
  createScoringRule: ({ idRiesgo, ...body }: CreateScoringRuleInput) =>
    request<ScoringRuleDetail>("/api/v1/reglas-scoring", {
      method: "POST",
      body: JSON.stringify({ idRiesgo, ...body }),
    }),
  // HU6
  editScoringRule: ({ idRegla, ...body }: EditScoringRuleInput) =>
    request<ScoringRuleDetail>(`/api/v1/reglas-scoring/${idRegla}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const isApiConfigured = Boolean(API_BASE_URL);
