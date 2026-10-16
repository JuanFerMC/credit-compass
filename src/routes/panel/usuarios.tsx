import { createFileRoute } from "@tanstack/react-router";
import { Eye, KeyRound, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { ROLE_LABEL, ROLES, type Rol } from "@/api/roles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { isAuthApiConfigured } from "@/api/auth";
import { ApiRequestError } from "@/api/http";
import {
  createManagedUserSchema,
  resetUserPasswordSchema,
  usersApi,
  type ManagedUser,
} from "@/api/users";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { fieldA11y, zodErrors } from "@/lib/forms";

export const Route = createFileRoute("/panel/usuarios")({
  head: () => ({ meta: [{ title: "Gestión de usuarios — Veridica" }] }),
  component: UsersPage,
});

const emptyForm = {
  nombre: "",
  email: "",
  password: "",
  rol: "ANALISTA_CREDITO" as Rol,
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetId, setResetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);

  const loadUsers = useCallback(async () => {
    if (!isAuthApiConfigured) return;
    setLoading(true);
    setError("");
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "No fue posible cargar los usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function openDetails(user: ManagedUser) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailUser(null);
    try {
      setDetailUser(await usersApi.getById(user.id));
    } catch (err) {
      setDetailError(
        err instanceof ApiRequestError
          ? err.message
          : "No fue posible consultar el detalle del usuario.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setError("");
    const parsed = createManagedUserSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const created = await usersApi.create(parsed.data);
      setUsers((current) => [
        created,
        ...current.filter((user) => user.id !== created.id),
      ]);
      setForm(emptyForm);
      setNotice(`La cuenta de ${created.nombre} se creó con el rol ${ROLE_LABEL[created.rolNombre as Rol] ?? created.rolNombre}.`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "No fue posible crear la cuenta.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: ManagedUser) {
    setError("");
    setNotice("");
    try {
      const updated = await usersApi.setActive(user.id, !user.activo);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `La cuenta de ${updated.nombre} ahora está ${updated.activo ? "activa" : "desactivada"}.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "No fue posible cambiar el estado.",
      );
    }
  }

  async function submitReset(event: FormEvent) {
    event.preventDefault();
    setResetMessage("");
    const parsed = resetUserPasswordSchema.safeParse({ newPassword });
    if (!parsed.success) {
      setResetMessage(parsed.error.issues[0]?.message ?? "Revisa la contraseña.");
      return;
    }
    if (resetId === null) return;

    setSaving(true);
    try {
      await usersApi.resetPassword(resetId, parsed.data.newPassword);
      setNewPassword("");
      setResetId(null);
      setNotice(
        "Contraseña actualizada. Comunica la nueva clave al usuario por un canal seguro.",
      );
    } catch (err) {
      setResetMessage(
        err instanceof ApiRequestError
          ? err.message
          : "No fue posible cambiar la contraseña.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Gestión de usuarios"
        description="Crea cuentas de administradores o analistas, consulta sus fichas, activa o desactiva cuentas y restablece contraseñas."
        action={
          <Button
            variant="outline"
            onClick={() => void loadUsers()}
            disabled={!isAuthApiConfigured || loading}
          >
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        }
      />
      {!isAuthApiConfigured && <DemoNotice />}
      {!isAuthApiConfigured && (
        <p className="rounded-lg border border-info/30 bg-info-soft p-4 text-sm">
          Configura <code>VITE_AUTH_BASE_URL</code> para gestionar cuentas reales. El modo
          demostración no crea ni modifica usuarios.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-positive/30 bg-positive/5 p-3 text-sm"
        >
          {notice}
        </p>
      )}

      <Panel className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
            <UserPlus className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Crear cuenta de usuario</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona si la cuenta tendrá permisos de administrador o de analista.
            </p>
          </div>
        </div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitCreate} noValidate>
          <Field label="Nombre completo" htmlFor="nombre" error={errors["nombre"]}>
            <input
              id="nombre"
              autoComplete="name"
              className="form-control"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              {...fieldA11y("nombre", errors["nombre"])}
              disabled={!isAuthApiConfigured || saving}
            />
          </Field>
          <Field label="Correo electrónico" htmlFor="email" error={errors["email"]}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              {...fieldA11y("email", errors["email"])}
              disabled={!isAuthApiConfigured || saving}
            />
          </Field>
          <Field label="Rol" htmlFor="rol">
            <select
              id="rol"
              className="form-control"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
              disabled={!isAuthApiConfigured || saving}
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ROLE_LABEL[rol]}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              La cuenta se creará con el rol: <strong>{ROLE_LABEL[form.rol]}</strong>.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Contraseña inicial"
              htmlFor="password"
              error={errors["password"]}
              hint="Entre 12 y 72 caracteres. El usuario podrá cambiarla desde Mi cuenta."
            >
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="form-control"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                {...fieldA11y("password", errors["password"])}
                disabled={!isAuthApiConfigured || saving}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!isAuthApiConfigured || saving}>
              {saving ? "Guardando…" : "Crear analista"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <Users className="size-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-bold">Usuarios registrados</h2>
            <p className="text-sm text-muted-foreground">{users.length} cuenta(s) cargadas</p>
          </div>
        </div>
        {!isAuthApiConfigured ? (
          <p className="p-5 text-sm text-muted-foreground">
            La lista estará disponible cuando conectes el Security-Module.
          </p>
        ) : loading ? (
          <p className="p-5 text-sm text-muted-foreground">Cargando usuarios…</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No hay usuarios para mostrar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creación</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{user.nombre}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      {user.rolNombre === "ADMINISTRADOR_RIESGO"
                        ? "Administrador de riesgo"
                        : user.rolNombre === "ANALISTA_CREDITO"
                          ? "Analista de crédito"
                          : user.rolNombre}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.activo ? "bg-positive/10 text-positive" : "bg-muted text-muted-foreground"}`}
                      >
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">{formatDate(user.fechaCreacion)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void openDetails(user)}
                        >
                          <Eye className="size-4" />
                          Ver ficha
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void toggleStatus(user)}
                        >
                          {user.activo ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResetId(user.id);
                            setNewPassword("");
                            setResetMessage("");
                          }}
                        >
                          <KeyRound className="size-4" />
                          Restablecer clave
                        </Button>
                      </div>
                      {resetId === user.id && (
                        <form
                          className="mt-3 space-y-2 rounded-lg border border-border p-3"
                          onSubmit={submitReset}
                        >
                          <label
                            htmlFor={`new-password-${user.id}`}
                            className="block text-xs font-semibold"
                          >
                            Nueva contraseña
                          </label>
                          <input
                            id={`new-password-${user.id}`}
                            type="password"
                            autoComplete="new-password"
                            className="form-control"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={12}
                            maxLength={72}
                            required
                          />
                          {resetMessage && (
                            <p role="alert" className="text-xs text-destructive">
                              {resetMessage}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" type="submit" disabled={saving}>
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() => setResetId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ficha del usuario</DialogTitle>
            <DialogDescription>
              Información consultada directamente desde el Security-Module.
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Consultando usuario…</p>
          ) : detailError ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {detailError}
            </p>
          ) : detailUser ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Nombre completo</p>
                <p className="font-semibold">{detailUser.nombre}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Correo electrónico</p>
                <p className="break-all font-medium">{detailUser.email}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Identificador</p>
                  <p className="font-mono">#{detailUser.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Rol</p>
                  <p className="font-medium">
                    {ROLE_LABEL[detailUser.rolNombre as Rol] ?? detailUser.rolNombre}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Estado</p>
                  <p className="font-medium">{detailUser.activo ? "Activo" : "Inactivo"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Fecha de creación</p>
                  <p>{formatDate(detailUser.fechaCreacion)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Última modificación</p>
                  <p>{formatDate(detailUser.fechaModificacion)}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false);
                    setResetId(detailUser.id);
                    setNewPassword("");
                    setResetMessage("");
                  }}
                >
                  <KeyRound className="size-4" />
                  Restablecer contraseña
                </Button>
                <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        La API del Security-Module aplica los permisos. Esta pantalla no sustituye la autorización
        del backend.
      </p>
    </div>
  );
}
