import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PublicHeader, PublicFooter } from "@/components/layout/public-shell";
import { Panel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";

// iniciar-sesion.tsx y crear-cuenta.tsx compartían, palabra por palabra, todo
// el "marco" de la página (header/footer público, el Panel centrado, el
// icono + título + aviso de modo demostrativo, y el enlace de pie para
// cambiar entre login/registro) — solo cambiaban los campos del formulario
// y el texto puntual. Ese marco vive acá; cada página solo aporta su
// formulario como children.
export function AuthShell({
  icon,
  title,
  switchPath,
  switchLabel,
  footerText,
  footerLinkText,
  children,
}: {
  icon: ReactNode;
  title: string;
  switchPath: "/iniciar-sesion" | "/crear-cuenta";
  switchLabel: string;
  footerText: string;
  footerLinkText: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to={switchPath}>{switchLabel}</Link>
          </Button>
        }
      />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Panel className="w-full max-w-sm p-6">
          <div className="mb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-primary">
              {icon}
            </span>
            <h1 className="mt-3 font-display text-xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Modo demostrativo: no hay backend de autenticación todavía, esto solo simula tu sesión
              en este navegador.
            </p>
          </div>
          {children}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {footerText}{" "}
            <Link to={switchPath} className="font-semibold text-primary underline">
              {footerLinkText}
            </Link>
          </p>
        </Panel>
      </main>
      <PublicFooter />
    </div>
  );
}
