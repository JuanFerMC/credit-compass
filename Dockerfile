FROM oven/bun:1.2 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# Sin esto, Nitro construye contra su target por defecto (Cloudflare
# Workers — ver el comentario en vite.config.ts), que genera un export
# `fetch` para el runtime de Workers, no un servidor Node. El contenedor
# "compilaba" pero `node .output/server/index.mjs` no levantaba nada
# (ni error ni puerto abierto). NITRO_PRESET=node-server fuerza la salida
# a un servidor Node autocontenido en esa misma ruta.
ENV NITRO_PRESET=node-server
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]