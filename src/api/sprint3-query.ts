import { ApiRequestError, cleanBaseUrl, createHttpClient } from "@/api/http";
import { authApi } from "@/api/auth";
import { endSession } from "@/api/session";
import { clearTokens, getAccessToken, getRefreshToken } from "@/api/token-store";

export type RiskCategory = "BAJO" | "MEDIO" | "ALTO";

export type HistoryItem = {
  idEvaluacion: number;
  fechaEvaluacion: string;
  scoreTotal: number;
  origenPuntaje: string;
  clasificada: boolean;
  categoria: RiskCategory | null;
  versionPolitica: number | null;
  estado: "COMPLETADA" | null;
  explicacion: string;
  recomendaciones: string;
};

export type HistoryFilters = {
  fechaDesde?: string;
  fechaHasta?: string;
  numeroDocumento?: string;
  categoria?: RiskCategory;
  pagina?: number;
  tamano?: number;
};

export type HistoryPage = {
  evaluaciones: HistoryItem[];
  pagina: number;
  tamano: number;
  totalRegistros: number;
  totalPaginas: number;
};

export type RiskDistribution = {
  totalEvaluaciones: number;
  distribucion: Array<{ categoria: RiskCategory; cantidad: number; porcentaje: number }>;
  evaluacionesSinClasificar: number;
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
    if (getRefreshToken()) return;
    clearTokens();
    endSession("expired");
  },
});

export const sprint3QueryApi = {
  searchHistory(filters: HistoryFilters = {}) {
    const params = new URLSearchParams();
    if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde);
    if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta);
    const document = filters.numeroDocumento?.trim();
    if (document) params.set("numeroDocumento", document);
    if (filters.categoria) params.set("categoria", filters.categoria);
    params.set("pagina", String(Math.max(0, Math.trunc(filters.pagina ?? 0))));
    params.set("tamano", String(Math.min(100, Math.max(1, Math.trunc(filters.tamano ?? 20)))));
    return request<HistoryPage>(`/api/v1/evaluaciones?${params.toString()}`);
  },

  getRiskDistribution() {
    return request<RiskDistribution>("/api/v1/reportes/distribucion-riesgo");
  },
};

export const isSprint3QueryConfigured = Boolean(BASE_URL);
