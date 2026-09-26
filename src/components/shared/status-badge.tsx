import { AlertTriangle, CheckCircle2, CircleDot, ShieldAlert } from "lucide-react";

const styles = {
  positive: "bg-positive-soft text-positive",
  accent: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  negative: "bg-destructive-soft text-destructive",
  critical: "bg-critical-soft text-critical",
} as const;

export function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof styles;
  children: React.ReactNode;
}) {
  const Icon =
    tone === "positive"
      ? CheckCircle2
      : tone === "negative" || tone === "critical"
        ? ShieldAlert
        : tone === "warning"
          ? AlertTriangle
          : CircleDot;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}
