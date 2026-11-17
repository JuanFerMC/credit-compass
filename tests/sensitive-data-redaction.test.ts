import { describe, expect, test } from "bun:test";
import {
  redactError,
  redactSensitiveData,
  redactSensitiveText,
} from "../src/lib/sensitive-data-redaction";

describe("redactSensitiveText", () => {
  test("oculta credenciales Bearer sin eliminar el contexto", () => {
    expect(redactSensitiveText("Request failed with Authorization: Bearer abc.def.ghi")).toBe(
      "Request failed with Authorization: [REDACTED]",
    );
  });

  test("oculta tokens y contraseñas en estructuras serializadas", () => {
    const value = '{"accessToken":"access-secret","refresh_token":"refresh-secret","password":"pass-secret"}';
    const result = redactSensitiveText(value);

    expect(result).not.toContain("access-secret");
    expect(result).not.toContain("refresh-secret");
    expect(result).not.toContain("pass-secret");
    expect(result.match(/\[REDACTED\]/g)).toHaveLength(3);
  });

  test("oculta JWT completos y parámetros sensibles de URL", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signatureValue123";
    const result = redactSensitiveText(`/callback?access_token=abc123&state=ok ${jwt}`);

    expect(result).not.toContain("abc123");
    expect(result).not.toContain(jwt);
    expect(result).toContain("state=ok");
  });

  test("no altera mensajes técnicos que no contienen secretos", () => {
    expect(redactSensitiveText("Request failed with status 503; traceId=trace-123")).toBe(
      "Request failed with status 503; traceId=trace-123",
    );
  });
});

describe("redactSensitiveData", () => {
  test("redacta propiedades sensibles y valores anidados", () => {
    const result = redactSensitiveData({
      status: 401,
      accessToken: "secret-access",
      nested: { refresh_token: "secret-refresh", message: "Bearer secret-bearer" },
    }) as Record<string, unknown>;

    expect(result.status).toBe(401);
    expect(result.accessToken).toBe("[REDACTED]");
    expect(result.nested).toEqual({
      refresh_token: "[REDACTED]",
      message: "Bearer [REDACTED]",
    });
  });

  test("maneja referencias circulares", () => {
    const value: Record<string, unknown> = { status: "failed" };
    value.self = value;

    expect(redactSensitiveData(value)).toEqual({
      status: "failed",
      self: "[Circular]",
    });
  });

  test("devuelve errores con mensaje y stack saneados", () => {
    const error = new Error("refreshToken=refresh-secret");
    error.stack = "Error: Authorization: Bearer bearer-secret";

    const result = redactSensitiveData(error) as { message: string; stack: string };

    expect(result.message).not.toContain("refresh-secret");
    expect(result.stack).not.toContain("bearer-secret");
  });
});

describe("redactError", () => {
  test("crea una instancia de Error sin conservar el mensaje sensible", () => {
    const result = redactError(new Error("accessToken=private-value"));

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe("accessToken=[REDACTED]");
    expect((result as Error).message).not.toContain("private-value");
  });

  test("sanea también valores que no son instancias Error", () => {
    expect(redactError({ refreshToken: "private-value" })).toEqual({
      refreshToken: "[REDACTED]",
    });
  });
});
