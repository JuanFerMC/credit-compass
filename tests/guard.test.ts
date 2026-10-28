import { describe, expect, test } from "bun:test";
import { decideGuard, safeRedirect } from "../src/api/guard";
import type { SessionState } from "../src/api/session";

const restoring: SessionState = { status: "restoring", user: null };
const anonymous: SessionState = { status: "anonymous", user: null, reason: null };
const admin: SessionState = {
  status: "authenticated",
  user: {
    userId: 1,
    nombre: "Administradora",
    email: "admin@example.com",
    rol: "ADMINISTRADOR_RIESGO",
  },
};
const analyst: SessionState = {
  status: "authenticated",
  user: {
    userId: 2,
    nombre: "Analista",
    email: "analista@example.com",
    rol: "ANALISTA_CREDITO",
  },
};

describe("decideGuard", () => {
  test("permite modo demo aunque no haya sesión restaurada", () => {
    expect(decideGuard({ authConfigured: false, session: restoring, pathname: "/panel" })).toEqual({
      type: "allow",
    });
  });

  test("espera a resolver la sesión antes de mostrar o redirigir", () => {
    expect(decideGuard({ authConfigured: true, session: restoring, pathname: "/panel" })).toEqual({
      type: "loading",
    });
  });

  test("anónimo va al login, y señala si la sesión expiró", () => {
    expect(decideGuard({ authConfigured: true, session: anonymous, pathname: "/panel" })).toEqual({
      type: "login",
      expired: false,
    });
    expect(
      decideGuard({
        authConfigured: true,
        session: { ...anonymous, reason: "expired" },
        pathname: "/panel",
      }),
    ).toEqual({ type: "login", expired: true });
  });

  test("logout regresa a la página inicial", () => {
    expect(
      decideGuard({
        authConfigured: true,
        session: { ...anonymous, reason: "logout" },
        pathname: "/panel",
      }),
    ).toEqual({ type: "home" });
  });

  test("administra configuración y no abre evaluaciones", () => {
    expect(
      decideGuard({ authConfigured: true, session: admin, pathname: "/panel/reglas" }),
    ).toEqual({ type: "allow" });
    expect(
      decideGuard({ authConfigured: true, session: admin, pathname: "/panel/evaluaciones" }),
    ).toEqual({ type: "forbidden" });
  });

  test("analista abre evaluaciones y no administra reglas", () => {
    expect(
      decideGuard({ authConfigured: true, session: analyst, pathname: "/panel/evaluaciones" }),
    ).toEqual({ type: "allow" });
    expect(
      decideGuard({ authConfigured: true, session: analyst, pathname: "/panel/reglas" }),
    ).toEqual({ type: "forbidden" });
  });

  test("normaliza la barra final de las rutas asignadas", () => {
    expect(
      decideGuard({ authConfigured: true, session: analyst, pathname: "/panel/evaluaciones/" }),
    ).toEqual({ type: "allow" });
    expect(decideGuard({ authConfigured: true, session: admin, pathname: "/panel/" })).toEqual({
      type: "allow",
    });
  });
});

describe("safeRedirect", () => {
  test.each([
    ["ruta interna", "/panel/evaluaciones", "/panel/evaluaciones"],
    ["índice", "/panel", "/panel"],
    ["barra final", "/panel/", undefined],
    ["URL externa", "https://evil.example", undefined],
    ["ruta protocol-relative", "//evil.example", undefined],
    ["traversal", "/panel/../admin", undefined],
    ["segmento vacío", "/panel//admin", undefined],
    ["query string", "/panel/evaluaciones?x=1", undefined],
    ["otro módulo", "/usuarios", undefined],
    ["tipo incorrecto", 42, undefined],
  ])("valida %s", (_label, input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });
});
