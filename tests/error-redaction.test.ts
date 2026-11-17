import { describe, expect, test } from "bun:test";
import { describeError } from "../src/lib/error-capture";
import { reportLovableError } from "../src/lib/lovable-error-reporting";

describe("error logging redaction", () => {
  test("redacts bearer credentials from error messages and stacks", () => {
    const error = new Error("Request failed: Authorization: Bearer access-secret");
    error.stack = "Error: refreshToken=refresh-secret";

    const result = describeError(error);

    expect(result).not.toContain("access-secret");
    expect(result).not.toContain("refresh-secret");
    expect(result).toContain("[REDACTED]");
    expect(result).toContain("Error");
  });

  test("redacts tokens in structured non-Error log arguments", () => {
    const error = new Error("status 401");
    error.cause = {
      authorization: "Bearer nested-secret",
      details: "refresh_token=refresh-secret",
    };

    const result = describeError(error);

    expect(result).not.toContain("nested-secret");
    expect(result).not.toContain("refresh-secret");
  });
});

describe("reportLovableError", () => {
  test("sends sanitized error and context to external telemetry", () => {
    let capturedError: unknown;
    let capturedContext: Record<string, unknown> | undefined;
    let runtimePayload: { message: string; stack?: string } | undefined;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/panel" },
        __lovableEvents: {
          captureException: (error: unknown, context?: Record<string, unknown>) => {
            capturedError = error;
            capturedContext = context;
          },
        },
        __lovableReportRuntimeError: (payload: { message: string; stack?: string }) => {
          runtimePayload = payload;
        },
      },
    });

    try {
      const error = new Error("refreshToken=private-refresh");
      error.stack = "Error: Authorization: Bearer private-access";

      reportLovableError(error, {
        request: { accessToken: "private-access", status: 500 },
      });

      expect(capturedError).toBeInstanceOf(Error);
      expect((capturedError as Error).message).not.toContain("private-refresh");
      expect((capturedError as Error).stack).not.toContain("private-access");
      expect(capturedContext?.request).toEqual({
        accessToken: "[REDACTED]",
        status: 500,
      });
      expect(runtimePayload?.message).not.toContain("private-refresh");
      expect(runtimePayload?.stack).not.toContain("private-access");
    } finally {
      Reflect.deleteProperty(globalThis, "window");
    }
  });
});
