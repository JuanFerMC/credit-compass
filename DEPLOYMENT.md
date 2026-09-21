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
- `POST /api/v1/variables-riesgo`
- `POST /api/v1/reglas-scoring`
- `POST /api/v1/evaluaciones`

Las tablas de reglas, evaluaciones, informes y el dashboard siguen mostrando estados informativos porque el backend aún no publica endpoints de consulta para esos recursos.

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

## Integración progresiva

Los módulos de solicitantes y variables usan los endpoints ya implementados. Reglas, evaluaciones e informes están identificados como demostrativos hasta que el backend publique sus contratos definitivos.