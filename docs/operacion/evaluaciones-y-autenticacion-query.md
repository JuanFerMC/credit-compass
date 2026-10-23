# Evaluaciones del panel y autenticación de Query

## Acceso por rol

- `ANALISTA_CREDITO` puede entrar a Evaluaciones, ejecutar un cálculo y consultar explicación, recomendaciones e historial.
- `ADMINISTRADOR_RIESGO` ya no ve el acceso a Evaluaciones, el botón de nueva evaluación ni el resumen de evaluaciones recientes del panel. La ruta directa también queda bloqueada por la matriz del frontend.
- Este ajuste es de presentación y guard de rutas; no cambia la autorización de `scoring-api` ni `evaluation-query-api`.

## Error de token en Query

La explicación, recomendaciones e historial se consultan en `evaluation-query-api`. Un HTTP 401 con código `NO_AUTENTICADO` ocurre en autenticación: Query no pudo validar el JWT y no llegó a comprobar el rol. Las causas operativas más probables son:

1. `JWT_AUDIENCES` en Auth reemplaza el valor por defecto y no incluye `evaluation-query-api`.
2. `AUTH_JWT_ISSUER` no coincide entre Auth y Query.
3. `EVALUATION_QUERY_JWT_PUBLIC_KEY_LOCATION` apunta a una clave que no corresponde a la clave privada con la que Auth firmó.
4. El token está vencido o fue emitido antes del cambio de configuración. Cerrar sesión y volver a iniciar sesión obtiene un token nuevo.

Valor por defecto documentado en Auth: `JWT_AUDIENCES=scoring-api,evaluation-query-api`. Para Query, `evaluationquery.jwt.audiencia` debe ser `evaluation-query-api`. Auth no se modifica en este bloque.

El front ahora muestra estas comprobaciones cuando Query devuelve 401, en lugar del mensaje genérico de autenticación.
