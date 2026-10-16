# Credit-Compass (Veridica)

Frontend web para el sistema de scoring crediticio. Permite trabajar con solicitantes, variables de riesgo, reglas, evaluaciones e informes, y ofrece una experiencia diferenciada para **administradores de riesgo** y **analistas de crédito**.

## Funcionalidades actuales

- Inicio de sesión y sesión conectados a **Security-Module**.
- Navegación y funcionalidades visibles según el rol del usuario.
- Gestión administrativa de cuentas: creación, consulta, activación/desactivación y operaciones de contraseña que soporte el backend.
- Área **Mi cuenta**, accesible desde el avatar de la cabecera, para consultar los datos de sesión y cambiar la contraseña propia.
- Formularios de solicitantes y variables de riesgo conectados a los endpoints implementados.
- Interfaz adaptable a escritorio y móvil, navegación por teclado y página pública de presentación.
- Tema visual claro/oscuro.

> **Importante:** la interfaz diferencia los roles, pero la autorización real debe validarse también en Security-Module. Las pantallas de reglas, evaluaciones, informes y métricas pueden mostrar información demostrativa mientras el backend no exponga los endpoints de consulta necesarios. Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para conocer las limitaciones y configuración.

## Tecnologías

- React, TypeScript y TanStack Start/Router
- Vite y Tailwind CSS
- API HTTP para el Motor de Scoring y Security-Module
- Docker para construir y ejecutar el frontend como contenedor

## Requisitos

- Node.js compatible con el proyecto y npm para desarrollo local.
- Para el flujo real, Motor de Scoring y Security-Module deben estar levantados y ser accesibles desde el navegador.
- Alternativamente, Docker y Docker Compose para ejecutar el contenedor.

## Desarrollo local

1. Clona el repositorio y entra en su directorio.
2. Instala dependencias y crea el archivo de entorno:

   ```bash
   npm install
   cp .env.example .env
   ```

   En Windows PowerShell, puedes copiarlo con `Copy-Item .env.example .env`.

3. Ajusta las variables `VITE_API_BASE_URL` y `VITE_AUTH_BASE_URL` en `.env` a las direcciones de los backends que vayas a usar.
4. Inicia el servidor:

   ```bash
   npm run dev
   ```

5. Abre en el navegador la URL que indique la terminal (normalmente `http://localhost:5173`).

Comandos disponibles:

- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación de producción.
- `npm run preview`: previsualización local de la compilación.
- `npm run lint`: análisis estático con ESLint.

## Compartir el frontend en la red local

Para probarlo desde otro ordenador o un móvil conectado a la misma Wi-Fi:

1. Ejecuta Vite escuchando en interfaces de red:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

2. Averigua la IP privada del ordenador que ejecuta el frontend (por ejemplo, `192.168.1.25`) y comparte la URL con el puerto mostrado por Vite, por ejemplo `http://192.168.1.25:5173`.
3. Si no conecta, revisa el firewall del ordenador y que ambos dispositivos estén en la misma red y puedan comunicarse.
4. Configura las URLs de los backends para que sean alcanzables desde el dispositivo remoto. Si el navegador del móvil intenta llamar a `http://localhost:8081`, llamará al propio móvil, no al ordenador que ejecuta Security-Module. En ese escenario usa la IP del ordenador anfitrión y el puerto correspondiente, y configura CORS en cada backend para el origen real del frontend.

No expongas los puertos a Internet solo para realizar esta prueba.

## Documentación adicional

- [Guía de configuración y despliegue](DEPLOYMENT.md): variables de entorno, Docker, CORS, red local y acceso externo.
- [Notas de rutas](src/routes/README.md): estructura y comportamiento de las rutas del frontend.

## Modo demostración

Si `VITE_AUTH_BASE_URL` está vacía, la autenticación usa una sesión simulada en el navegador. No debe confundirse con una autenticación real ni utilizarse para proteger información. Si `VITE_API_BASE_URL` está vacía, algunas vistas del Motor de Scoring recurren a datos o estados demostrativos.

Las variables `VITE_*` se incorporan al frontend durante la compilación; después de modificarlas, reinicia el servidor de desarrollo o vuelve a construir la imagen de producción.
