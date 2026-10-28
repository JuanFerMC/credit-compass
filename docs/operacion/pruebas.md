# Pruebas de credit-compass

Desde `credit-compass`, ejecutar `bun test` o `npm test`. La suite usa Bun Test y cubre las decisiones
del guard de rutas por estado de sesión y rol, además de casos válidos y rechazados para `redirect`.
No necesita conexión con las APIs.

`npm run build` comprueba que el frontend compile para producción. El repositorio mantiene `npm run lint`
como verificación separada de estilo.
