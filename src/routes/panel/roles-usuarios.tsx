import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { usersApi, type ManagedUser } from "@/api/users";
import { changeManagedUserRole } from "@/api/user-role";
import { ROLE_LABEL, ROLES, type Rol, isAdmin } from "@/api/roles";
import { useRol } from "@/api/use-rol";
import { ApiRequestError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/shared/page";

export const Route = createFileRoute("/panel/roles-usuarios")({
  head: () => ({ meta: [{ title: "Roles de usuarios — Veridica" }] }),
  component: UserRolesPage,
});

function UserRolesPage() {
  const currentRole = useRol();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await usersApi.list());
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "No fue posible consultar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin(currentRole)) void load();
  }, [currentRole, load]);

  async function updateRole(user: ManagedUser, role: Rol) {
    if (user.rolNombre === role) return;
    setSavingId(user.id);
    setError("");
    setNotice("");
    try {
      const updated = await changeManagedUserRole(user.id, role);
      setUsers(current => current.map(item => item.id === user.id ? updated : item));
      setNotice(`Rol actualizado para ${user.nombre}.`);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "No fue posible cambiar el rol.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Administración" title="Roles de usuarios" description="Asigna el perfil de administrador o analista a las cuentas registradas." action={<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || !isAdmin(currentRole)}><RefreshCw className="size-4" />Actualizar</Button>} />
      {!isAdmin(currentRole) ? <p className="rounded-lg border p-4 text-sm">Esta operación está disponible únicamente para administradores.</p> : (
        <Panel className="overflow-hidden">
          {error && <p role="alert" className="m-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="m-4 rounded-lg border p-3 text-sm">{notice}</p>}
          {loading && users.length === 0 ? <p className="p-6 text-sm">Consultando usuarios…</p> : users.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No hay usuarios registrados.</p> : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[620px] text-left text-sm">
                <thead><tr><th>Usuario</th><th>Correo</th><th>Rol actual</th><th>Estado</th></tr></thead>
                <tbody>{users.map(user => <tr key={user.id}>
                  <td className="font-semibold">{user.nombre}</td>
                  <td>{user.email}</td>
                  <td><label className="sr-only" htmlFor={`role-${user.id}`}>Rol de {user.nombre}</label>
                    <select id={`role-${user.id}`} className="form-control min-w-52" value={ROLES.includes(user.rolNombre as Rol) ? user.rolNombre : ""} disabled={savingId === user.id || !user.activo} onChange={event => void updateRole(user, event.target.value as Rol)}>
                      {!ROLES.includes(user.rolNombre as Rol) && <option value="">Rol desconocido</option>}
                      {ROLES.map(role => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
                    </select>
                  </td>
                  <td>{user.activo ? "Activo" : "Inactivo"}</td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          <p className="flex items-start gap-2 border-t p-4 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />El Security-Module valida la autorización y persiste el cambio de rol.</p>
        </Panel>
      )}
    </>
  );
}
