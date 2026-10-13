// Almacén del JWT emitido por el Security-Module.
//
// sessionStorage (no localStorage): el token se descarta al cerrar la
// pestaña, lo que acota cuánto vive un token robado por XSS. El JWT dura 1 h
// por defecto, así que no hace falta persistirlo entre sesiones del navegador.
// Cualquiera puede editar este valor desde las devtools: el backend es quien
// valida el token en cada petición, el front nunca lo da por bueno.

const TOKEN_KEY = "veridica-token";

export function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // SSR o almacenamiento bloqueado
  }
}

export function setToken(token: string): void {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sin persistencia: la sesión vive solo mientras no se recargue la página.
  }
}

export function clearToken(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // nada que limpiar
  }
}
