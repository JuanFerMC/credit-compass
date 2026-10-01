import { AlertTriangle, CheckCircle2, CircleDot, ShieldAlert } from "lucide-react";

const styles = {
  positive: "bg-positive-soft text-positive",
  accent: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  negative: "bg-destructive-soft text-destructive",
  critical: "bg-critical-soft text-critical",
} as const;

// Antes era una cadena de ternarios anidados (tone === "positive" ? … :
// tone === "negative" || "critical" ? … : …); Sonar la marca dos veces
// porque hay dos niveles de anidación. Una tabla es a la vez más corta y
// más fácil de leer.
const ICON_BY_TONE: Record<keyof typeof styles, typeof CheckCircle2> = {
  positive: CheckCircle2,
  accent: CircleDot,
  warning: AlertTriangle,
  negative: ShieldAlert,
  critical: ShieldAlert,
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof styles;
  children: React.ReactNode;
}) {
  const Icon = ICON_BY_TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}
