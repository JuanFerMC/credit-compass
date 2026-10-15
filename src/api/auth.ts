import { z } from "zod";
import { ApiRequestError, cleanBaseUrl } from "@/api/http";
import { createAuthApi } from "@/api/auth-client";
import { endSession, startSession, type SessionUser } from "@/api/session";

// Fachada de autenticación que usan las páginas (login, registro, shell).
//
//  - Con VITE_AUTH_BASE_URL: habla con el Security-Module real (auth-client.ts).
//  - Sin ella: modo demostración — sesión simulada en localStorage, igual que
//    antes de existir el backend, para poder recorrer la UI sin servicios.
//
// Las páginas no saben cuál de los dos modos está activo.

const AUTH_BASE_URL = cleanBaseUrl(import.meta.env["VITE_AUTH_BASE_URL"] as string | undefined);
export const isAuthApiConfigured = Boolean(AUTH_BASE_URL);
export const authApi = createAuthApi(AUTH_BASE_URL);

// Política de contraseña del backend (12 a 72): se valida al crear usuario o
// cambiar contraseña, NO en el login (usuarios con claves antiguas deben poder
// entrar).
export const passwordSchema = z
  .string()
  .min(12, "Usa al menos 12 caracteres")
  .max(72, "Usa como máximo 72 caracteres");

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa tu nombre"),
  email: z.string().trim().email("Ingresa un correo válido"),
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

// ---- Modo demostración ----------------------------------------------------

const DEMO_SESSION_KEY = "veridica-session";
// Se valida al leer: localStorage lo puede editar cualquiera desde las devtools.
const demoSessionSchema = z.object({ nombre: z.string(), email: z.string() });

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function demoUser(nombre: string, email: string): SessionUser {
  // Rol de administrador para que la demo muestre todos los módulos.
  return { userId: null, nombre, email, rol: "ADMINISTRADOR_RIESGO" };
}

function saveDemoSession(nombre: string, email: string) {
  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ nombre, email }));
  } catch {
    // Sin persistencia: el usuario igual entra al panel esta vez.
  }
}

function readDemoSession(): SessionUser | null {
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    const parsed = raw ? demoSessionSchema.safeParse(JSON.parse(raw)) : null;
    return parsed?.success ? demoUser(parsed.data.nombre, parsed.data.email) : null;
  } catch {
    return null;
  }
}

async function demoLogin(input: LoginInput): Promise<SessionUser> {
  await delay(500);
  const nombre = input.email.split("@")[0] ?? "Usuario";
  saveDemoSession(nombre, input.email);
  const user = demoUser(nombre, input.email);
  startSession(user);
  return user;
}

async function demoSignup(input: SignupInput): Promise<SessionUser> {
  await delay(500);
  saveDemoSession(input.nombre, input.email);
  const user = demoUser(input.nombre, input.email);
  startSession(user);
  return user;
}

function demoLogout() {
  try {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    // nada que limpiar
  }
  endSession();
}

// ---- Fachada ---------------------------------------------------------------

export const auth = {
  login: (input: LoginInput): Promise<SessionUser> =>
    isAuthApiConfigured ? authApi.login(input.email, input.password) : demoLogin(input),

  // El Security-Module NO tiene registro público: el alta la hace un
  // administrador desde el módulo de usuarios.
  signup: (input: SignupInput): Promise<SessionUser> =>
    isAuthApiConfigured
      ? Promise.reject(
          new ApiRequestError("El registro lo realiza un administrador del sistema.", 0),
        )
      : demoSignup(input),

  logout: async (): Promise<void> => {
    if (isAuthApiConfigured) await authApi.logout();
    else demoLogout();
  },

  // Se llama una vez al arrancar la app (root): decide si hay sesión.
  restore: async (): Promise<void> => {
    if (isAuthApiConfigured) {
      await authApi.restore();
      return;
    }
    const user = readDemoSession();
    if (user) startSession(user);
    else endSession();
  },
};
