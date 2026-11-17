import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { setResponseHeader } from "@tanstack/react-start/server";

import { buildCsp, generateNonce } from "./lib/csp";
import { errorPageResponse } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return errorPageResponse();
  }
});

// Content-Security-Policy con nonce POR PETICIÓN. El nonce viaja por el contexto
// de Start hasta getRouter() (src/router.tsx), que se lo pasa a TanStack.
// CSP_REPORT_ONLY=true la emite como Report-Only (el navegador registra las
// violaciones pero no bloquea): sirve para desplegarla con red de seguridad.
const cspMiddleware = createMiddleware().server(async ({ next }) => {
  const nonce = generateNonce();
  const reportOnly = typeof process !== "undefined" && process.env["CSP_REPORT_ONLY"] === "true";
  setResponseHeader(
    reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
    buildCsp({
      nonce,
      backendUrls: [
        import.meta.env["VITE_API_BASE_URL"] as string | undefined,
        import.meta.env["VITE_AUTH_BASE_URL"] as string | undefined,
        import.meta.env["VITE_EVALUATION_QUERY_BASE_URL"] as string | undefined,
      ],
    }),
  );
  return next({ context: { nonce } });
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, cspMiddleware, csrfMiddleware],
}));
