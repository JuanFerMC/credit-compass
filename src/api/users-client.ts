import { z } from "zod";
import { ApiRequestError } from "@/api/http";
import { passwordSchema } from "@/api/password-schema";
import { ROLE_ID, ROLES } from "@/api/roles";

// Usuarios del Security-Module (INTEGRACION_FRONTEND.md §4.2). Es una fábrica
// sobre un `request` inyectado (el autenticado de `authApi`: lleva el Bearer,
// renueva la sesión ante un 401 y reintenta una vez) para poder probarla contra
// un servidor falso; `users.ts` la instancia con el cliente real.
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

// `Usuario`: nunca trae contraseñas ni hashes. No se confía en la forma de la
// respuesta: se valida.
export const userSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  email: z.string(),
  rolNombre: z.string(),
  activo: z.boolean(),
  fechaCreacion: z.string().nullish(),
  fechaModificacion: z.string().nullish(),
});
export type User = z.infer<typeof userSchema>;

// Alta de usuario. El formulario trabaja con el nombre del rol; el backend pide
// `idRol` numérico (no hay endpoint de roles: ver roles.ts).
export const createUserSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa el nombre").max(150, "Máximo 150 caracteres"),
  email: z.string().trim().email("Ingresa un correo válido").max(255, "Máximo 255 caracteres"),
  password: passwordSchema,
  rol: z.enum(ROLES, { message: "Selecciona un rol" }),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

// Restablecer la contraseña de otro usuario (solo administrador): no lleva
// `currentPassword`.
export const resetPasswordSchema = z
  .object({ newPassword: passwordSchema, confirm: z.string() })
  .refine((value) => value.newPassword === value.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function invalidResponse(): never {
  throw new ApiRequestError("La respuesta del servicio de usuarios no es válida.", 0);
}

function parseUser(raw: unknown): User {
  const parsed = userSchema.safeParse(raw);
  return parsed.success ? parsed.data : invalidResponse();
}

export function createUsersApi(request: Request) {
  return {
    async list(): Promise<User[]> {
      const parsed = z.array(userSchema).safeParse(await request<unknown>("/api/v1/usuarios"));
      return parsed.success ? parsed.data : invalidResponse();
    },

    async create(input: CreateUserInput): Promise<User> {
      const raw = await request<unknown>("/api/v1/usuarios", {
        method: "POST",
        body: JSON.stringify({
          nombre: input.nombre,
          email: input.email,
          password: input.password,
          idRol: ROLE_ID[input.rol],
        }),
      });
      return parseUser(raw);
    },

    // Desactivar invalida sus tokens de inmediato y le impide volver a entrar.
    async setActive(id: number, activo: boolean): Promise<User> {
      const raw = await request<unknown>(`/api/v1/usuarios/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      });
      return parseUser(raw);
    },

    // 204 sin cuerpo. Un administrador no envía `currentPassword`.
    async resetPassword(id: number, newPassword: string): Promise<void> {
      await request<void>(`/api/v1/usuarios/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword }),
      });
    },
  };
}
