# Configuración y despliegue

Esta guía cubre el frontend de Credit-Compass (Veridica) y su comunicación con dos servicios independientes: el Motor de Scoring y Security-Module.

## 1. Variables de entorno

Copia `.env.example` a `.env` y configura las URLs:

| Variable | Uso | Valor local habitual |
|---|---|---|
| `VITE_API_BASE_URL` | Motor de Scoring | `http://localhost:8080` |
| `VITE_AUTH_BASE_URL` | Security-Module: login, sesión, roles y usuarios | `http://localhost:8081` |
| `VITE_SCORING_SENDS_TOKEN` | Envía el JWT también al Motor de Scoring | `false` |

Las variables `VITE_*` se incluyen en el bundle del frontend durante la compilación. No pongas secretos, contraseñas ni claves privadas en ellas. Después de cambiar una variable, reinicia Vite o reconstruye la imagen de Docker.

Si `VITE_AUTH_BASE_URL` está vacía, el inicio de sesión utiliza una sesión simulada en el navegador y se muestra el aviso de modo demostrativo. Esto no es autenticación real. Si `VITE_API_BASE_URL` está vacía, algunas vistas del scoring utilizan estados o datos demostrativos.

### CORS y primer administrador

- Configura `CORS_ALLOWED_ORIGINS` en cada backend para permitir el origen desde el que se abre el frontend (por ejemplo, `http://localhost:5173` en Vite o `http://localhost:3000` en Docker).
- Para pruebas desde otro dispositivo, el origen puede ser `http://192.168.1.25:5173` o `http://192.168.1.25:3000`, según la URL real utilizada. Configura el origen exacto en los backends que correspondan.
- En Security-Module, crea el primer administrador mediante las variables de inicialización que documente ese repositorio (en la configuración actual: `INIT_ADMIN_EMAIL` y `INIT_ADMIN_PASSWORD`). Utiliza una contraseña robusta y no la guardes en el repositorio.
- No existe registro público: el alta de usuarios la realiza un administrador.

Deja `VITE_SCORING_SENDS_TOKEN=false` salvo que el Motor de Scoring esté configurado para aceptar el encabezado `Authorization` en CORS. Con `true`, el navegador puede bloquear las solicitudes si el preflight CORS no permite ese encabezado.

## 2. Desarrollo local

1. Inicia PostgreSQL y los backends siguiendo sus propias guías. Configura en ellos la base de datos y los orígenes CORS.
2. Crea el archivo `.env` a partir de `.env.example` y ajusta las URLs si tus servicios utilizan otros puertos.
3. Instala dependencias y ejecuta el frontend:

   ```bash
   npm install
   npm run dev
   ```

4. Abre la URL indicada por Vite en la terminal (normalmente `http://localhost:5173`).

Comprobaciones útiles:

```bash
npm run lint
npm run build
npm run preview
```

El comando `preview` sirve para inspeccionar localmente el resultado compilado; no sustituye un despliegue de producción.

## 3. Compartir con otro dispositivo en la misma red

Esta modalidad es útil para una demostración o prueba de clase sin desplegar el frontend en un servidor público.

1. Ejecuta el servidor de desarrollo aceptando conexiones de la red:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

2. Consulta la IP privada del ordenador anfitrión (por ejemplo, `192.168.1.25`) y el puerto que imprime Vite. Comparte una URL como `http://192.168.1.25:5173`.
3. Conecta ambos dispositivos a la misma red Wi-Fi y permite el puerto en el firewall si hace falta.
4. Configura `VITE_API_BASE_URL` y `VITE_AUTH_BASE_URL` con direcciones accesibles desde el dispositivo que abre el frontend. Por ejemplo, si los backends se ejecutan en el mismo ordenador anfitrión, usa `http://192.168.1.25:8080` y `http://192.168.1.25:8081` en lugar de `localhost`.
5. Configura `CORS_ALLOWED_ORIGINS` en los backends con el origen exacto del frontend. Si cambias el host o el puerto, actualiza el origen permitido.

**Por qué importa `localhost`:** en una URL abierta desde el móvil, `localhost` apunta al móvil. No apunta al ordenador donde corre el frontend ni a los backends. El frontend se ejecuta en el navegador de cada usuario y las llamadas API se hacen desde ese navegador.

No hace falta exponer los puertos de los backends a Internet para una prueba en la misma Wi-Fi. Si la red usa aislamiento de clientes o una VPN/firewall restrictivo, la conexión directa puede no funcionar.

## 4. Acceso desde otra red

Para compartir una demo con alguien que no esté en la misma red puedes usar un túnel HTTPS temporal o desplegar los servicios en un entorno accesible externamente.

- Un túnel al frontend por sí solo no hace accesibles los backends. El navegador también debe poder llegar a las URLs configuradas en `VITE_API_BASE_URL` y `VITE_AUTH_BASE_URL`.
- Para túneles, dominios o despliegues externos, configura CORS con el origen HTTPS público real y usa HTTPS para los servicios expuestos.
- No expongas bases de datos ni puertos administrativos directamente a Internet.
- No compartas credenciales reales ni datos personales en una demo. Revisa las restricciones de acceso y los usuarios de prueba antes de abrir el enlace.

## 5. Docker Compose

El archivo `compose.yaml` construye y ejecuta solo el frontend. Los dos backends deben ejecutarse por separado y ser accesibles desde el navegador del usuario.

```bash
docker compose up --build
```

El frontend queda disponible en `http://localhost:3000`.

Compose pasa las variables `VITE_*` como argumentos de compilación. Si el frontend se abre desde otro dispositivo, define en el archivo `.env` las URLs API con la IP o el dominio accesible desde ese dispositivo, no con `localhost`. Luego reconstruye:

```bash
docker compose up --build -d
```

El backend de autenticación debe permitir el origen del frontend (por defecto `http://localhost:3000` en esta modalidad). Añade los demás orígenes solo si realmente los utilizas.

## 6. Construir y ejecutar la imagen Docker

Ejemplo de construcción:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8080 \
  --build-arg VITE_AUTH_BASE_URL=http://localhost:8081 \
  --build-arg VITE_SCORING_SENDS_TOKEN=false \
  -t credit-compass-frontend .
```

Ejecuta el contenedor:

```bash
docker run --rm -p 3000:3000 credit-compass-frontend
```

En un despliegue real, sustituye las URLs de ejemplo por las URLs públicas o de red que el navegador pueda alcanzar. La imagen incorpora esas URLs durante la compilación.

El `Dockerfile` fija `NITRO_PRESET=node-server` para que Nitro genere un servidor Node ejecutable dentro del contenedor. Sin ese ajuste, la configuración de Vite puede seleccionar el target de Cloudflare Workers y producir un artefacto que no levante el servidor Node esperado.

## 7. Alcance funcional y endpoints

La interfaz consume actualmente, entre otros, estos endpoints del Motor de Scoring:

- `POST /api/v1/solicitantes`
- `GET /api/v1/solicitantes/documento/{numeroDocumento}`
- `POST /api/v1/variables-riesgo`
- `PATCH /api/v1/variables-riesgo/{idRiesgo}/estado`
- `POST /api/v1/reglas-scoring`
- `PATCH /api/v1/reglas-scoring/{idRegla}`
- `POST /api/v1/evaluaciones` (HU07)

Y del Security-Module:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/validate`
- `GET /api/v1/usuarios/{id}`

La lista anterior documenta los endpoints integrados conocidos, no es una afirmación de cobertura exhaustiva del backend. Las tablas/listados de reglas, evaluaciones, informes y el dashboard pueden seguir siendo informativos hasta que existan endpoints de consulta adecuados. Comprueba los contratos actuales en los repositorios de backend.

El token de acceso vive en memoria y el refresh token se almacena en `sessionStorage`, según el flujo de autenticación actual.

## 8. Diagnóstico rápido

| Síntoma | Qué revisar |
|---|---|
| Aparece el aviso demostrativo | Comprueba que `VITE_AUTH_BASE_URL` tenga valor y reinicia Vite o reconstruye la imagen. |
| El login falla con errores de red/CORS | Verifica URL, puerto, disponibilidad del backend y `CORS_ALLOWED_ORIGINS`. |
| Funciona en el PC pero no en el móvil | Sustituye `localhost` por la IP del ordenador anfitrión en las URLs API; comprueba Wi-Fi y firewall. |
| El frontend abre pero las llamadas API fallan | Recuerda que las URLs API deben ser accesibles desde el navegador remoto, no solo desde el contenedor o anfitrión. |
| El contenedor no escucha en el puerto esperado | Revisa los logs de Docker y que se use el `Dockerfile` del repositorio con `NITRO_PRESET=node-server`. |
| Algunas vistas no reflejan datos persistentes | Confirma si el backend ofrece el endpoint de consulta correspondiente; algunas vistas siguen siendo demostrativas. |
