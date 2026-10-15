// Roles del Security-Module (HU08). El backend es quien hace cumplir los
// permisos (responde 403); el front solo oculta lo que el rol no puede usar.

export const ROLES = ["ADMINISTRADOR_RIESGO", "ANALISTA_CREDITO"] as const;
export type Rol = (typeof ROLES)[number];

// El backend no expone un endpoint para listar roles: `idRol` es numérico y el
// mapa se fija aquí (en una base creada por las migraciones: 1 y 2). Es una
// limitación conocida del backend (INTEGRACION_FRONTEND.md, sección 9).
export const ROLE_ID: Record<Rol, number> = {
  ADMINISTRADOR_RIESGO: 1,
  ANALISTA_CREDITO: 2,
};

export const ROLE_LABEL: Record<Rol, string> = {
  ADMINISTRADOR_RIESGO: "Administrador de riesgo",
  ANALISTA_CREDITO: "Analista de crédito",
};

export function parseRol(value: unknown): Rol | null {
  return ROLES.find((rol) => rol === value) ?? null;
}

export function isAdmin(rol: Rol | null | undefined): boolean {
  return rol === "ADMINISTRADOR_RIESGO";
}
