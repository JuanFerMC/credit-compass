import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { isAuthApiConfigured } from "@/api/auth";
import { decideGuard } from "@/api/guard";
import { useSession } from "@/api/session";
import { AppShell } from "@/components/layout/app-shell";
import { Forbidden, SessionLoading } from "@/components/shared/panel-guard";

// Layout route: envuelve /panel y todo lo que cuelga de /panel/* con el
// AppShell y con el guard de sesión/rol. La landing pública (/, /iniciar-sesion,
// /crear-cuenta) vive fuera de este árbol.
export const Route = createFileRoute("/panel")({
  component: PanelLayout,
});

function PanelLayout() {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // La sesión solo existe en el navegador: en el servidor siempre es
  // "restoring", así que el SSR muestra la pantalla de carga y nunca el panel.
  const decision = decideGuard({ authConfigured: isAuthApiConfigured, session, pathname });
  const decisionType = decision.type;
  const expired = decision.type === "login" && decision.expired;

  useEffect(() => {
    if (decisionType === "login") {
      void navigate({
        to: "/iniciar-sesion",
        search: expired ? { redirect: pathname, motivo: "expirada" } : { redirect: pathname },
        replace: true,
      });
    } else if (decisionType === "home") {
      void navigate({ to: "/", replace: true });
    }
  }, [decisionType, expired, pathname, navigate]);

  if (decision.type === "allow") {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }
  if (decision.type === "forbidden") {
    return (
      <AppShell>
        <Forbidden />
      </AppShell>
    );
  }
  return <SessionLoading />;
}
