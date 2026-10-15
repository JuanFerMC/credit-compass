// Almacén de tokens del Security-Module (guía de integración, sección 8).
//
//  - access token (15 min): SOLO en memoria. Se pierde al recargar la página
//    y se recupera renovando con el refresh token (ver auth-client.ts).
//  - refresh token (7 días, un solo uso): sessionStorage, no localStorage —
//    con varias pestañas compartiendo localStorage se reutilizaría el mismo
//    refresh token y el backend lo interpreta como robo (revoca la sesión).
//
// Cualquiera puede editar sessionStorage desde las devtools: el backend valida
// cada token, el front nunca lo da por bueno.

const REFRESH_KEY = "veridica-refresh-token";

let accessToken: string | null = null;
let refreshTokenInMemory: string | null = null; // respaldo si sessionStorage falla

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  try {
    return window.sessionStorage.getItem(REFRESH_KEY) ?? refreshTokenInMemory;
  } catch {
    return refreshTokenInMemory; // SSR o almacenamiento bloqueado
  }
}

export function setTokens(tokens: { token: string; refreshToken: string }): void {
  accessToken = tokens.token;
  refreshTokenInMemory = tokens.refreshToken;
  try {
    window.sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    // Sin persistencia: la sesión vive solo hasta recargar la página.
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshTokenInMemory = null;
  try {
    window.sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    // nada que limpiar
  }
}
