import { z } from "zod";

// El backend (motor-scoring-crediticio) todavía no expone endpoints de
// autenticación — no hay ningún controlador de usuarios/sesión en `main`
// (ver AGENTS.md). Este módulo simula login/registro localmente
// (localStorage) para poder mostrar el flujo completo de la UI ahora
// mismo, con la MISMA forma que src/lib/api.ts (schemas zod + funciones
// async) para que, cuando el backend publique /api/v1/auth/..., sea un
// cambio quirúrgico: reemplazar el cuerpo de login()/signup()/logout()
// por llamadas a `request()` de api.ts, sin tocar las páginas que los usan.

const SESSION_KEY = "veridica-session";

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido"),
  password: z.string().min(6, "Usa al menos 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa tu nombre"),
  email: z.string().trim().email("Ingresa un correo válido"),
  password: z.string().min(6, "Usa al menos 6 caracteres"),
});
export type SignupInput = z.infer<typeof signupSchema>;

// Se valida al leer: localStorage lo puede editar cualquiera desde las
// devtools, así que nunca se asume que lo guardado tiene la forma esperada.
const sessionSchema = z.object({ nombre: z.string(), email: z.string() });
export type Session = z.infer<typeof sessionSchema>;

// localStorage puede lanzar (modo privado, cuota llena, políticas del
// navegador): la sesión demo es "best effort" y no debe romper el login.
function saveSession(session: Session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Sin persistencia: el usuario igual entra al panel esta vez.
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const auth = {
  // Demo: no valida contra ningún backend, solo simula latencia y guarda
  // una sesión local. Cuando exista POST /api/v1/auth/login, reemplazar
  // el cuerpo por `request<Session>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) })`.
  async login(input: LoginInput): Promise<Session> {
    await delay(500);
    const session: Session = { nombre: input.email.split("@")[0] ?? "Usuario", email: input.email };
    saveSession(session);
    return session;
  },
  // Demo: ídem, para cuando exista POST /api/v1/auth/registro.
  async signup(input: SignupInput): Promise<Session> {
    await delay(500);
    const session: Session = { nombre: input.nombre, email: input.email };
    saveSession(session);
    return session;
  },
  logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  },
  getSession(): Session | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      const parsed = raw ? sessionSchema.safeParse(JSON.parse(raw)) : null;
      return parsed?.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
};

// true en cuanto exista un endpoint real de autenticación — hoy siempre
// false, así que las páginas de login/registro muestran el aviso de modo
// demostrativo (mismo patrón que isApiConfigured en api.ts).
export const isAuthApiConfigured = false;
