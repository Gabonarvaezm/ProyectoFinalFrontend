# DiscerIA

## Contenidos compartidos entre docentes y estudiantes

El registro, el inicio de sesión, la biblioteca, el foro, las tareas, los exámenes publicados y los comunicados utilizan `/api/academic`. El servidor conserva las cuentas y los contenidos en `frontend/data/academic.sqlite`, con SQLite incluido en Node.js 24. La carpeta de datos está excluida de Git y debe conservarse al reiniciar o actualizar el servidor.

Ejecuta `npm start` desde `frontend` para iniciar Angular y la API. Todos los usuarios deben acceder a la misma aplicación y al mismo servidor; cada navegador puede tener su propia sesión. Los paneles consultan novedades cada cuatro segundos, sin recargar la página. No hace falta contratar otro servicio para las pruebas locales.

Al actualizar desde la versión anterior, vuelve a iniciar sesión. Las cuentas de demostración siguen siendo `profesor@universidad.edu` y `estudiante@universidad.edu`, ambas con contraseña `password123`. Las cuentas nuevas se registran en el servidor. Un perfil de registro antiguo que aún exista en el navegador puede migrarse al primer inicio de sesión.

Las publicaciones antiguas de biblioteca, foro y tareas que aún estén guardadas en el navegador del profesor se importan una vez al iniciar sesión. Los exámenes antiguos que solo incrementaban un contador y los mensajes que nunca se conservaron como contenido no pueden reconstruirse: deben volver a publicarse.

Los exámenes muestran los datos que recoge el formulario docente: tema, cantidad de preguntas, dificultad, duración e instrucciones. El formulario actual no incorpora un editor de preguntas ni de respuestas; publicar un examen no genera automáticamente ese contenido.

Los comunicados respetan el grupo seleccionado, incluso al compartirlos en el foro. Cada alumno conserva su propio estado de lectura y eliminación de avisos. Los envíos pendientes se conservan por cuenta y se reintentan al recuperar la conexión. La API comprueba el rol del usuario y no permite que un estudiante publique recursos exclusivos del docente.

Para desplegar la web, el alojamiento debe ejecutar el servidor Node de producción y conservar la base de datos. Subir solamente los archivos estáticos de Angular no habilita la comunicación entre usuarios.

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
