# Despliegue del frontend

## Configuración

La aplicación consume **dos backends**. Las URLs se incorporan durante la construcción (Vite las inlinea en el bundle) y deben ser accesibles desde el navegador de los usuarios:

| Variable | Backend | Notas |
|---|---|---|
| `VITE_API_BASE_URL` | Motor de Scoring (`:8080`) | Vacía = datos de demostración |
| `VITE_AUTH_BASE_URL` | Security-Module — login, roles, usuarios (`:8081`) | Vacía = **modo demostración**: la sesión se simula en el navegador y no hay control de roles real |
| `VITE_SCORING_SENDS_TOKEN` | — | `false` por defecto. Con `true` el front envía el JWT también al Motor de Scoring. No activar hasta que scoring permita `Authorization` en su CORS (hoy solo permite `Content-Type`, `Accept`, `X-Trace-Id`) |

El backend de autenticación necesita `CORS_ALLOWED_ORIGINS` con el origen del front, y un primer administrador creado con `INIT_ADMIN_EMAIL` / `INIT_ADMIN_PASSWORD` (mínimo 12 caracteres). No existe registro público: el alta de usuarios la hace un administrador.

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
- `POST /api/v1/evaluaciones` (HU07)

Contra el Security-Module (`VITE_AUTH_BASE_URL`): `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/validate` y `GET /api/v1/usuarios/{id}`. El access token (15 min) vive solo en memoria; el refresh token (7 días, de un solo uso) en `sessionStorage`.

Las tablas de reglas, evaluaciones, informes y el dashboard siguen mostrando estados informativos porque el backend aún no publica endpoints de consulta (listar) para esos recursos.

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