import { redactError, redactSensitiveData, redactSensitiveText } from "./sensitive-data-redaction";

type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Never pass the original Error or context to external telemetry: either may
  // contain request headers, JWTs, refresh tokens or credentials in its stack.
  const safeError = redactError(error);
  const safeContext = redactSensitiveData({
    source: "react_error_boundary",
    route: window.location.pathname,
    ...context,
  }) as Record<string, unknown>;

  window.__lovableEvents?.captureException?.(
    safeError,
    safeContext,
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );

  // Forward sanitized diagnostics only to the editor-preview reporting hook.
  // Loaders and server functions commonly throw a raw Response; preserve its
  // status while sanitizing its URL in case it contains sensitive query params.
  const message =
    error instanceof Response
      ? redactSensitiveText(`Response ${error.status}${error.url ? ` at ${error.url}` : ""}`)
      : error instanceof Error
        ? redactSensitiveText(error.message)
        : redactSensitiveText(String(redactSensitiveData(error)));
  const stack = error instanceof Error && error.stack
    ? redactSensitiveText(error.stack)
    : undefined;

  window.__lovableReportRuntimeError?.({
    message,
    ...(stack !== undefined && { stack }),
    filename: window.location.pathname,
  });
}
