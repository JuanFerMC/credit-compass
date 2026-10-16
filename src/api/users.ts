import { z } from "zod";
import { authApi } from "@/api/auth";
import { passwordSchema } from "@/api/auth";

export const createManagedUserSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre").max(150, "Máximo 150 caracteres"),
  email: z.string().trim().email("Ingresa un correo válido").max(255, "Máximo 255 caracteres"),
  password: passwordSchema,
});
export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newPassword: passwordSchema,
});
export const resetUserPasswordSchema = z.object({ newPassword: passwordSchema });
export type ManagedUserInput = z.infer<typeof createManagedUserSchema>;
export type ManagedUser = {
  id: number; nombre: string; email: string; rolNombre: string; activo: boolean;
  fechaCreacion: string | null; fechaModificacion: string | null;
};
const userSchema = z.object({
  id: z.number(), nombre: z.string(), email: z.string(), rolNombre: z.string(),
  activo: z.boolean(), fechaCreacion: z.string().nullable().optional(),
  fechaModificacion: z.string().nullable().optional(),
});
function parseUser(value: unknown): ManagedUser {
  const parsed = userSchema.parse(value);
  return { ...parsed, fechaCreacion: parsed.fechaCreacion ?? null, fechaModificacion: parsed.fechaModificacion ?? null };
}
export const usersApi = {
  async list(): Promise<ManagedUser[]> {
    return z.array(userSchema).parse(await authApi.request<unknown>("/api/v1/usuarios")).map(parseUser);
  },
  async createAnalyst(input: ManagedUserInput): Promise<ManagedUser> {
    return parseUser(await authApi.request<unknown>("/api/v1/usuarios", {
      method: "POST", body: JSON.stringify({ ...input, idRol: 2 }),
    }));
  },
  async setActive(id: number, activo: boolean): Promise<ManagedUser> {
    return parseUser(await authApi.request<unknown>(`/api/v1/usuarios/${id}/estado`, {
      method: "PATCH", body: JSON.stringify({ activo }),
    }));
  },
  async resetPassword(id: number, newPassword: string): Promise<void> {
    await authApi.request<void>(`/api/v1/usuarios/${id}/password`, {
      method: "PATCH", body: JSON.stringify({ newPassword }),
    });
  },
  async changeOwnPassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    await authApi.request<void>(`/api/v1/usuarios/${id}/password`, {
      method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
