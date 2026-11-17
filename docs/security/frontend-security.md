# Políticas de seguridad del frontend

Este documento describe las garantías que deben mantenerse en Credit-Compass al modificar el frontend.

## HTML y contenido externo

- No utilizar `dangerouslySetInnerHTML` en componentes React. ESLint bloquea este atributo en archivos TypeScript/TSX.
- Preferir siempre texto plano y el escape automático de React.
- No insertar directamente HTML recibido desde APIs, parámetros de URL, archivos o usuarios.
- Si una necesidad funcional exige renderizar HTML externo, debe abrirse un cambio específico que incorpore una política de sanitización revisada (por ejemplo, DOMPurify con configuración restrictiva), pruebas de payloads maliciosos y una revisión de seguridad. No se debe desactivar la regla ESLint como solución rápida.

## Almacenamiento de credenciales

- El access token del Security-Module vive exclusivamente en memoria JavaScript.
- El refresh token se conserva en `sessionStorage`, aislado por pestaña. Si el almacenamiento no está disponible, solo se conserva temporalmente en memoria.
- No almacenar access tokens ni refresh tokens en `localStorage`, IndexedDB, cookies accesibles por JavaScript ni estado persistente de React Query.
- El backend sigue siendo la autoridad para validar tokens; el frontend no debe confiar en valores almacenados por el navegador.

Las pruebas de `tests/token-store.test.ts` verifican estos límites y el comportamiento cuando `sessionStorage` está bloqueado o `window` no existe.

## Logs y telemetría

- No registrar tokens, encabezados `Authorization`, contraseñas ni secretos de cliente.
- Los mensajes, stacks, causas y metadatos estructurados deben pasar por la utilidad `src/lib/sensitive-data-redaction.ts` antes de enviarse a logs o telemetría.
- La redacción conserva el contexto técnico útil (por ejemplo, estado HTTP y trace ID) siempre que no contenga credenciales.
- No enviar el objeto Error original ni el contexto sin sanear a proveedores externos de telemetría.

La redacción es una defensa adicional, no una autorización para incluir secretos en mensajes de error. Los nuevos puntos de logging deben seguir evitando credenciales desde su origen.
