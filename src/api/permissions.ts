import type { Rol } from "@/api/roles";

/**
 * Matriz de acceso del frontend para las rutas del panel.
 *
 * Administrador: acceso a todos los módulos.
 * Analista: operación diaria (panel, solicitantes, evaluaciones e informes)
 * y gestión de su propia cuenta; no administra usuarios ni configura el modelo.
 *
 * Esta matriz controla la navegación y el guard de rutas. No sustituye los
 * permisos del backend, pero evita que la UI dependa de un permiso por defecto.
 */
const ROUTES_BY_ROLE: Record<Rol, readonly string[]> = {
  ADMINISTRADOR_RIESGO: [
    "/panel",
    "/panel/solicitantes",
    "/panel/variables",
    "/panel/reglas",
    "/panel/evaluaciones",
    "/panel/informes",
    "/panel/usuarios",
    "/panel/cuenta",
  ],
  ANALISTA_CREDITO: [
    "/panel",
    "/panel/solicitantes",
    "/panel/evaluaciones",
    "/panel/informes",
    "/panel/cuenta",
  ],
};

function normalizePanelPath(pathname: string): string {
  // TanStack Router puede presentar el índice como /panel o /panel/.
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export function canAccess(rol: Rol, pathname: string): boolean {
  const path = normalizePanelPath(pathname);
  // Solo se permite una ruta explícitamente asignada al rol. Rutas nuevas
  // quedan ocultas/bloqueadas hasta decidir su lugar en la matriz.
  return ROUTES_BY_ROLE[rol].includes(path);
}
