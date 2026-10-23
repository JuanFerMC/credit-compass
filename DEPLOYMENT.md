# Configuración y despliegue

Esta guía cubre Credit-Compass (Veridica) y su integración local con Auth, Scoring y Evaluation Query. El navegador llama a las tres APIs; Scoring llama a Query para la saga de recomendaciones.

## 1. Variables de entorno

Copia `.env.example` a `.env` y configura las URLs:

| Variable | Uso | Valor local habitual |
|---|---|---|
| `VITE_API_BASE_URL` | Motor de Scoring | `http://localhost:8080` |
| `VITE_AUTH_BASE_URL` | Security-Module: login, sesión, roles y usuarios | `http://localhost:8081` |
| `VITE_EVALUATION_QUERY_BASE_URL` | Evaluation Query: explicaciones, recomendaciones e historial | `http://localhost:8082` |
| `VITE_SCORING_SENDS_TOKEN` | Envía el JWT también al Motor de Scoring | `true` |

Las variables `VITE_*` se incluyen en el bundle del frontend durante la compilación. No pongas secretos, contraseñas ni claves privadas en ellas. Después de cambiar una variable, reinicia Vite o reconstruye la imagen de Docker.

Si `VITE_AUTH_BASE_URL` está vacía, el inicio de sesión utiliza una sesión simulada en el navegador y se muestra el aviso de modo demostrativo. Esto no es autenticación real. Si `VITE_API_BASE_URL` está vacía, algunas vistas del scoring utilizan estados o datos demostrativos.

### CORS y primer administrador

- Configura `CORS_ALLOWED_ORIGINS` en cada backend para permitir el origen desde el que se abre el frontend (por ejemplo, `http://localhost:5173` en Vite o `http://localhost:3000` en Docker).
- Para pruebas desde otro dispositivo, el origen puede ser `http://192.168.1.25:5173` o `http://192.168.1.25:3000`, según la URL real utilizada. Configura el origen exacto en los backends que correspondan.
- En Security-Module, crea el primer administrador mediante las variables de inicialización que documente ese repositorio (en la configuración actual: `INIT_ADMIN_EMAIL` y `INIT_ADMIN_PASSWORD`). Utiliza una contraseña robusta y no la guardes en el repositorio.
- No existe registro público: el alta de usuarios la realiza un administrador.
- Las contraseñas de alta y cambio deben tener entre 12 y 72 caracteres, incluir mayúscula, minúscula, número y al menos un símbolo de `@$!%*?&`; no admiten espacios ni otros símbolos. Auth devuelve los errores de validación por campo y la interfaz los muestra junto al campo correspondiente.

Scoring valida el JWT emitido por Auth y permite `Authorization` en CORS. Por eso `VITE_SCORING_SENDS_TOKEN=true` para el flujo real; Auth y Query también comparten la sesión de usuario.

## 2. Desarrollo local

1. Inicia PostgreSQL y las tres APIs siguiendo sus propias guías. Las tres APIs deben compartir issuer, claves públicas y base de datos; configura el mismo origen CORS en cada servicio.
2. Crea el archivo `.env` a partir de `.env.example` y ajusta las URLs si tus servicios utilizan otros puertos.
3. Instala dependencias y ejecuta el frontend:

   ```bash
   npm install
   npm run dev
   ```

4. Abre la URL indicada por Vite en la terminal (normalmente `http://localhost:5173`). Configura también `VITE_EVALUATION_QUERY_BASE_URL`.

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

## 5. Integración local con Docker Compose

El Compose del frontend construye Auth, Scoring, Evaluation Query y Credit-Compass, además de una base PostgreSQL local. Es una configuración de desarrollo: usa un único usuario de base con privilegios amplios y no debe desplegarse en producción. Scoring inicia primero para aplicar las migraciones V1–V12; Auth inicia después porque comparte el historial Flyway de `public` y usa versiones V100–V109. Query aplica sus migraciones V1–V2 en `consulta`.

Auth monta los PEM de `../auth/keys` solo en runtime. Scoring y Query montan la clave pública de Auth y el par de servicio S1 de Scoring, que debe ser distinto del par de Auth. La carpeta privada S1 se mantiene fuera de los repositorios.

1. Asegúrate de que `auth/keys/jwt-privada.pem` y `auth/keys/jwt-publica.pem` sean el par PEM de Auth.
2. Genera el par independiente S1 desde PowerShell (requiere OpenSSL):

   ```powershell
   $sagaKeys = "C:\Users\Juan Mona\Documents\Codex\.local-secrets\veridica\saga"
   New-Item -ItemType Directory -Force -Path $sagaKeys | Out-Null
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out (Join-Path $sagaKeys "dev-local-privada.pem")
   openssl pkey -in (Join-Path $sagaKeys "dev-local-privada.pem") -pubout -out (Join-Path $sagaKeys "dev-local-publica.pem")
   ```

3. Copia `.env.integration.example` a `.env.integration`. Cambia las contraseñas de ejemplo y confirma que `SCORING_SAGA_KEYS_DIR` apunta a la carpeta S1. No agregues `.env.integration` ni PEM al repositorio. Auth trae un usuario seed en su migración V105; sus variables `INIT_ADMIN_*` solo crean otro administrador cuando no existe ninguno y no reemplazan el seed. Cambia de inmediato la contraseña de la cuenta seed desde Mi cuenta antes de usar datos reales.
4. Inicia toda la solución desde `credit-compass`:

```bash
docker compose --env-file .env.integration up --build
```

El frontend queda en `http://localhost:3000`; Auth en `:8081`, Scoring en `:8080`, Query en `:8082` y PostgreSQL en `:5433`. Los `VITE_*` apuntan a `localhost` porque las peticiones se hacen desde el navegador, no desde la red interna de Docker.

Compose pasa las variables `VITE_*` como argumentos de compilación. Para apagar el conjunto:

```bash
docker compose --env-file .env.integration down
```

La base conserva datos en un volumen Docker. `down -v` elimina ese volumen y todos los datos locales. No lo uses si quieres conservar la base.

## 6. Construir y ejecutar la imagen Docker

Ejemplo de construcción:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8080 \
  --build-arg VITE_AUTH_BASE_URL=http://localhost:8081 \
  --build-arg VITE_EVALUATION_QUERY_BASE_URL=http://localhost:8082 \
  --build-arg VITE_SCORING_SENDS_TOKEN=true \
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
- `GET /api/v1/politicas-clasificacion/vigente`
- `POST /api/v1/politicas-clasificacion` (solo `ADMINISTRADOR_RIESGO`)

Y del Security-Module:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/validate`
- `GET /api/v1/usuarios/{id}`

La interfaz consume el scoring transaccional, el login/sesión de Auth y en Query las rutas de explicación, recomendaciones e historial. Las tablas/listados de reglas, informes y el dashboard aún pueden ser informativos donde los backends no tienen endpoints correspondientes.

La ruta `/panel/politica-clasificacion` consulta la política vigente para ambos roles. Solo `ADMINISTRADOR_RIESGO` puede publicar una política o una nueva versión; los rangos se validan en el frontend y Scoring vuelve a validarlos antes de hacerla vigente. Se deben definir exactamente tres rangos enteros, sin huecos ni solapamientos, que cubran de -100 a 130.

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
| Buscar un solicitante devuelve su ficha pero Query falla | Revisa la disponibilidad y la aceptación del JWT en Query. Un 401 de Query no cierra por sí solo la sesión; solo se cierra cuando Auth confirma que el refresh token ya no es utilizable. |
