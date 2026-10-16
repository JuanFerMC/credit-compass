import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PublicHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:gap-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Veridica, ir al inicio">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
            V
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-bold">Veridica</span>
            <span className="block font-mono text-[10px] uppercase text-muted-foreground">
              Scoring crediticio
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-screen-2xl px-5 py-6 text-xs text-muted-foreground sm:px-8 lg:px-12">
        © {new Date().getFullYear()} Veridica. Panel de scoring crediticio — proyecto demostrativo.
      </div>
    </footer>
  );
}
