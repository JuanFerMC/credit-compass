import { z } from "zod";
import { ApiRequestError, createHttpClient } from "@/api/http";
import { parseRol } from "@/api/roles";
import { endSession, getSessionState, startSession, type SessionUser } from "@/api/session";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/api/token-store";

// Cliente del Security-Module (:8081). Es una fábrica (`createAuthApi`) y no un
// singleton con `import.meta.env` adentro para que se pueda probar contra un
// servidor falso; `auth.ts` la instancia con la URL real.

const NOT_CONFIGURED = "El servicio de autenticación no está configurado.";

// No se confía en la forma de lo que responde el backend (ni en el rol).
const loginResponseSchema = z.object({
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  rol: z.string(),
});
const validateSchema = z.object({ userId: z.number(), email: z.string(), rol: z.string() });
const profileSchema = z.object({ nombre: z.string() });

export function createAuthApi(baseUrl: string | undefined) {
  // Endpoints públicos (login / refresh / logout): sin token ni reintento.
  const publicRequest = createHttpClient({ baseUrl, notConfiguredMessage: NOT_CONFIGURED });

  // Una sola renovación en vuelo: si varias peticiones reciben 401 a la vez
  // comparten la misma promesa. Usar dos veces el mismo refresh token el
  // backend lo interpreta como robo y revoca TODA la sesión.
  let refreshing: Promise<boolean> | null = null;
  function refreshTokens(): Promise<boolean> {
    refreshing ??= (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      try {
        const raw = await publicRequest<unknown>("/api/v1/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
        const parsed = loginResponseSchema.safeParse(raw);
        if (!parsed.success || !parseRol(parsed.data.rol)) {
          clearTokens();
          return false;
        }
        setTokens(parsed.data); // reemplaza AMBOS tokens
        return true;
      } catch (error) {
        // 401 = refresh vencido/usado/revocado → sesión terminada. Un fallo de
        // red no invalida el refresh token, pero la petición original igual
        // no pudo completarse.
        if (error instanceof ApiRequestError && error.status === 401) clearTokens();
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  // Peticiones autenticadas: Bearer + renovación y un único reintento ante 401.
  const request = createHttpClient({
    baseUrl,
    notConfiguredMessage: NOT_CONFIGURED,
    getToken: getAccessToken,
    refreshSession: refreshTokens,
    onUnauthorized: () => {
      clearTokens();
      endSession();
    },
  });

  // El login no devuelve el id ni el nombre: GET /auth/validate da
  // { userId, email, rol } y GET /usuarios/{id} el nombre.
  async function loadUser(): Promise<SessionUser> {
    const me = validateSchema.safeParse(await request<unknown>("/api/v1/auth/validate"));
    const rol = me.success ? parseRol(me.data.rol) : null;
    if (!me.success || !rol) {
      throw new ApiRequestError("La respuesta de autenticación no es válida.", 0);
    }
    let nombre = me.data.email.split("@")[0] ?? me.data.email;
    try {
      const profile = profileSchema.safeParse(
        await request<unknown>(`/api/v1/usuarios/${me.data.userId}`),
      );
      if (profile.success) nombre = profile.data.nombre;
    } catch {
      // El nombre es cosmético: si falla, se usa la parte local del correo.
    }
    return { userId: me.data.userId, nombre, email: me.data.email, rol };
  }

  async function login(email: string, password: string): Promise<SessionUser> {
    const raw = await publicRequest<unknown>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const parsed = loginResponseSchema.safeParse(raw);
    if (!parsed.success || !parseRol(parsed.data.rol)) {
      throw new ApiRequestError("La respuesta de autenticación no es válida.", 0);
    }
    setTokens(parsed.data);
    try {
      const user = await loadUser();
      startSession(user);
      return user;
    } catch (error) {
      clearTokens();
      endSession();
      throw error;
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    // Se limpia primero en local: la UI nunca queda "colgada" si el backend no
    // responde. El endpoint es idempotente y su fallo no debe impedir salir.
    clearTokens();
    endSession();
    if (refreshToken) {
      await publicRequest<void>("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
  }

  // Al cargar la página el access token (memoria) se perdió: si hay refresh
  // token en sessionStorage se renueva para restaurar la sesión.
  let restoring: Promise<void> | null = null;
  function restore(): Promise<void> {
    if (getSessionState().status === "authenticated") return Promise.resolve();
    restoring ??= (async () => {
      if (!getRefreshToken() || !(await refreshTokens())) {
        endSession();
        return;
      }
      try {
        startSession(await loadUser());
      } catch {
        clearTokens();
        endSession();
      }
    })().finally(() => {
      restoring = null;
    });
    return restoring;
  }

  return { request, login, logout, restore, refreshTokens };
}
