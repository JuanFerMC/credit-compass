# Despliegue del frontend

## Configuración

La aplicación consume el backend mediante `VITE_API_BASE_URL`. La URL se incorpora durante la construcción y debe ser accesible desde el navegador de los usuarios.

```bash
cp .env.example .env
```

## Desarrollo local

Inicia PostgreSQL y el backend con `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` configurados. Después inicia el frontend con `VITE_API_BASE_URL=http://localhost:8080`.

El backend permite por defecto el origen `http://localhost:3000`. Para otro origen, configura `CORS_ALLOWED_ORIGINS` como una lista separada por comas.

Los comandos soportados actualmente por el frontend son:

- `POST /api/v1/solicitantes` y `GET /api/v1/solicitantes/documento/{numeroDocumento}`
- `POST /api/v1/variables-riesgo` y `PATCH /api/v1/variables-riesgo/{idRiesgo}/estado`
- `POST /api/v1/reglas-scoring` y `PATCH /api/v1/reglas-scoring/{idRegla}`
- `POST /api/v1/evaluaciones` (HU07 — ver nota abajo)

Las tablas de reglas, evaluaciones, informes y el dashboard siguen mostrando estados informativos porque el backend aún no publica endpoints de consulta (listar) para esos recursos.

> **HU07 (`/api/v1/evaluaciones`) todavía no está mergeada a `main`** en
> `motor-scoring-crediticio` — vive en la rama
> `feature/HU07-calcular-score-crediticio`. Contra un backend real en
> `main`, calcular un score devolverá 404 hasta que esa rama se fusione.

## Docker Compose

```bash
docker compose up --build
```

El frontend quedará disponible en `http://localhost:3000`. El backend del repositorio de referencia debe ejecutarse por separado y permitir solicitudes desde ese origen mediante `CORS_ALLOWED_ORIGINS=http://localhost:3000`.

## Imagen Docker

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.ejemplo.com -t veridica-frontend .
docker run --rm -p 3000:3000 veridica-frontend
```

El `Dockerfile` fija `NITRO_PRESET=node-server` antes del build. Es
necesario: `vite.config.ts` deja a Nitro apuntando a Cloudflare Workers
como target por defecto, y sin ese override la imagen "compila" pero
`node .output/server/index.mjs` no expone ningún puerto (el bundle
resultante es un export `fetch` para el runtime de Workers, no un
servidor Node).

## Integración progresiva

Los módulos de solicitantes y variables usan los endpoints ya implementados. Reglas, evaluaciones e informes están identificados como demostrativos hasta que el backend publique sus contratos definitivos.