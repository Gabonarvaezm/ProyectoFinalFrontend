# DiscerIA

## Asistente académico con OpenRouter

El navegador envía las consultas a `/api/chat`. El servidor Express consulta OpenRouter y mantiene la clave fuera del código público. La página del chatbot y los asistentes laterales de estudiante y profesor utilizan el mismo servicio.

Configura `OPENROUTER_API_KEY` en un archivo `frontend/.env` tomando `.env.example` como referencia. Este archivo está excluido de Git. `OPENROUTER_MODEL` permite cambiar el modelo; su valor inicial es `nvidia/nemotron-3-ultra-550b-a55b:free`.

La API localiza `.env` desde la raíz del proyecto tanto al ejecutar el código fuente como la compilación de producción. No requiere `--env-file` ni iniciar Node desde una carpeta específica. Las variables no vacías del entorno del despliegue tienen prioridad. Si agregas la clave al archivo después de iniciar la API, la siguiente consulta ya puede utilizarla.

Desde `frontend`, con Node.js 24:

```bash
npm start
```

Este comando inicia Angular en `http://localhost:4200` y la API local en `127.0.0.1:3001`. El proxy de Angular comunica ambas aplicaciones. En PowerShell con restricciones para scripts, utiliza `npm.cmd start`.

Para iniciarlas por separado, usa `npm run start:api` y `npx ng serve` en terminales distintas. Para producción, ejecuta `npm run build` y `npm run serve:ssr:DiscerIA`; el servidor de producción incluye `/api/chat` y carga las variables de `.env` o del entorno del despliegue.

La aplicación envía hasta veinte mensajes previos como contexto. Si OpenRouter rechaza la clave, agota su cuota o no responde, se muestra un error y se recupera la consulta para reintentar. No se generan respuestas académicas simuladas como sustitución.

Validación:

```bash
npm test -- --watch=false
npm run test:api
```

Referencia del proveedor: [Chat completions de OpenRouter](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request).

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
