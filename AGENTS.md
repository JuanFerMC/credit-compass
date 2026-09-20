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

