# DiscerIA: persistencia y demostración local

18 de noviembre de 2026. Esta implementación cambia el modo predeterminado de desarrollo: las funciones académicas ya no dependen de una API en 3001.

## Inicio y modos

Desde frontend:

```powershell
npm.cmd start
# Equivalente, con Angular CLI disponible:
ng serve
```

Abrir http://localhost:4200. No iniciar start:api para usar registro, perfiles, sesiones, Biblioteca, Foro, tareas o seguimiento.

| Ejecución | Modo académico | Backend académico |
| --- | --- | --- |
| ng serve / npm start | local | No se usa. |
| ng serve --configuration server | server | Se requiere iniciarlo aparte. |
| npm run start:server | server | Inicia también la API Node. |
| npm run build | server, producción | Conserva la configuración de producción anterior. |
| ng build --configuration development | local | Compilación de demostración; no usa la API académica. |

La selección se define en environment.academicMode y se inyecta mediante ACADEMIC_MODE. Los entornos development, server y production son explícitos; una caída de red no cambia el modo.

La IA sigue utilizando /api/chat. Cuando se quiera consultar el proveedor, se necesita su API y configuración: `npm run start:api` con OPENROUTER_API_KEY en .env. Eso no convierte las operaciones académicas locales en llamadas de servidor. No se crean respuestas de IA ficticias.

## Causa y corrección del error

AuthService.register enviaba siempre POST /api/academic/register. El login también probaba HTTP antes de una alternativa local y AcademicSyncService consultaba /api/academic/state cada cuatro segundos. El proxy dirigía esas llamadas a 127.0.0.1:3001, produciendo ECONNREFUSED si no había API.

Ahora AuthService selecciona el repositorio antes de realizar una operación. AcademicSyncService conserva su interfaz para los servicios existentes, pero en local lee y modifica LocalAcademicRepository, no arranca el intervalo del servidor, no crea una cola de peticiones y no llama a /api/academic/*. La integración de servidor permanece disponible y sus errores se informan explícitamente.

## Persistencia centralizada

LocalPersistenceService es la única clase de la aplicación que accede directamente a localStorage. Centraliza lectura, escritura y eliminación; expone errores visibles en la aplicación. Los componentes ya no leen un perfil de registro ajeno como sustituto de la cuenta activa.

LocalAcademicRepository mantiene un documento JSON versionado con usuarios, libros, publicaciones, respuestas, votos, tareas, destinatarios, borradores, entregas, archivos, calificaciones, feedback, exámenes publicados, mensajes, notificaciones y recibos de lectura. Los cambios se calculan a partir del último documento leído y se confirman con setItem antes de devolver éxito. Una escritura que excede la cuota no reemplaza la versión anterior.

PreferencesRepository guarda preferencias por identificador de usuario. ThemeService usa el mismo servicio de almacenamiento y conserva la clave de apariencia existente; el tema activo del navegador se comparte entre pestañas. Marcadores, avisos propios y actividad docente se separan por usuario. Biblioteca y Foro consumen el estado canónico; sus cachés antiguos no se convierten en la fuente académica cuando el repositorio está activo.

Claves declaradas en core/models/auth.model.ts:

| Clave | Contenido |
| --- | --- |
| disceria_local_academic_v1 | Documento académico local versionado. |
| disceria_local_session_v1 | Identificador del perfil local activo. |
| disceria_preferences_v1 | Preferencias separadas por identificador de usuario. |
| disceria_theme_preference | Tema de apariencia actual; conserva compatibilidad anterior. |
| disceria_academic_bookmarks:<usuario> | Favoritos propios de Biblioteca. |
| disceria_profesor_notifications:<usuario> | Avisos propios del docente; los recibidos usan recibos del documento académico. |
| disceria_local_activities_v1:<usuario> | Actividad del docente dentro de la demostración. |

## Perfiles y sesiones de demostración

Se pueden registrar varios perfiles. Cada uno recibe un identificador persistente; el rol se toma del perfil registrado y no del tab o un campo arbitrario enviado al iniciar sesión.

El formulario local no pide contraseña. Selecciona Profesor o Estudiante, introduce el correo de un perfil registrado en este navegador y entra. Las cuentas iniciales profesor@universidad.edu y estudiante@universidad.edu permiten una demostración rápida; tampoco necesitan contraseña en este modo. El registro construye el objeto de perfil con campos explícitos: ninguna contraseña, hash o secreto recibido en un objeto se copia a la base local.

Cerrar sesión elimina la sesión local; no borra usuarios ni entregas. Puedes alternar perfiles mediante Configuración → Cerrar Sesión. Se corrigió esa acción en la ruta independiente de Configuración, donde antes solo se emitía un evento sin cerrar la cuenta.

El último perfil antiguo guardado en REGISTERED_USER puede recuperarse como perfil local si tiene un formato válido. No se importan automáticamente cuentas ni entregas de SQLite; ambos modos tienen conjuntos de datos independientes. No se atribuyen tareas antiguas a otro profesor sin información suficiente.

## Flujo académico conservado

- Profesor: crea tarea con consigna, instrucciones, criterios, fecha, escala, destinatarios registrados de su institución y material.
- Estudiante: consulta su asignación, desarrolla y guarda borrador, recupera avances después de recarga, adjunta archivo y envía definitivamente.
- El borrador no cuenta como entregado ni permite calificación.
- Profesor: consulta cada alumno, revisa la entrega, solicita corrección, autoriza el reenvío y califica.
- Estudiante: recibe aviso, consulta nota y feedback, y descarga el archivo de su entrega.
- El panel de seguimiento calcula cumplimiento y notas con esos registros. El dashboard docente usa el nombre del perfil actual y se retiró el avance semanal estático. En el dashboard estudiantil local se reutiliza ese panel real en lugar de mostrar el progreso fijo de ejemplo. Los botones Gestionar tareas y Abrir mis tareas permiten acceder al módulo desde cada dashboard.

Se mantienen pendiente, en_progreso, entregada, en_revision, calificada, requiere_correccion y vencida. Una entrega cerrada no puede editarse hasta que el docente autorice corrección. Se valida revisión de borrador para impedir reemplazar una versión más reciente. La mutación usa la cuenta de la sesión local, no el rol del objeto de una entrega. Web Locks coordina guardados confirmados de tareas entre pestañas compatibles; storage events recargan el estado desde el mismo origen.

Los guards de navegación, las vistas por rol y el repositorio aplican separación lógica. Un alumno no obtiene entregas ajenas a través del snapshot y no puede calificar mediante los servicios. Otro docente no puede gestionar una tarea que no creó. Estas comprobaciones son funcionales de demostración, no seguridad frente a una persona que edite localStorage o el JavaScript.

## Archivos, capacidad y limitaciones

Los adjuntos existentes conservan el límite visible de 180 KB por archivo y formatos PDF, PNG, JPEG y TXT. Se valida tamaño y contenido, se guarda base64 en el documento y se descarga mediante Blob. El almacenamiento base64 ocupa más que el archivo original y comparte cuota con el resto del sitio.

Se evaluó IndexedDB como complemento para archivos grandes. Esta entrega mantiene el contrato de adjuntos pequeños y comunica el límite; no implementa una supuesta subida grande ni afirma guardarla si supera la cuota. Usar archivos mayores requeriría un repositorio de blobs IndexedDB y referencias consistentes con los metadatos, sin depender del backend.

localStorage solo pertenece al navegador/perfil y origen actuales. localhost y 127.0.0.1, HTTP y HTTPS, y puertos distintos son orígenes diferentes. No hay sincronización entre navegadores o dispositivos. Borrar los datos del sitio elimina la demostración. La sesión activa se comparte entre pestañas del mismo origen; alternar perfiles afecta esas pestañas. Sin Web Locks, no se ofrece una garantía de edición concurrente entre pestañas. No debe usarse para guardar información sensible ni presentarse como acceso apto para producción.

## Verificación y evidencia

```powershell
npm.cmd run build
npm.cmd test -- --watch=false
npm.cmd run test:api
npm.cmd run test:e2e:local
# Comprueba además la integración de servidor sobre el build de producción:
npm.cmd run test:e2e
```

La suite local arranca Angular CLI con ng serve en 127.0.0.1:4311 y no inicia una API académica. Intercepta cualquier intento de /api/academic/* y exige cero solicitudes. Registra profesor y estudiante en el mismo contexto/origen, alterna sesiones con la interfaz, guarda/recupera borrador, entrega, solicita corrección, reenvía, califica, consulta progreso y feedback, descarga el adjunto y comprueba que otra cuenta no recibe la tarea.

También comprueba claro/oscuro, escritorio/móvil y desbordamiento en Foro, Biblioteca, Tareas y dashboard docente; revisa el dashboard de estudiante en móvil. Axe revisa Foro, Tareas y la tarjeta de examen del estudiante, cuyo contraste oscuro se ajustó con los tokens existentes. El desbordamiento del dashboard docente se corrigió delimitando la tabla y retirando del layout los paneles laterales cerrados. También se corrigieron el nombre accesible del botón de confirmar logout, el tamaño del acceso a tareas del estudiante y el contraste de la tarjeta de examen en modo oscuro.

Las pruebas unitarias incluyen perfiles múltiples sin secretos, identificadores estables, rechazo de roles falsificados, guardados obsoletos, cuota agotada y datos corruptos sin sobrescritura silenciosa. Las pruebas de servidor e IA se conservan.

Resultados definitivos de esta intervención:

| Verificación | Resultado |
| --- | --- |
| Build de producción (modo servidor) | Correcto, 3 rutas prerenderizadas. |
| Angular / Vitest | 273 pruebas aprobadas en 40 archivos, sin errores no controlados. |
| API y servicios de IA conservados | 26 pruebas aprobadas. |
| E2E local mediante ng serve, sin iniciar API | 3 pruebas aprobadas; 0 fallos, 0 solicitudes a /api/academic/*. |
| E2E servidor conservado | 5 pruebas aprobadas. |
| Apariencia local | Foro, Biblioteca, Tareas y dashboard docente en claro/oscuro, escritorio y móvil; dashboard estudiantil en móvil, ambos temas. Sin desbordamiento del documento. |
| Axe | Sin infracciones WCAG A/AA en Foro, Tareas y la tarjeta de examen del estudiante en las variantes locales comprobadas. |
| Revisión del diff | git diff --check sin errores. |

Evidencias generadas (excluidas de Git):

- [Resultados E2E locales](../test-results-local/results.json).
- [Entrega y calificación locales](../test-results-local/flujo-local-calificado.png).
- [Biblioteca, móvil oscuro](../test-results-local/biblioteca-dark-mobile.png).
- [Foro, móvil claro](../test-results-local/foro-light-mobile.png).
- [Tareas, escritorio oscuro](../test-results-local/tareas-dark-desktop.png).
- [Dashboard docente, móvil claro](../test-results-local/profesor-light-mobile.png).
- [Dashboard estudiantil, móvil oscuro](../test-results-local/estudiante-dark-mobile.png).
- [Resultados del modo servidor](../test-results/e2e-results.json).

El runner local termina su ng serve al finalizar. Las capturas se revisaron y el contador de solicitudes se comprueba en cada prueba. Para aislar recursos opcionales externos durante E2E se bloquean fuentes e imágenes HTTPS remotas; eso puede producir avisos de preload, sin llamadas ni errores de proxy académico. Permanecen los avisos preexistentes de eval en lottie-web y canvas no implementado en jsdom.

## Archivos principales

- core/services/academic-mode.ts y environments/environment*.ts: selección explícita del modo.
- core/services/local-persistence.service.ts: frontera central de almacenamiento y errores.
- core/services/local-academic.repository.ts: perfiles, sesiones, datos y operaciones locales.
- core/services/preferences.repository.ts: preferencias por usuario.
- core/services/auth.service.ts y academic-sync.service.ts: selección de repositorio y ausencia de HTTP académico local.
- core/services/book.service.ts, forum.service.ts, profesor.service.ts, chatbot.service.ts y theme.service.ts: persistencia centralizada, aislamiento de datos propios e integración existente.
- Login, Registro, Configuración, App y academic-sync-status: acceso de demostración explícito, cierre real y mensajes de persistencia.
- Dashboard docente y paneles laterales: perfil real y adaptación móvil.
- local-academic.repository.spec.ts y local-mode.spec.ts: invariantes locales y cero HTTP.
- e2e-local/local.spec.mjs, playwright.local.config.mjs y scripts/run-local-e2e.mjs: pruebas de navegador con Angular sin API.
- README.md y package.json: instrucciones y comandos de cada modo.
