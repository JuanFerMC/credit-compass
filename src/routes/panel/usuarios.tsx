import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isAuthApiConfigured } from "@/api/auth";
import { ROLES, ROLE_LABEL, parseRol } from "@/api/roles";
import { useSession } from "@/api/session";
import {
  createUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type User,
} from "@/api/users-client";
import { usersApi } from "@/api/users";
import { FormError } from "@/components/shared/auth-shell";
import { DemoNotice, Field, PageHeader, Panel } from "@/components/shared/page";
import { StatusDot } from "@/components/shared/status-dot";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { demoUsers } from "@/data/demo-data";
import { describeAuthError } from "@/lib/auth-errors";
import { fieldA11y, zodErrors } from "@/lib/forms";

export const Route = createFileRoute("/panel/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios — Veridica" },
      { name: "description", content: "Administración de usuarios y roles del sistema." },
    ],
  }),
  component: UsersPage,
});

const emptyCreate: CreateUserInput = {
  nombre: "",
  email: "",
  password: "",
  rol: "ANALISTA_CREDITO",
};
const emptyReset = { newPassword: "", confirm: "" };

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}

function roleLabel(rolNombre: string) {
  const rol = parseRol(rolNombre);
  return rol ? ROLE_LABEL[rol] : rolNombre;
}

function UsersPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const myId = session.status === "authenticated" ? session.user.userId : null;

  // Con backend real la lista viene de GET /usuarios; en demostración se trabaja
  // sobre una copia local de los datos de ejemplo (nada se persiste).
  const query = useQuery({
    queryKey: ["usuarios"],
    queryFn: usersApi.list,
    enabled: isAuthApiConfigured,
  });
  const [demoList, setDemoList] = useState<User[]>(demoUsers);
  const users = isAuthApiConfigured ? (query.data ?? []) : demoList;

  function upsertUser(user: User) {
    if (isAuthApiConfigured) {
      queryClient.setQueryData<User[]>(["usuarios"], (current = []) => {
        const exists = current.some((item) => item.id === user.id);
        return exists
          ? current.map((item) => (item.id === user.id ? user : item))
          : [...current, user];
      });
    } else {
      setDemoList((current) => {
        const exists = current.some((item) => item.id === user.id);
        return exists
          ? current.map((item) => (item.id === user.id ? user : item))
          : [...current, user];
      });
    }
  }

  // ---- Estado global de la página
  const [notice, setNotice] = useState("");
  const [pageError, setPageError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleActive(user: User) {
    setNotice("");
    setPageError("");
    setBusyId(user.id);
    try {
      const updated = isAuthApiConfigured
        ? await usersApi.setActive(user.id, !user.activo)
        : { ...user, activo: !user.activo, fechaModificacion: new Date().toISOString() };
      upsertUser(updated);
      setNotice(`${updated.nombre} ahora está ${updated.activo ? "activo" : "inactivo"}.`);
    } catch (error) {
      setPageError(describeAuthError(error));
    } finally {
      setBusyId(null);
    }
  }

  // ---- Crear usuario
  const [createForm, setCreateForm] = useState<CreateUserInput>(emptyCreate);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const parsed = createUserSchema.safeParse(createForm);
    if (!parsed.success) {
      setCreateErrors(zodErrors(parsed.error));
      return;
    }
    setCreateErrors({});
    setCreateError("");
    setCreating(true);
    try {
      const created = isAuthApiConfigured
        ? await usersApi.create(parsed.data)
        : {
            id: Math.max(0, ...demoList.map((item) => item.id)) + 1,
            nombre: parsed.data.nombre,
            email: parsed.data.email,
            rolNombre: parsed.data.rol,
            activo: true,
            fechaCreacion: new Date().toISOString(),
            fechaModificacion: null,
          };
      upsertUser(created);
      setCreateForm({ ...emptyCreate, rol: parsed.data.rol });
      setNotice(`Usuario ${created.nombre} creado.`);
    } catch (error) {
      setCreateError(describeAuthError(error));
    } finally {
      setCreating(false);
    }
  }

  // ---- Restablecer contraseña (diálogo)
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetForm, setResetForm] = useState(emptyReset);
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  function openReset(user: User) {
    setResetTarget(user);
    setResetForm(emptyReset);
    setResetErrors({});
    setResetError("");
  }

  async function submitReset(event: FormEvent) {
    event.preventDefault();
    if (!resetTarget) return;
    const parsed = resetPasswordSchema.safeParse(resetForm);
    if (!parsed.success) {
      setResetErrors(zodErrors(parsed.error));
      return;
    }
    setResetErrors({});
    setResetError("");
    setResetting(true);
    try {
      if (isAuthApiConfigured)
        await usersApi.resetPassword(resetTarget.id, parsed.data.newPassword);
      setNotice(`Se restableció la contraseña de ${resetTarget.nombre}.`);
      setResetTarget(null);
    } catch (error) {
      setResetError(describeAuthError(error));
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seguridad"
        title="Usuarios"
        description="Crea cuentas, asigna roles y activa o desactiva el acceso. Solo el administrador de riesgo puede ver esta sección."
      />
      {!isAuthApiConfigured && <DemoNotice />}

      {notice && (
        <output className="block rounded-lg bg-positive-soft p-3 text-sm text-positive">
          {notice}
        </output>
      )}
      <FormError message={pageError} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">Usuarios registrados</h2>
            <p className="text-sm text-muted-foreground">
              Un usuario desactivado no puede iniciar sesión y su sesión actual se invalida.
            </p>
          </div>
          {isAuthApiConfigured && query.isPending ? (
            <output className="block p-5 text-sm text-muted-foreground">Cargando usuarios…</output>
          ) : isAuthApiConfigured && query.isError ? (
            <div className="space-y-3 p-5">
              <FormError message={describeAuthError(query.error, "No se pudo cargar la lista.")} />
              <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th className="sr-only">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isMe = user.id === myId;
                    return (
                      <tr key={user.id}>
                        <td>
                          <p className="font-semibold">
                            {user.nombre}
                            {isMe && (
                              <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                            )}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {user.email}
                          </p>
                        </td>
                        <td>{roleLabel(user.rolNombre)}</td>
                        <td>
                          <StatusDot
                            active={user.activo}
                            activeLabel="Activo"
                            inactiveLabel="Inactivo"
                          />
                        </td>
                        <td>{formatDate(user.fechaCreacion)}</td>
                        <td className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openReset(user)}
                            >
                              <KeyRound className="size-3.5" />
                              Contraseña
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isMe || busyId === user.id}
                              // El backend no impide que un administrador se desactive a sí
                              // mismo, y sus tokens quedarían inválidos de inmediato (si es el
                              // único administrador, nadie podría volver a entrar).
                              title={isMe ? "No puedes desactivar tu propia cuenta" : undefined}
                              onClick={() => void toggleActive(user)}
                            >
                              {user.activo ? "Desactivar" : "Activar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              <UserPlus className="size-5" />
            </span>
            <div>
              <h2 className="font-display font-bold">Nuevo usuario</h2>
              <p className="text-xs text-muted-foreground">No hay registro público.</p>
            </div>
          </div>
          <form onSubmit={submitCreate} className="space-y-4" noValidate>
            <FormError message={createError} />
            <Field label="Nombre" htmlFor="user-nombre" error={createErrors["nombre"]}>
              <input
                id="user-nombre"
                className="form-control"
                autoComplete="off"
                value={createForm.nombre}
                onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                {...fieldA11y("user-nombre", createErrors["nombre"])}
              />
            </Field>
            <Field label="Correo" htmlFor="user-email" error={createErrors["email"]}>
              <input
                id="user-email"
                type="email"
                className="form-control"
                autoComplete="off"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                {...fieldA11y("user-email", createErrors["email"])}
              />
            </Field>
            <Field
              label="Contraseña inicial"
              htmlFor="user-password"
              error={createErrors["password"]}
              hint="Entre 12 y 72 caracteres."
            >
              <input
                id="user-password"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                {...fieldA11y("user-password", createErrors["password"])}
              />
            </Field>
            <Field label="Rol" htmlFor="user-rol" error={createErrors["rol"]}>
              <select
                id="user-rol"
                className="form-control"
                value={createForm.rol}
                onChange={(e) =>
                  setCreateForm({ ...createForm, rol: e.target.value as CreateUserInput["rol"] })
                }
                {...fieldA11y("user-rol", createErrors["rol"])}
              >
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {ROLE_LABEL[rol]}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Creando…" : "Crear usuario"}
            </Button>
          </form>
        </Panel>
      </div>

      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <form onSubmit={submitReset} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle>Restablecer contraseña</DialogTitle>
              <DialogDescription>
                Define una contraseña nueva para {resetTarget?.nombre}. Sus sesiones ya abiertas
                pueden seguir activas hasta 7 días.
              </DialogDescription>
            </DialogHeader>
            <FormError message={resetError} />
            <Field label="Contraseña nueva" htmlFor="reset-new" error={resetErrors["newPassword"]}>
              <input
                id="reset-new"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                {...fieldA11y("reset-new", resetErrors["newPassword"])}
              />
            </Field>
            <Field
              label="Confirmar contraseña"
              htmlFor="reset-confirm"
              error={resetErrors["confirm"]}
            >
              <input
                id="reset-confirm"
                type="password"
                className="form-control"
                autoComplete="new-password"
                value={resetForm.confirm}
                onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                {...fieldA11y("reset-confirm", resetErrors["confirm"])}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setResetTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetting}>
                {resetting ? "Guardando…" : "Restablecer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
