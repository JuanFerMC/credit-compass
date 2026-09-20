# Despliegue con Docker

Credit Compass está preparado para desplegarse como contenedor Docker en
cualquier plataforma que lo soporte (VPS, Render, Railway, ECS, Cloud Run,
Fly.io, etc.).

## Cómo funciona

La app está construida con TanStack Start (SSR sobre Nitro). Por defecto,
`vite.config.ts` deja a Nitro apuntando a Cloudflare como target de build
(ver el comentario en ese archivo). Para Docker no usamos ese target:
forzamos `NITRO_PRESET=node-server` en el build, que genera un servidor
Node/Bun autocontenido en `.output/server/index.mjs`, capaz de correr en
cualquier host con un runtime JS — sin depender de Cloudflare Workers.

El `Dockerfile` tiene 3 etapas:

1. **deps**: instala dependencias con Bun (`bun.lock`).
2. **build**: compila la app con `NITRO_PRESET=node-server` e inyecta
   `VITE_API_BASE_URL` en build time (las variables `VITE_*` se incrustan en
   el bundle del cliente, no se leen en runtime).
3. **runtime**: copia solo `.output` (Nitro empaqueta las dependencias del
   servidor ahí dentro, así que no hace falta `node_modules` en esta etapa)
   y arranca con `bun .output/server/index.mjs`, como usuario sin privilegios.

## Construir y correr

```sh
docker build -t credit-compass-frontend \
  --build-arg VITE_API_BASE_URL=https://tu-backend.example.com \
  .

docker run -p 3000:3000 credit-compass-frontend
```

La app queda disponible en `http://localhost:3000`.

## Con docker-compose

```sh
cp .env.example .env
# edita .env con la URL real del backend
docker compose up --build
```

## Variables de entorno

| Variable            | Dónde se usa | Descripción |
|---------------------|--------------|-------------|
| `VITE_API_BASE_URL` | Build time   | URL base del backend `motor-scoring-crediticio`. Si se omite, la app usa datos de demostración (`src/lib/demo-data.ts`) en vez de fallar — ver `src/lib/api.ts`. |
| `PORT`               | Runtime      | Puerto en el que escucha el servidor Node/Bun. Por defecto `3000`. |
| `HOST`               | Runtime      | Interfaz de red. Por defecto `0.0.0.0` (necesario dentro de un contenedor). |

`VITE_API_BASE_URL` se inyecta como build-arg, no como variable de entorno
en runtime, porque Vite la incrusta en el bundle del cliente durante el
build. Si cambia la URL del backend, hay que reconstruir la imagen.

## Verificación realizada

En el entorno de desarrollo donde se preparó este Dockerfile no había un
daemon de Docker disponible, así que no se pudo correr `docker build`
literalmente. Sí se verificó, paso a paso, la lógica que usa la imagen:

- `NITRO_PRESET=node-server bun run build` genera `.output/server/index.mjs`
  correctamente (probado con `npm` como sustituto de `bun` para instalar,
  ya que `bun` no estaba disponible en ese entorno).
- Ese archivo, ejecutado con `PORT=3000 HOST=0.0.0.0 node .output/server/index.mjs`,
  levanta el servidor y responde `200 OK` con el HTML renderizado en `/`.

Antes del primer despliegue real, se recomienda correr `docker build` y
`docker run` una vez en un entorno con Docker disponible para confirmar que
la imagen `oven/bun:1-slim` no introduce ninguna diferencia relevante.
