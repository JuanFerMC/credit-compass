import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

// Layout route: envuelve /panel y todo lo que cuelga de /panel/* con el
// AppShell (barra lateral, header, selector de tema). La landing pública
// (/, /iniciar-sesion, /crear-cuenta) vive fuera de este árbol y no lo usa.
export const Route = createFileRoute("/panel")({
  component: PanelLayout,
});

function PanelLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
