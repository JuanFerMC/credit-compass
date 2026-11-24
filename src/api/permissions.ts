import type { Rol } from "@/api/roles";

/** Matriz de acceso del frontend para las rutas del panel. */
const ROUTES_BY_ROLE: Record<Rol, readonly string[]> = {
  ADMINISTRADOR_RIESGO: [
    "/panel",
    "/panel/solicitantes",
    "/panel/variables",
    "/panel/reglas",
    "/panel/politica-clasificacion",
    "/panel/historial",
    "/panel/informes",
    "/panel/usuarios",
    "/panel/cuenta",
  ],
  ANALISTA_CREDITO: [
    "/panel",
    "/panel/solicitantes",
    "/panel/politica-clasificacion",
    "/panel/evaluaciones",
    "/panel/historial",
    "/panel/distribucion-riesgo",
    "/panel/informes",
    "/panel/cuenta",
  ],
};

function normalizePanelPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export function canAccess(rol: Rol, pathname: string): boolean {
  return ROUTES_BY_ROLE[rol].includes(normalizePanelPath(pathname));
}
