# Despliegue del frontend

## Configuración

La aplicación consume el backend mediante `VITE_API_BASE_URL`. La URL se incorpora durante la construcción y debe ser accesible desde el navegador de los usuarios.

```bash
cp .env.example .env
```

## Docker Compose

```bash
docker compose up --build
```

El frontend quedará disponible en `http://localhost:3000`. El backend del repositorio de referencia debe ejecutarse por separado y permitir solicitudes desde ese origen.

## Imagen Docker

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.ejemplo.com -t veridica-frontend .
docker run --rm -p 3000:3000 veridica-frontend
```

## Integración progresiva

Los módulos de solicitantes y variables usan los endpoints ya implementados. Reglas, evaluaciones e informes están identificados como demostrativos hasta que el backend publique sus contratos definitivos.