import { describe, expect, test } from "bun:test";
import {
  buildCsp,
  buildStaticPageCsp,
  generateNonce,
  originOf,
  sha256Base64,
} from "../src/lib/csp";
import { errorPageResponse, renderErrorPage } from "../src/lib/error-page";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((part) => part.startsWith(`${name} `))
    ?.slice(name.length + 1);

describe("generateNonce", () => {
  test("es base64 de 16 bytes y distinto en cada llamada", () => {
    const nonces = new Set(Array.from({ length: 200 }, () => generateNonce()));
    expect(nonces.size).toBe(200);
    for (const nonce of nonces) {
      expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    }
  });
});

describe("originOf", () => {
  test("reduce a esquema + host + puerto", () => {
    expect(originOf("http://localhost:8080/api/v1")).toBe("http://localhost:8080");
    expect(originOf("https://auth.ejemplo.com/")).toBe("https://auth.ejemplo.com");
  });
  test("devuelve null si está vacío o no es una URL", () => {
    expect(originOf(undefined)).toBeNull();
    expect(originOf("")).toBeNull();
    expect(originOf("   ")).toBeNull();
    expect(originOf("no es una url")).toBeNull();
  });
});

describe("buildCsp", () => {
  const nonce = "AAAAAAAAAAAAAAAAAAAAAA==";
  const csp = buildCsp({ nonce, backendUrls: ["http://localhost:8080", "http://localhost:8081"] });

  test("script-src NUNCA permite unsafe-inline ni unsafe-eval", () => {
    const scripts = directive(csp, "script-src") ?? "";
    expect(scripts).toBe(`'self' 'nonce-${nonce}'`);
    expect(csp).not.toContain("unsafe-eval");
    expect(directive(csp, "default-src")).toBe("'self'");
  });

  test("unsafe-inline solo existe para atributos style, no para <style> ni scripts", () => {
    const withUnsafeInline = csp.split("; ").filter((part) => part.includes("'unsafe-inline'"));
    expect(withUnsafeInline).toEqual(["style-src-attr 'unsafe-inline'"]);
  });

  test("connect-src admite solo el propio origen y los backends configurados", () => {
    expect(directive(csp, "connect-src")).toBe(
      "'self' http://localhost:8080 http://localhost:8081",
    );
  });

  test("sin duplicados y se ignoran URLs vacías o inválidas", () => {
    const value = buildCsp({
      nonce,
      backendUrls: ["http://a:1/x", "http://a:1/y", undefined, "", "basura", null],
    });
    expect(directive(value, "connect-src")).toBe("'self' http://a:1");
  });

  test("cierra objetos, base, formularios y frames", () => {
    expect(directive(csp, "object-src")).toBe("'none'");
    expect(directive(csp, "base-uri")).toBe("'self'");
    expect(directive(csp, "form-action")).toBe("'self'");
    expect(directive(csp, "frame-ancestors")).toBe("'none'");
  });

  test("rechaza un nonce con caracteres que permitirían inyectar directivas", () => {
    expect(() => buildCsp({ nonce: "x'; script-src * '" })).toThrow();
    expect(() => buildCsp({ nonce: "a b" })).toThrow();
    expect(() => buildCsp({ nonce: "" })).toThrow();
  });
});

describe("página de error de emergencia", () => {
  test("no tiene scripts ni manejadores inline (la CSP no los permite)", () => {
    const html = renderErrorPage();
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  });

  test("su CSP permite exactamente su <style>, por hash, y nada más", async () => {
    const response = await errorPageResponse();
    const html = await response.text();
    const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
    const hash = await sha256Base64(style);
    expect(response.status).toBe(500);
    expect(response.headers.get("content-security-policy")).toBe(buildStaticPageCsp([hash]));
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("content-security-policy")).not.toContain("script-src");
  });
});
