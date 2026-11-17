import { afterEach, describe, expect, test } from "bun:test";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../src/api/token-store";

type StorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function installWindow(sessionStorage: StorageMock, localStorage: StorageMock) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage, localStorage },
  });
}

function createStorage(): StorageMock & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

afterEach(() => {
  clearTokens();
  Reflect.deleteProperty(globalThis, "window");
});

describe("token-store", () => {
  test("mantiene el access token en memoria y el refresh token en sessionStorage", () => {
    const session = createStorage();
    const local = createStorage();
    installWindow(session, local);

    setTokens({ token: "access-memory-only", refreshToken: "refresh-session-only" });

    expect(getAccessToken()).toBe("access-memory-only");
    expect(session.values.get("veridica-refresh-token")).toBe("refresh-session-only");
    expect(local.values.size).toBe(0);
  });

  test("no accede a localStorage al guardar, leer ni limpiar tokens", () => {
    const session = createStorage();
    const forbiddenLocalStorage: StorageMock = {
      getItem: () => {
        throw new Error("localStorage no debe consultarse");
      },
      setItem: () => {
        throw new Error("localStorage no debe utilizarse");
      },
      removeItem: () => {
        throw new Error("localStorage no debe limpiarse");
      },
    };
    installWindow(session, forbiddenLocalStorage);

    setTokens({ token: "access-token", refreshToken: "refresh-token" });

    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
    expect(() => clearTokens()).not.toThrow();
  });

  test("usa el respaldo en memoria cuando sessionStorage está bloqueado", () => {
    const blockedStorage: StorageMock = {
      getItem: () => {
        throw new Error("storage bloqueado");
      },
      setItem: () => {
        throw new Error("storage bloqueado");
      },
      removeItem: () => {
        throw new Error("storage bloqueado");
      },
    };
    installWindow(blockedStorage, createStorage());

    setTokens({ token: "access-memory", refreshToken: "refresh-memory" });

    expect(getAccessToken()).toBe("access-memory");
    expect(getRefreshToken()).toBe("refresh-memory");
    expect(() => clearTokens()).not.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  test("funciona durante SSR cuando window no está disponible", () => {
    setTokens({ token: "access-ssr", refreshToken: "refresh-ssr" });

    expect(getAccessToken()).toBe("access-ssr");
    expect(getRefreshToken()).toBe("refresh-ssr");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
