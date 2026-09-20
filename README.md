# Credit Compass

Eres un Ingeniero de sistemas con una especialización impecable en desarrollo Frontend.

Usando como referencia el siguiente repositorio Git
https://github.com/Alejandra2106/motor-scoring-crediticio.git

Deberás realizar una estructura frontend robusta y escalable que se pueda integrar fácilmente  al backend creado en el repositorio de git, para ello tomarás como referencia técnica la siguiente documentación (Para que entres en contexto del proyecto y veas que es lo implementado hasta el momento):
https://docs.google.com/document/d/1faG1oTXxPxx33CfX3_yW_UE0IR8qDieB6DT_MwZ39hs/edit?tab=t.0

Luego de entender el proyecto te daré las siguientes instrucciones a seguir:
- El proyecto frontend debe seguir buenas practicas UI/UX 
- Deberás usar como framework React o Angular
- El proyecto frontend  debe contar con estándares actuales de accesibilidad
- El proyecto frontend  debe de dockerizarse para un posible despliegue en cualquier plataforma que acepte docker
- El diseño de la plataforma debe tener colores simples y agradables a la vista (Nada de colores fuertes) y un diseño moderno e interesante para los posibles clientes (También debe poder contar con un modo oscuro y un modo para daltónicos)
- El diseño de la plataforma debe ser intuitiva para usuarios poco familiarizados con aplicaciones web

Finalmente estarás abierto a posibles cambios con el tiempo según vaya escalando el proyecto

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6e60c05f-37da-44f0-80ed-3aa85ab0fa26).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Docker

Este proyecto puede desplegarse como contenedor Docker en cualquier
plataforma que lo soporte. Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para
el detalle de cómo funciona, cómo construir la imagen y las variables de
entorno disponibles.

```sh
docker build -t credit-compass-frontend --build-arg VITE_API_BASE_URL=https://tu-backend.example.com .
docker run -p 3000:3000 credit-compass-frontend
```
