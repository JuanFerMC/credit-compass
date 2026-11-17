// Aplica el tema guardado (data-theme en <html>) ANTES del primer pintado, para
// evitar el parpadeo del tema claro. Es un archivo estático y no un <script>
// inline para que la CSP pueda prohibir scripts inline sin excepciones.
// Mismos valores y misma clave que src/components/shared/theme-switcher.tsx.
(function () {
  try {
    var theme = localStorage.getItem("veridica-theme");
    if (theme === "dark" || theme === "colorblind") {
      document.documentElement.dataset.theme = theme;
    }
  } catch (e) {
    // localStorage bloqueado: se queda el tema claro.
  }
})();
