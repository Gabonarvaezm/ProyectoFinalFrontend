# DiscerIA

La aplicación utiliza **Angular + Supabase** para autenticación, datos compartidos, archivos privados y la función del chatbot. La producción se despliega como sitio estático en **Vercel**.

Consulta [DEPLOY_SUPABASE.md](DEPLOY_SUPABASE.md) para aplicar el SQL, configurar Auth y la IA y publicar. La URL y la clave pública actuales ya están conectadas; los pasos del panel de Supabase requieren la cuenta del propietario.

```powershell
npm install
npm start
```

Verificaciones: `npm test -- --watch=false`, `npm run test:supabase`, `npm run build`, `npm run check:supabase`.

---

## Documentación de los modos anteriores (local y Node/SQLite)

Estos modos se conservan como herramientas de desarrollo mediante `npm run start:local` y `npm run start:server`. Las instrucciones históricas de abajo no son el despliegue de producción en Vercel.

# DiscerIA

## Modo local de desarrollo y demostración (predeterminado)

Desde frontend, ejecuta `npm start` o `ng serve`. Solo se inicia Angular en http://localhost:4200. No necesitas iniciar una API en el puerto 3001 para registrar perfiles, iniciar/cerrar sesión, usar Biblioteca y Foro, asignar tareas, guardar borradores, entregar, revisar y calificar.

El modo local utiliza localStorage a través de repositorios y un servicio de persistencia centralizados. Los perfiles de demostración acceden con su correo, sin contraseña. Puedes registrar varios perfiles o usar profesor@universidad.edu y estudiante@universidad.edu. El selector visual de rol no cambia el rol registrado de una cuenta.

Profesor y estudiante deben utilizar el mismo navegador y el mismo origen (protocolo, host y puerto). Alterna perfiles cerrando sesión. No hay sincronización entre dispositivos ni seguridad frente a la edición del almacenamiento del navegador. No introduzcas contraseñas reales ni información sensible.

Los adjuntos PDF/PNG/JPEG/TXT se conservan localmente, hasta 180 KB por archivo y dentro de la cuota disponible. Si una escritura falla, se informa el error y se conserva la versión previamente guardada. Los datos de una API o de otra URL no se importan automáticamente en este modo.

Ver [documentación del modo local](docs/MODO-LOCAL.md) para arquitectura, claves, pruebas y limitaciones.

## Modo servidor (opcional)

`npm run start:server` inicia Angular con la configuración server y la API Node en 3001. `ng serve --configuration server` utiliza la API, que puede iniciarse aparte con `npm run start:api`. El modo se configura mediante environment.academicMode y el token ACADEMIC_MODE. No se selecciona como reacción a errores de conexión: cada modo tiene su repositorio explícito.

`npm run build` conserva la compilación de producción para servidor; `npm run serve:ssr:DiscerIA` ejecuta esa compilación con `/api/academic` y `/api/chat`. El servidor guarda cuentas y contenidos en data/academic.sqlite, que debe conservarse entre despliegues. Las cuentas de demostración del servidor mantienen la contraseña password123. En el modo local no se usa ni almacena esa contraseña.

El flujo SQLite y sus controles de acceso permanecen disponibles. Los datos locales y los del servidor son independientes. El modo servidor requiere un backend disponible y comunica los fallos de conexión.

## Asistente académico con OpenRouter

El navegador envía las consultas a `/api/chat`. El servidor Express consulta OpenRouter y mantiene la clave fuera del código público. La página del chatbot y los asistentes laterales de estudiante y profesor utilizan el mismo servicio.

Configura `OPENROUTER_API_KEY` en un archivo `frontend/.env` tomando `.env.example` como referencia. Este archivo está excluido de Git. `OPENROUTER_MODEL` permite cambiar el modelo; su valor inicial es `nvidia/nemotron-3-ultra-550b-a55b:free`.

La API localiza `.env` desde la raíz del proyecto tanto al ejecutar el código fuente como la compilación de producción. No requiere `--env-file` ni iniciar Node desde una carpeta específica. Las variables no vacías del entorno del despliegue tienen prioridad. Si agregas la clave al archivo después de iniciar la API, la siguiente consulta ya puede utilizarla.

Desde `frontend`, con Node.js 24:

```bash
npm start
```

Este comando inicia solo Angular en `http://localhost:4200`. Para usar la IA, inicia además `npm run start:api`; el proxy comunica `/api/chat` con esa API. Las funciones académicas locales continúan sin utilizar `/api/academic`. En PowerShell con restricciones para scripts, utiliza `npm.cmd start`.

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
npm run test:e2e:local
# Backend conservado (requiere npm run build primero):
npm run test:e2e
```

Las suites utilizan Microsoft Edge y Playwright. La suite local inicia ng serve en 4311 sin iniciar una API y comprueba que no existan peticiones académicas.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
