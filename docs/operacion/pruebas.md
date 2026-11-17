# Pruebas de credit-compass

Desde `credit-compass`, ejecutar `bun test` o `npm test`. La suite usa Bun Test y cubre:

- Decisiones del guard de rutas por estado de sesión y rol, además de casos válidos y rechazados para `redirect`.
- Política CSP: nonce, orígenes permitidos y directivas que deben permanecer bloqueadas.
- Almacenamiento de tokens: access token en memoria, refresh token en `sessionStorage`, ausencia de uso de `localStorage`, SSR y almacenamiento bloqueado.
- Redacción de información sensible en mensajes, stacks, causas, metadatos estructurados y telemetría.
- Regla ESLint que prohíbe `dangerouslySetInnerHTML` en JSX/TSX.

Las pruebas unitarias no necesitan conexión con las APIs.

Verificaciones adicionales:

- `npm run lint`: análisis estático y formato.
- `npx tsc --noEmit`: comprobación de tipos (si el proyecto mantiene el comando TypeScript disponible).
- `npm run build`: compilación de producción.

Ejecutar las verificaciones desde la raíz del repositorio después de instalar las dependencias.
