// El color es solo un refuerzo — el texto siempre acompaña al punto (ver la
// clase .status-dot en styles.css). Los textos se pueden cambiar porque el
// género depende de lo que se describe: "Activa" (variable, regla) o
// "Activo" (usuario).
export function StatusDot({
  active,
  activeLabel = "Activa",
  inactiveLabel = "Inactiva",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span className={`status-dot ${active ? "status-active" : "status-inactive"}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
