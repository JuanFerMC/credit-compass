import { ApiRequestError, cleanBaseUrl, createHttpClient } from "@/api/http";
import { isValidExportApplicantIds } from "@/api/export-validation";
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

export type ExportedReport = {
  blob: Blob;
  filename: string;
};

export type ExportReportFormat = "pdf" | "excel";

export function validateExportApplicantIds(ids: number[]): void {
  if (!isValidExportApplicantIds(ids)) {
    throw new ApiRequestError(
      "Selecciona entre 1 y 50 solicitantes con identificadores válidos y sin duplicados.",
      400,
    );
  }
}

async function exportReport(
  format: ExportReportFormat,
  solicitanteIds: number[],
  retried = false,
): Promise<ExportedReport> {
  validateExportApplicantIds(solicitanteIds);
  if (!BASE_URL) {
    throw new ApiRequestError(
      "La API de consultas de evaluación no está configurada. Define VITE_EVALUATION_QUERY_BASE_URL.",
      0,
    );
  }

  const token = getAccessToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/v1/evaluaciones/export/${format}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ solicitanteIds }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiRequestError(
      timedOut
        ? "La generación del reporte tardó demasiado."
        : "No fue posible conectar con la API de consultas.",
      0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      details?: string[];
      traceId?: string;
      errorCode?: string;
    };
    if (response.status === 401 && token) {
      if (!retried && (await authApi.refreshTokens())) {
        return exportReport(format, solicitanteIds, true);
      }
      if (!getRefreshToken()) {
        clearTokens();
        endSession("expired");
      }
    }
    throw new ApiRequestError(
      body.message ?? "No fue posible generar el reporte.",
      response.status,
      Array.isArray(body.details) ? body.details.map(String) : [],
      body.traceId,
      body.errorCode,
    );
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encodedFilename = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  const plainFilename = disposition.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1];
  let filename = format === "pdf" ? "reporte-evaluaciones.pdf" : "reporte-evaluaciones.xlsx";
  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename.trim());
    } catch {
      filename = encodedFilename.trim();
    }
  } else if (plainFilename) {
    filename = plainFilename.trim();
  }
  filename = filename.replace(/[\r\n\\/]/g, "_");

  return { blob: await response.blob(), filename };
}

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

  /** Exporta el historial de uno o varios solicitantes como archivo descargable. */
  exportReport: (format: ExportReportFormat, solicitanteIds: number[]) =>
    exportReport(format, solicitanteIds),
};

export const isEvaluationQueryApiConfigured = Boolean(BASE_URL);
