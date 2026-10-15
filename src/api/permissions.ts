import type { Rol } from "@/api/roles";

// Qué rol puede abrir cada sección del panel.
//
// IMPORTANTE: esto es solo UX (ocultar y bloquear pantallas). El Security-Module
// define permisos para SUS endpoints (usuarios) y los hace cumplir con 403; el
// Motor de Scoring hoy no valida roles (permitAll). Es una decisión de producto
// confirmable con el equipo: el reparto por defecto es que quien CONFIGURA el
// modelo de riesgo (variables y reglas) es el administrador, y el analista
// opera (solicitantes, evaluaciones, informes). Cambiarlo es editar esta tabla.
const ADMIN_ONLY: readonly Rol[] = ["ADMINISTRADOR_RIESGO"];

// Prefijos más específicos primero; lo que no está aquí es para cualquier rol.
const ROUTE_ROLES: ReadonlyArray<readonly [prefix: string, roles: readonly Rol[]]> = [
  ["/panel/usuarios", ADMIN_ONLY],
  ["/panel/variables", ADMIN_ONLY],
  ["/panel/reglas", ADMIN_ONLY],
];

export function canAccess(rol: Rol, pathname: string): boolean {
  const rule = ROUTE_ROLES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return rule ? rule[1].includes(rol) : true;
}
