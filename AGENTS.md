<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Registro de cambios por agente

-- Claude (chat) -- Commit "Añade Docker y documentación de despliegue" --
Cambios:
- Se agregó `Dockerfile` multi-stage (deps → build → runtime) basado en
  `oven/bun:1-slim`. El build fuerza `NITRO_PRESET=node-server` porque
  `vite.config.ts` deja a Nitro apuntando a Cloudflare por defecto (ver
  comentario en ese archivo), y para un despliegue Docker genérico se
  necesita el servidor Node/Bun autocontenido que genera ese preset
  (`.output/server/index.mjs`).
- Se agregó `.dockerignore`, `docker-compose.yml` y `.env.example`
  (`VITE_API_BASE_URL`, con el backend `motor-scoring-crediticio` como
  referencia).
- Se agregó `docs/DEPLOYMENT.md` explicando el porqué del preset, cómo
  construir/correr la imagen, y las variables de entorno.
- Se enlazó `docs/DEPLOYMENT.md` desde `README.md` (sección "Docker") y se
  marcó como completado el ítem de Docker en `roadmap.md`.
- Incoherencia detectada y documentada (no corregida en este commit): el
  `README.md` original del repo mezcla, en un mismo párrafo, las
  instrucciones de negocio del proyecto (rol, framework, requisitos de
  UX/accesibilidad) con el boilerplate generado por Lovable ("Build with
  Lovable"). Esto no es un bug funcional, pero dificulta que alguien nuevo
  entienda rápido qué es una instrucción del dueño del proyecto y qué es
  texto generado automáticamente. Se sugiere, en un commit futuro, separar
  ambos bloques con un encabezado claro (p. ej. "## Contexto y requisitos"
  vs. "## Generado con Lovable").
- Verificación: no había daemon de Docker disponible en el entorno donde se
  preparó este cambio, así que no se pudo ejecutar `docker build`
  literalmente. Sí se verificó el build real (`NITRO_PRESET=node-server`)
  y el arranque del servidor resultante (`node .output/server/index.mjs`
  respondiendo `200 OK`); el detalle está en `docs/DEPLOYMENT.md`. Queda
  pendiente correr `docker build`/`docker run` en un entorno con Docker
  antes del primer despliegue real.

-- Claude (chat) -- Commit "Corrige compilación, accesibilidad y sistema visual ausente" --
Cambios:
- **Compilación** (`tsc --noEmit` fallaba con 20+ errores; ahora pasa limpio):
  - `src/components/ui/button.tsx`: no exportaba `buttonVariants`/`ButtonProps`
    ni usaba `React.forwardRef`, rompiendo la compilación de `alert-dialog.tsx`,
    `calendar.tsx`, `carousel.tsx`, `pagination.tsx` y `sidebar.tsx` (todos
    esperan la API estándar de shadcn). Se restauró esa API manteniendo los
    nombres de variante del proyecto (`primary/secondary/ghost/danger`) y se
    agregó la variante `outline` que esos componentes ya daban por hecha.
  - `src/components/ui/pagination.tsx`: `size` se especificaba dos veces en
    `PaginationPrevious`/`PaginationNext` (prop literal + spread); se movió a
    un valor por defecto en la desestructuración.
  - `src/components/theme-switcher.tsx`, `src/lib/api.ts`,
    `src/routes/solicitantes.tsx`: accesos a propiedades de index signature
    (`dataset.theme`, `import.meta.env.VITE_API_BASE_URL`, `errors.campo`)
    sin notación de corchetes, requerida por la config estricta de TS del
    proyecto.
  - `src/components/page.tsx`: el prop `error` de `Field` no aceptaba
    `undefined` explícito bajo `exactOptionalPropertyTypes`.
  - `npm run lint` tenía 167 errores de formato (prettier) en casi todo el
    repo — nunca se había corrido `eslint --fix`. Se corrió una vez;
    `npm run lint` ahora pasa con 0 errores (quedan 6 warnings preexistentes
    de `react-refresh/only-export-components` en componentes shadcn sin
    usar, no son bugs).
- **Accesibilidad básica**:
  - `src/routes/__root.tsx`: `<html lang="en">` con toda la app en español
    → `lang="es"` (WCAG 3.1.1, afecta pronunciación de lectores de pantalla).
  - `src/routes/solicitantes.tsx`: los 7 campos del formulario de "Nuevo
    solicitante" no tenían `aria-invalid`/`aria-describedby` enlazados a su
    mensaje de error (solo el campo de nombre tenía `aria-invalid`, y ninguno
    tenía `aria-describedby`); se agregó a los 7.
- **Sistema visual ausente (el hallazgo más importante de este bloque)**:
  `src/styles.css` era el boilerplate genérico de `shadcn init`, sin ninguno
  de los tokens que usa la app real. Se confirmó inspeccionando el CSS
  compilado que clases como `bg-surface`, `bg-accent-soft`,
  `bg-info-soft`/`text-info`, `bg-positive-soft`/`text-positive`,
  `bg-warning-soft`/`text-warning`, `bg-destructive-soft`, `.glass`,
  `.form-control`, `.data-table`, `.status-dot`, `font-display` no generaban
  ni una línea de CSS — la app entera estaba, en la práctica, sin estilo
  propio, y el modo oscuro/daltónico no existía (el switcher escribe
  `data-theme` en `<html>`, pero el CSS solo tenía la convención `.dark` de
  shadcn, que ningún componente usa). Se reescribió `src/styles.css`:
  - Se agregaron los tokens semánticos que la app ya referenciaba
    (`surface`, `accent-soft`, `info`/`positive`/`warning`/`critical` +
    variantes `-soft`, `overlay`), registrados en `@theme inline`.
  - Se agregaron variantes `[data-theme="dark"]` y `[data-theme="colorblind"]`
    (selector correcto, no `.dark`). El modo daltónico usa la paleta segura
    Okabe-Ito (azul en vez de verde para "positivo", vermellón/magenta para
    riesgo alto) para no depender del eje rojo-verde; la UI ya refuerza el
    estado con texto además de color (`variables.tsx`/`reglas.tsx`), este
    cambio solo hace que el refuerzo de color funcione.
  - Se registraron las tipografías que ya se cargaban en `__root.tsx`
    (Inter, Space Grotesk, JetBrains Mono) pero nunca se aplicaban:
    `--font-sans`, `--font-display`, `--font-mono`.
  - Se agregaron las clases de componente que la app usa y no existían:
    `.glass`, `.form-control` (con estado `aria-invalid`), `.data-table`,
    `.status-dot`/`.status-active`/`.status-inactive`.
  - Verificación: se recompiló (`tsc`, `eslint`, `NITRO_PRESET=node-server
    npm run build`) y se inspeccionó `.output/public/assets/*.css` para
    confirmar que las clases nuevas sí generan reglas CSS reales (por
    ejemplo `.bg-surface{background-color:var(--surface)}`,
    `.font-display{font-family:Space Grotesk,...}`, y los bloques
    `[data-theme=dark]`/`[data-theme=colorblind]` con valores propios). Se
    levantó el servidor construido y las 6 rutas (`/`, `/solicitantes`,
    `/variables`, `/reglas`, `/evaluaciones`, `/informes`) responden `200`.
    No se pudo hacer una verificación visual en navegador real (sin
    entorno gráfico disponible aquí) — se recomienda una revisión visual
    real y una auditoría de contraste (Lighthouse/axe) antes de dar por
    cerrado el ítem de accesibilidad del roadmap.
- **Bug adicional encontrado y corregido**: `src/routes/informes.tsx`
  construía clases de Tailwind dinámicamente (`` `bg-${tone}-soft` ``,
  `` `text-${tone}` ``). Tailwind analiza las clases de forma estática en
  build time, así que ese patrón nunca generó las clases reales — los
  bloques de "Distribución de cartera" y los "Hallazgos del período" se
  renderizaban sin color de fondo/texto. Se reemplazó por un mapa estático
  `toneClasses`/`toneClass()` con las clases completas escritas de forma
  literal.
- Pendiente para un commit futuro (documentado, no corregido aquí): la
  mezcla de instrucciones de negocio y boilerplate de Lovable en
  `README.md`, mencionada en el commit anterior.

-- Claude (chat) -- Commit "Corrige parpadeo de tema y contraste del color warning" --
Cambios:
- `src/routes/__root.tsx`: se agregó un script inline en `<head>` que lee
  `localStorage["veridica-theme"]` y aplica `data-theme` en `<html>` antes
  de que React hidrate. Sin esto, un usuario que ya había elegido modo
  oscuro o daltónico veía un parpadeo del tema claro en cada carga (el
  tema solo se aplicaba en un `useEffect`, que corre después del primer
  render). La lógica y los valores permitidos ("dark"/"colorblind") están
  duplicados intencionalmente del mismo `theme-switcher.tsx` para que
  ambos coincidan siempre.
- `src/styles.css`: se instaló temporalmente `colorjs.io` (no quedó en
  `package.json`, se desinstaló al terminar) para calcular el contraste
  real (WCAG 2.1) de los tres modos de apariencia en vez de solo
  "a ojo". Todos los pares texto/fondo relevantes (texto normal, texto
  secundario, texto sobre botones, texto de cada chip de estado
  info/positive/warning/critical) pasan el mínimo de 4.5:1 para texto
  normal, excepto `--warning` sobre `--warning-soft`, que daba 4.34:1 en
  claro y 3.43:1 en daltónico. Se oscureció `--warning` (L de 0.55→0.52 en
  claro, 0.6→0.52 en daltónico) hasta 4.93:1 y 4.80:1 respectivamente, sin
  tocar el resto de la paleta.
- No se corrigió (queda para una revisión futura si se agregan más
  variantes de chip): no se verificó el contraste de `bg-warning`/
  `bg-positive`/etc. usados como fondo sólido con texto directamente
  encima fuera de los chips "-soft" existentes, porque hoy no hay ningún
  componente que los use así.



