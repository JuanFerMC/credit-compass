// Content-Security-Policy de la app. Todo aquí es puro (sin acceso a la
// request ni al entorno) para poder probarlo con `bun test`.
//
// Política:
//  - scripts: 'self' + nonce por petición. NO hay 'unsafe-inline' ni 'unsafe-eval':
//    un XSS que inyecte un <script> o un onclick="…" no se ejecuta. TanStack Start
//    estampa el nonce en sus scripts inline de hidratación (router `ssr.nonce`).
//  - estilos: 'self' + nonce + Google Fonts. `style-src-attr 'unsafe-inline'`
//    solo cubre atributos style="…" (la app tiene 2, p. ej. el ancho de las
//    barras); no permite <style> inline ni hojas externas ajenas.
//  - connect-src: solo el propio origen y los backends configurados.
//  - object-src / base-uri / form-action / frame-ancestors cerrados.

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Origen (esquema + host + puerto) de una URL de entorno; null si está vacía o
// no es una URL válida. connect-src se escribe por origen, no por ruta.
export function originOf(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  try {
    const { origin } = new URL(url.trim());
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

export type CspOptions = {
  nonce: string;
  // URLs base de los backends (Scoring, Security-Module, Evaluation-Query…).
  backendUrls?: ReadonlyArray<string | undefined | null>;
};

export function buildCsp({ nonce, backendUrls = [] }: CspOptions): string {
  // El nonce se estampa en atributos y cabeceras: solo base64 es válido.
  if (!/^[A-Za-z0-9+/=]+$/.test(nonce)) throw new Error("nonce inválido para la CSP");

  const connectSrc = [
    "'self'",
    ...new Set(backendUrls.map(originOf).filter((origin): origin is string => origin !== null)),
  ];

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

// CSP de una página ESTÁTICA (la de error de emergencia): sin nonce, solo se
// permite su <style> exacto, identificado por hash. No ejecuta ningún script.
export function buildStaticPageCsp(styleHashes: readonly string[]): string {
  return [
    "default-src 'none'",
    `style-src ${styleHashes.map((hash) => `'sha256-${hash}'`).join(" ")}`,
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  let binary = "";
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
