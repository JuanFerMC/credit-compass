# syntax=docker/dockerfile:1

# ---- Etapa 1: dependencias ----
# Se aísla en su propia capa para aprovechar el cache de Docker: mientras
# package.json/bun.lock no cambien, esta capa no se vuelve a ejecutar.
FROM oven/bun:1-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- Etapa 2: build ----
# TanStack Start (vía Nitro) apunta a Cloudflare por defecto (ver vite.config.ts).
# NITRO_PRESET=node-server fuerza la salida a un servidor Node/Bun autocontenido
# en .output/server/index.mjs, que es lo que necesitamos para correr en cualquier
# plataforma con Docker.
FROM oven/bun:1-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# URL del backend (motor-scoring-crediticio). Se inyecta en build time porque
# Vite incrusta las variables VITE_* en el bundle del cliente. Si se omite,
# la app sigue funcionando con los datos de demostración (ver src/lib/api.ts).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV NITRO_PRESET=node-server

RUN bun run build

# ---- Etapa 3: runtime ----
# Nitro empaqueta (bundlea) las dependencias del servidor dentro de .output/server,
# así que la imagen final no necesita node_modules ni el código fuente: solo el
# artefacto de build. Esto mantiene la imagen liviana.
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000

# La imagen base oven/bun ya incluye un usuario sin privilegios llamado "bun".
USER bun

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", ".output/server/index.mjs"]
