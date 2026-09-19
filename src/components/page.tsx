import type { ReactNode } from "react";
import { Info, WifiOff } from "lucide-react";
import { isApiConfigured } from "@/lib/api";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass rounded-xl border border-border ${className}`}>{children}</section>;
}

export function DemoNotice() {
  if (isApiConfigured) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3 text-sm" role="status">
      <WifiOff className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
      <p><strong>Modo demostración.</strong> Conecta la dirección del backend para guardar y consultar información real.</p>
    </div>
  );
}

export function PendingBadge() {
  return <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-2 py-1 text-xs font-semibold text-warning"><Info className="size-3" aria-hidden="true" /> API pendiente</span>;
}

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-destructive" id={`${htmlFor}-error`}>{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}