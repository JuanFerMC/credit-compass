// Antes, `variables.tsx` y `reglas.tsx` repetían el mismo
// `className={`status-dot ${x.active ? "status-active" : "status-inactive"}`}`
// palabra por palabra. El color es solo un refuerzo — el texto
// "Activa"/"Inactiva" siempre acompaña al punto (ver la clase .status-dot
// en styles.css).
export function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`status-dot ${active ? "status-active" : "status-inactive"}`}>
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}
