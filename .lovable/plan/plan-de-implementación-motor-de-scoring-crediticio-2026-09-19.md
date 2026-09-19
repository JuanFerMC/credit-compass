# Plan de implementación — Motor de scoring crediticio

## Objetivo
Construir una aplicación React operativa, accesible y escalable que refleje el flujo completo del motor de scoring y quede preparada para conectarse al backend Spring Boot.

## Alcance
- Crear una estructura compartida con navegación adaptable, encabezados contextuales y selector persistente de apariencia: claro, oscuro y apto para daltonismo.
- Implementar páginas independientes para panel general, solicitantes, variables de riesgo, reglas de scoring, evaluaciones e informes.
- Conectar registro y consulta de solicitantes, y creación de variables, a los endpoints existentes mediante un cliente tipado con validación y manejo uniforme de errores.
- Incluir datos demostrativos y estados claramente identificados para las funciones cuyo backend aún está pendiente.
- Añadir formularios accesibles, validaciones alineadas al backend, mensajes de carga/error/éxito y navegación por teclado.
- Incorporar archivos Docker y documentación de configuración para despliegue portable.

## Diseño y experiencia
- Aplicar la dirección seleccionada “Kinetic glass dashboard”: composición analítica, superficies translúcidas discretas, tipografía Space Grotesk/Inter/JetBrains Mono y animación contenida.
- Mantener riesgo interpretable con texto e iconos además del color.
- Optimizar escritorio y móvil sin ocultar el contexto ni las acciones principales.

## Detalles técnicos
- React 19, TanStack Start/Router/Query, Zod y Tailwind CSS v4.
- Contrato de API configurable mediante `VITE_API_BASE_URL`, sin acoplar la interfaz a datos simulados.
- Módulos y tipos separados por dominio para facilitar la sustitución de mocks por endpoints futuros.
- Metadatos propios por página y estructura compatible con SSR.
- Verificación final de compilación, navegación, formularios, temas y vistas móvil/escritorio.
