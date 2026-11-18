# Corrección de consulta docente de avances y entregas

## Diagnóstico en el código anterior

Se inspeccionaron LocalAcademicRepository, LocalPersistenceService, AuthService, AcademicSyncService, TareaService, modelos de tareas, formulario de asignación, formulario de estudiante, detalle, panel de seguimiento y dashboards.

La persistencia local ya almacenaba los borradores y las entregas en el mismo documento. El problema comprobable de acceso estaba en su presentación e integración:

1. En el dashboard, ProfesorStudentTableComponent mostraba nombre, score y estado, pero no emitía selección de estudiante. El botón «Ver Todos» carecía de manejador. Desde «Progreso de Estudiantes» no había forma de abrir el historial real del alumno.
2. AcademicProgressComponent mostraba estados e indicadores, sin acciones para abrir la actividad o entrega de la fila. Tampoco permitía seleccionar por studentId: solo filtrar texto de nombre/correo.
3. La selección inicial de TareaDetailModalComponent se apoyaba en mySubmission. En el snapshot docente ese campo se obtiene con find(submittedAt), por lo que un borrador sin envío no era el registro inicial. Era necesario descubrir otra selección manual detrás de «Entregas (0)» y «Ver avances y entrega».
4. Tarea.activeTarea guardaba una copia del objeto abierto. La actualización del snapshot no actualizaba esa copia; el modal podía seguir mostrando contenido o estado obsoleto. El formulario docente se reiniciaba cada vez que recibía otro objeto, aunque no hubiese cambios en la entrega.
5. El historial de borradores conservaba texto y fechas de versiones anteriores, pero no el archivo de una entrega definitiva reemplazada por un borrador de corrección.

La prueba local anterior verificaba el camino específico /tareas → Entregas → selección manual, y no el camino del usuario desde la tabla «Progreso de Estudiantes» del dashboard. Eso explica el alcance insuficiente de la comprobación anterior; no se presenta una tabla de ejemplo como prueba de una entrega real.

No se inspeccionó el localStorage personal del navegador del usuario: las pruebas reproducen el fallo de navegación y selección sobre el código del proyecto y registros creados mediante su interfaz.

## Correcciones

- El nombre del alumno en «Progreso de Estudiantes» abre su historial. «Ver Todos» abre el seguimiento de la cohorte.
- Se reutiliza el módulo Tarea embebido en el dashboard: mismo servicio, mismos formularios y mismo detalle; no existe un repositorio docente paralelo.
- El panel permite seleccionar un alumno por identificador y abrir la actividad exacta desde su fila con «Ver avance», «Ver entrega» o «Ver actividad». El selector visual refleja ese identificador también al cargar opciones de manera reactiva.
- Los indicadores incluyen asignadas, iniciadas, avances guardados, entregadas, pendientes, vencidas, promedio y cumplimiento. El promedio solo incluye notas existentes; no hay porcentajes de desarrollo inventados.
- El modal recibe el studentId de la fila y selecciona el registro de ese alumno, incluido el borrador. No sustituye un alumno sin avances por la entrega de otro.
- El detalle de lectura se resuelve a partir del identificador en la lista vigente de TareaService. La selección permanece al refrescar el objeto; el formulario conserva una nota o feedback en edición cuando el contenido persistido no cambia.
- Se muestran fecha de actualización, fecha de entrega, contenido, adjuntos, nota, feedback e historial. Un borrador es de solo lectura para el profesor y no ofrece calificación.
- La revisión, corrección y calificación usan las acciones existentes y muestran error si el repositorio rechaza el cambio. Los controles se deshabilitan mientras se guarda.
- Al guardar una corrección se conserva en el historial el archivo de la entrega definitiva anterior. Se puede consultar el contenido definitivo anterior separado del borrador de corrección actual.

## Archivos corregidos

Rutas relativas a frontend:

- src/app/profesor/profesor.ts y profesor.html: apertura del historial del alumno y reutilización del módulo embebido.
- src/app/profesor/components/profesor-student-table/*: selección real de alumno y acción Ver Todos.
- src/app/tarea/components/academic-progress.component.ts y .spec.ts: filtro por studentId, contadores y apertura de filas.
- src/app/tarea/tarea.ts, tarea.html y tarea.spec.ts: selección de alumno, detalle conectado al estado vigente y bloqueo durante el guardado.
- src/app/tarea/components/tarea-detail-modal/*: consulta específica, fechas, lectura sin edición, selección estable y revisión/calificación.
- src/app/tarea/models/tarea.model.ts: campos opcionales compatibles para adjuntos históricos.
- src/app/core/services/local-academic.repository.ts y .spec.ts: preservación del adjunto de la entrega definitiva al guardar correcciones y prueba de compatibilidad.
- src/app/estudiante/estudiante.html: conexión de la acción del panel con el módulo de tareas existente.
- e2e-local/local.spec.mjs: actualización del selector de avances y nuevos escenarios A–E desde el dashboard en ambos temas/tamaños.
- e2e/academic.spec.mjs: selector de la acción Ver avance actualizado para la regresión en modo servidor.

Los servicios AuthService, AcademicSyncService y TareaService fueron auditados y se conserva su cadena de persistencia. No se agregó otra fuente de datos ni una API para obtener las entregas locales.

## Persistencia y compatibilidad

No se cambia la clave ni la versión del almacenamiento y no se llama a localStorage.clear() para arreglar la aplicación. La versión existente sigue siendo v1:

| Clave | Uso |
| --- | --- |
| disceria_local_academic_v1 | Usuarios, tareas, asignaciones, borradores/entregas, notas, feedback, archivos e historial. |
| disceria_local_session_v1 | Perfil de demostración actualmente seleccionado. |
| disceria_preferences_v1 | Preferencias por perfil. |
| disceria_theme_preference | Tema activo del navegador. |

Las claves antiguas de caché (por ejemplo disceria_academic_tareas) no sustituyen al documento canónico. No se importan tareas sin propietario o relación verificable de manera automática ni se atribuyen a un docente arbitrario.

La única ampliación persistida es attachment/attachmentUrl opcionales en entradas de history correspondientes a entregas definitivas. Los documentos previos sin esos campos siguen siendo válidos; no requieren migración ni reescritura al leer. La prueba de compatibilidad comprueba que snapshot no modifica el documento guardado. Un adjunto que una versión anterior ya descartó no puede reconstruirse: se conserva el texto histórico existente y se documenta esa limitación.

## Relaciones y estados

| Concepto solicitado | Equivalente existente |
| --- | --- |
| teacherId | tareas[].ownerId, id del perfil docente que publicó. |
| taskId | tareas[].id y submissions[].tareaId. |
| studentId | submissions[].studentId; asignación mediante tareas[].recipientEmails a perfiles registrados. |
| submissionId | submissions[].id, construido como tareaId:studentId. |
| draftContent | submissions[].content cuando no hay envío definitivo o se desarrolla corrección. |
| submittedContent | submissions[].content cuando submittedAt existe; versiones anteriores en history. |
| status | Estado persistido de la entrega y estado calculado en recipients para cada alumno. |
| grade/feedback | submissions[].grade / feedback, con historial anterior. |
| updatedAt/submittedAt | Fechas del guardado y del envío definitivo, respectivamente. |

Guardar borrador conserva en_progreso; el contador de entregas no aumenta. Entregar fija submittedAt y cierra edición. Solo el propietario docente puede revisar, calificar o autorizar corrección. La corrección puede guardarse sin contarse como nueva entrega hasta enviarse. Alumnos distintos no reciben las entregas ajenas en el snapshot.

Profesor y estudiante utilizan AcademicSyncService → LocalAcademicRepository en modo local. Logout elimina la sesión, no el documento académico. La configuración local evita peticiones /api/academic/*; el modo servidor opcional permanece separado. Se conservan controles de rol en rutas y repositorio. localStorage solo ofrece separación lógica y puede manipularse desde el navegador.

## Verificaciones

Comandos desde frontend:

```powershell
npm.cmd test -- --watch=false
npm.cmd run build
npm.cmd run test:api
npm.cmd run test:e2e:local
npm.cmd run test:e2e
```

Los nuevos escenarios de navegador se ejecutan desde el dashboard docente en escritorio claro y móvil oscuro, con perfiles registrados por la interfaz. Siguen A–E: docente asigna y sale; alumno guarda y sale; docente selecciona alumno y abre el avance exacto, de solo lectura; alumno recupera y entrega; docente abre la entrega, revisa y califica; alumno vuelve a entrar, recarga y comprueba su resultado. Se comprueba que persiste un único taskId y submissionId, sin recrear la tarea y sin peticiones académicas.

Pruebas de regresión agregadas: selección de borrador por alumno, alumno sin avances no muestra entrega ajena, selección estable al refrescar, nota en edición no borrada por refresco idéntico, detalle conectado al estado vigente, apertura de fila con taskId/studentId exactos, compatibilidad v1 y adjunto definitivo retenido en corrección.

Resultados finales sobre la versión entregada:

| Comprobación | Resultado |
| --- | --- |
| Angular / Vitest | 279 pruebas aprobadas, 40 archivos; sin fallos. |
| Build de producción | Correcto, 3 rutas prerenderizadas. |
| API y regresiones de IA | 26 pruebas aprobadas. |
| E2E local sin API | 5 pruebas aprobadas, 0 fallos. Incluye A–E desde dashboard, escritorio claro y móvil oscuro, más el flujo anterior con corrección/reenvío. |
| E2E servidor opcional | 5 pruebas aprobadas, 0 fallos. |
| Axe | Sin infracciones WCAG A/AA en los detalles de borrador docente comprobados en claro y oscuro; se conservan comprobaciones de Foro y Tareas. |
| Solicitudes /api/academic/* en local | 0; comprobado en todas las pruebas locales. |
| git diff --check | Sin errores. |

Evidencias del escenario A–E real desde el dashboard:

- [Profesor abre el borrador guardado — escritorio claro](../test-results-local/seguimiento-borrador-light.png).
- [Profesor abre el borrador guardado — móvil oscuro](../test-results-local/seguimiento-borrador-dark.png).
- [Profesor revisa y califica la entrega — escritorio claro](../test-results-local/seguimiento-entrega-light.png).
- [Profesor revisa y califica la entrega — móvil oscuro](../test-results-local/seguimiento-entrega-dark.png).
- [Resultados estructurados de Playwright local](../test-results-local/results.json).
- [Resultados estructurados del modo servidor](../test-results/e2e-results.json).

Las capturas fueron inspeccionadas visualmente. Los artefactos están excluidos de Git y se regeneran con los comandos indicados. Para evitar dependencias visuales remotas, la suite local bloquea recursos HTTPS externos opcionales, lo que puede producir avisos de preload; no hubo errores de proxy académico. Permanecen los avisos preexistentes de lottie-web/eval y canvas ausente en jsdom.

## Límites

- Los datos solo se comparten al alternar cuentas del mismo navegador/perfil y origen. No hay sincronización entre dispositivos.
- El acceso local por correo es de demostración, no seguridad de producción ni verificación institucional.
- Los adjuntos continúan limitados a 180 KB y sujetos a la cuota de localStorage.
- No se recuperan archivos históricos ya perdidos por versiones anteriores; no se inventan datos ni se limpia el almacenamiento del usuario.
- Las capturas y la base de pruebas corresponden a perfiles creados en un contexto de navegador aislado; no contienen datos personales del navegador del usuario.
