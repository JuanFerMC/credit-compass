import { ApiRequestError, cleanBaseUrl, createHttpClient } from "@/api/http";
import { authApi } from "@/api/auth";
import { endSession } from "@/api/session";
import { clearTokens, getAccessToken, getRefreshToken } from "@/api/token-store";

/**
 * Cliente de evaluation-query-api (HU13, HU14 y HU15).
 *
 * Esta API consulta resultados persistidos del Motor de Scoring. Mantiene su
 * propia URL base, pero reutiliza el JWT y la renovación de Security-Module.
 * No modifica el cliente existente del Motor de Scoring ni el de autenticación.
 */

export type AppliedFactor = {
  idRegla: number;
  variable: string;
  operadorAplicado: string;
  valorCondicionAplicado: string;
  puntajeReglaAplicado: number;
  condicionCumplida: boolean;
  contribucion: number;
};

export type EvaluationExplanation = {
  idEvaluacion: number;
  fechaEvaluacion: string;
  scoreTotal: number;
  origenPuntaje: string;
  clasificada: boolean;
  categoria: string | null;
  versionPolitica: number | null;
  factores: AppliedFactor[];
};

export type EvaluationRecommendation = {
  orden: number;
  codigo: string;
  texto: string;
  tipoActivacion: string;
  categoria: string | null;
  variable: string | null;
};

export type EvaluationRecommendations = {
  idEvaluacion: number;
  generadas: boolean;
  versionCatalogo: string | null;
  fechaGeneracion: string | null;
  recomendaciones: EvaluationRecommendation[];
};

export type ApplicantEvaluationHistoryItem = {
  idEvaluacion: number;
  fechaEvaluacion: string;
  scoreTotal: number;
  origenPuntaje: string;
  clasificada: boolean;
  categoria: string | null;
  versionPolitica: number | null;
  estado: "COMPLETADA" | null;
  explicacion: string;
  recomendaciones: string;
};

const BASE_URL = cleanBaseUrl(
  import.meta.env["VITE_EVALUATION_QUERY_BASE_URL"] as string | undefined,
);

const request = createHttpClient({
  baseUrl: BASE_URL,
  notConfiguredMessage:
    "La API de consultas de evaluación no está configurada. Define VITE_EVALUATION_QUERY_BASE_URL.",
  getToken: getAccessToken,
  refreshSession: authApi.refreshTokens,
  onUnauthorized: () => {
    // La sesión solo se considera terminada si Auth invalida el refresh token.
    // Un fallo transitorio de Auth o un 401 persistente de Query (por ejemplo,
    // audiencia/clave de esa API) conserva el refresh token y no expulsa al
    // usuario del panel.
    if (getRefreshToken()) return;
    clearTokens();
    endSession("expired");
  },
});

function requirePositiveId(id: number, field: string): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiRequestError(`${field} debe ser un entero positivo.`, 0);
  }
}

export const evaluationQueryApi = {
  /** HU13: explicación persistida y factores aplicados a una evaluación. */
  getExplanation: (idEvaluacion: number) => {
    requirePositiveId(idEvaluacion, "idEvaluacion");
    return request<EvaluationExplanation>(`/api/v1/evaluaciones/${idEvaluacion}/explicacion`);
  },

  /** HU14: recomendaciones generadas durante la evaluación, si existen. */
  getRecommendations: (idEvaluacion: number) => {
    requirePositiveId(idEvaluacion, "idEvaluacion");
    return request<EvaluationRecommendations>(
      `/api/v1/evaluaciones/${idEvaluacion}/recomendaciones`,
    );
  },

  /** HU15: historial del solicitante, de la evaluación más reciente a la más antigua. */
  getApplicantHistory: (idSolicitante: number) => {
    requirePositiveId(idSolicitante, "idSolicitante");
    return request<ApplicantEvaluationHistoryItem[]>(
      `/api/v1/solicitantes/${idSolicitante}/evaluaciones`,
    );
  },
};

export const isEvaluationQueryApiConfigured = Boolean(BASE_URL);
