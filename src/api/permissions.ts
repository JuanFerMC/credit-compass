import type { Rol } from "@/api/roles";

const ADMIN_ONLY: readonly Rol[] = ["ADMINISTRADOR_RIESGO"];
const ROUTE_ROLES: ReadonlyArray<readonly [prefix: string, roles: readonly Rol[]]> = [
  ["/panel/usuarios", ADMIN_ONLY],
  ["/panel/variables", ADMIN_ONLY],
  ["/panel/reglas", ADMIN_ONLY],
];
export function canAccess(rol: Rol, pathname: string): boolean {
  const rule = ROUTE_ROLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return rule ? rule[1].includes(rol) : true;
}
