import { authApi } from "@/api/auth";
import type { Rol } from "@/api/roles";
import type { ManagedUser } from "@/api/users";

/** Cambia el rol de una cuenta administrada. El backend valida el permiso ADMINISTRADOR_RIESGO. */
export async function changeManagedUserRole(id: number, rol: Rol): Promise<ManagedUser> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("El identificador del usuario debe ser un entero positivo.");
  }
  const response = await authApi.request<ManagedUser>(`/api/v1/usuarios/${id}/rol`, {
    method: "PATCH",
    body: JSON.stringify({ rolNombre: rol }),
  });
  return response;
}
