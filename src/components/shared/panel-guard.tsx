import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pantalla mientras se restaura la sesión o se redirige al login. Nunca se
// muestra el panel (ni se redirige) antes de saber si hay sesión.
export function SessionLoading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <output className="font-mono text-xs uppercase text-muted-foreground">
        Verificando sesión…
      </output>
    </div>
  );
}

// 403 de interfaz: el usuario SÍ está autenticado, su rol no puede ver esta
// sección. No se cierra la sesión (un 403 no es una sesión vencida).
export function Forbidden() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-lg bg-warning-soft text-warning">
        <Lock className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-xl font-bold">No tienes permisos</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu rol no puede acceder a esta sección. Si crees que es un error, pídele a un administrador
        de riesgo que revise tu acceso.
      </p>
      <Button asChild className="mt-6">
        <Link to="/panel">Volver al panel</Link>
      </Button>
    </div>
  );
}
