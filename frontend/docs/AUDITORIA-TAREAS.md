# Auditoría DiscerIA: tareas y seguimiento académico

Fecha de trabajo: 18 de noviembre de 2026, America/Bogota.

## Resultado y alcance

Se completó el módulo existente de tareas; no se creó otro servicio, ruta ni base académica paralela. Se mantuvieron Angular, Express, SQLite y los componentes y tokens de DiscerIA. Los cambios que ya tenía el árbol de trabajo se conservaron. El informe distingue esta intervención de esas modificaciones anteriores.

El flujo de aceptación se prueba con dos sesiones de navegador y registros reales de una base SQLite aislada: profesor asigna → estudiante guarda borrador → recarga y recupera → entrega → profesor revisa → califica → estudiante consulta feedback y descarga su archivo. Una prueba adicional cierra y vuelve a abrir SQLite para comprobar borradores, archivos y calificaciones.

## Matriz de funcionalidades

| Funcionalidad | Situación encontrada | Intervención y resultado |
| --- | --- | --- |
| Crear título, descripción, asignatura, fecha y escala | Formulario y evento existentes | Conservados; guardado confirmado por servidor y validación de escala/fecha. |
| Instrucciones y criterios | Solo descripción general | Campos específicos agregados y visibles al desarrollar y consultar. |
| Asignación individual o múltiple | Todas las tareas eran públicas | Lista de destinatarios validada contra estudiantes de la institución; vacío asigna a estudiantes registrados actuales de esa institución. Destinatarios quedan fijados al publicar. |
| Grupos y periodos académicos con nombre | No hay entidades ni endpoints para estos catálogos | Pendiente integración de catálogos institucionales; selección múltiple por correos y filtro por fechas disponibles. No se inventaron grupos o periodos. |
| Materiales de apoyo | Nombre de archivo sin contenido | Carga, validación, persistencia y descarga real de material. Se retiró el campo decorativo del formulario. |
| Consultar destinatarios y todas las entregas | Profesor recibía solo la primera entrega | Lista de estudiantes, estado y selección de avances/entrega individual. |
| Comenzar y continuar trabajo | Solo envío definitivo | Guardar borrador y recuperar contenido/archivo después de recarga o nueva sesión. |
| Borrador frente a entrega | No había distinción | Eventos diferentes; un borrador no tiene submittedAt, no cuenta como entregado y no puede calificarse. |
| Entrega definitiva | Se aceptaba un objeto arbitrario del cliente | Servidor determina identidad, estado, fecha, revisión y campos permitidos; cierra edición tras entregar. |
| Revisar, calificar y retroalimentar | Nota existente; sin revisión explícita | Inicio de revisión, nota según maxScore, feedback requerido y corrección autorizada. |
| Solicitar corrección y reenviar | No existía | Estado propio; docente habilita corrección y estudiante guarda/reenvía sin poder borrar unilateralmente una nota. |
| Historial | No existía | Se conservan versiones previas de contenido, fechas, notas y feedback; consultables en detalle. Los archivos históricos no se duplican por cada guardado. |
| Vencimiento | Estado fijo del catálogo | Calculado con fecha límite al cierre del día en Colombia; bloquea nuevos guardados/envíos fuera de plazo salvo corrección autorizada. |
| Cumplimiento y rendimiento | Sin panel basado en entregas | Asignaciones, definitivas, pendientes, vencidas, cumplimiento, promedio normalizado, historial cronológico y señales de atención. |
| Avance de desarrollo | No había borradores | Muestra estado y contenido guardado; no inventa porcentajes de desarrollo. |
| Filtros | Estado, asignatura y búsqueda de tareas | Conservados; panel agrega estudiante, asignatura y rango de fechas de asignación. |
| Sesiones y persistencia | SQLite existente y caché local de tareas | Tareas usan exclusivamente la respuesta de API; se retiraron lectura/escritura de caché académica y migración automática de tareas locales. |
| Datos de ejemplo | Tareas presembradas con contadores ficticios | Nuevas bases no siembran tareas; filas antiguas idénticas al catálogo de ejemplo se excluyen del seguimiento sin borrarlas. |
| Conflictos | Último guardado sobrescribía el anterior | Revisión de borrador obligatoria y conflicto 409; calificación admite revisión para detectar cambios de entrega. Transacciones e idempotencia existentes conservadas. |
| Permisos | Faltaba comprobar asignación al entregar | Estudiante debe tener asignación; docente debe ser propietario de tarea; otro estudiante no recibe entregas ajenas ni adjuntos; campos de nota enviados por estudiante se descartan. |
| Avisos | Botón de tareas mostraba texto fijo | Lista real de avisos de tarea, marca de lectura persistida y avisos según revisión/corrección/calificación. |
| Errores | Mensajes de éxito antes de persistir | Formularios esperan respuesta; ante rechazo conservan trabajo y muestran aviso de error. |
| Claro/oscuro | Contrastes insuficientes | Botones, prioridades, etiquetas, metadatos y enlaces usan tokens con contraste apropiado; sin cambiar tipografías o paleta institucional. |
| Foro móvil | Contenido se extendía fuera de pantalla | Columna del feed limitada al ancho disponible y textos con ajuste de línea. |
| Accesibilidad | Nombres accesibles incongruentes y tabla sin foco | Nombres corregidos; tabla desplazable por teclado; modales con foco, Tab contenido y Escape. Axe comprueba rutas y formulario docente. |

## Modelo y transiciones

- Sin registro: pendiente; si vence, vencida.
- Guardado: en_progreso, con revisión y fecha de actualización.
- Envío definitivo: entregada, con submittedAt generado por servidor.
- Docente: entregada → en_revision → calificada; también puede calificar directamente una entrega definitiva.
- Corrección autorizada: entregada/en_revision/calificada → requiere_correccion → nuevo envío definitivo.
- Guardar una corrección mantiene la autorización y la retroalimentación; un borrador o una corrección todavía no enviada no se puede calificar.
- Una nota no se elimina iniciando revisión de una entrega ya calificada.

Cumplimiento = entregadas/en revisión/calificadas entre asignaciones. Promedio = media de grade/maxScore × 100, exclusivamente entre registros con nota. Atención: vencidas, correcciones o nota inferior al 50% de la escala, coherente con el umbral existente del análisis docente. Sin notas o asignaciones se muestra «Sin datos» o «Sin calificaciones».

## API utilizada

Se conservaron los endpoints existentes:

| Endpoint | Uso |
| --- | --- |
| POST /api/academic/login | Sesión real de profesor o estudiante. |
| POST /api/academic/register | Cuentas registradas en pruebas y registro existente. |
| GET /api/academic/state | Tareas visibles, destinatarios docentes, entregas autorizadas y avisos. |
| POST /api/academic/events | Cambios transaccionales e idempotentes. |

Eventos de tareas: tarea.publish, tarea.delete, tarea.draft, tarea.submit, tarea.review, tarea.correction y tarea.grade. Lectura de avisos: notice.receipt. No se agregaron endpoints ficticios para archivos: el adjunto forma parte del documento autorizado en SQLite y llega solo en el estado visible del usuario autenticado. La descarga genera un Blob desde ese contenido. Se limita a un material por tarea y un adjunto por entrega, de hasta 180 KB, PDF/PNG/JPEG/TXT; el servidor valida tipo y contenido. Los enlaces externos deben usar HTTPS y dependen del permiso del proveedor externo.

## Archivos de esta intervención

Rutas relativas a frontend/:

- src/server/academic-api.mjs: ciclo de vida, destinatarios, permisos, archivos, concurrencia y snapshots.
- src/app/core/services/tarea.service.ts y tarea.service.spec.ts: estado confirmado por API y pruebas sin caché local.
- src/app/core/services/academic-sync.service.ts: commit confirmado, protección ante lecturas antiguas y retirada de importación local de tareas. Se preservaron modificaciones previas de ese archivo.
- src/app/tarea/models/tarea.model.ts y data/tarea.data.ts: estados, adjuntos, revisión, destinatarios y filtros.
- src/app/tarea/tarea.ts, tarea.html, tarea.scss y tarea.spec.ts: conexión del flujo, panel y avisos reales.
- src/app/tarea/components/tarea-profesor-form/*: instrucciones, criterios, destinatarios y material real.
- src/app/tarea/components/tarea-estudiante-form/*: borrador recuperable y envío independiente con archivo.
- src/app/tarea/components/tarea-detail-modal/*: destinatarios, selección de entrega, revisión, corrección, notas e historial.
- src/app/tarea/components/tarea-card/* y tarea-filters/tarea-filters.component.scss: estados y contraste.
- src/app/tarea/components/academic-progress.component.ts y .spec.ts: indicadores calculados y filtros.
- src/app/tarea/components/task-file.component.ts y dialog-focus.directive.ts: archivos y foco de modales.
- src/app/foro/foro.html, foro.scss y estilos de sus componentes: ajustes de ancho y contraste sobre el trabajo previo; foro-post-card.component.html: nombres accesibles de acciones.
- src/app/shared/components/action-toast/*: tono de error usando el componente compartido existente.
- src/styles/_components.scss: contraste de botones compartidos.
- scripts/academic-api.test.mjs: integración real, permisos y reinicio SQLite.
- e2e/academic.spec.mjs, playwright.config.mjs, scripts/run-academic-e2e.mjs y scripts/serve-academic-e2e.mjs: pruebas reproducibles con Edge y SQLite aislado; no escriben en data/academic.sqlite.
- package.json y package-lock.json: Playwright, axe y comando test:e2e.
- .gitignore: excluye resultados y reportes generados.

## Verificación

Desde frontend/:

```powershell
npm.cmd run build
npm.cmd run test:api
npm.cmd test -- --watch=false
npm.cmd run test:e2e
```

La suite E2E requiere Microsoft Edge instalado. Utiliza el build de producción en dist/DiscerIA/browser y un servidor de prueba en 127.0.0.1:4310. Cada ejecución crea una base nueva bajo tmp/e2e; no utiliza datos académicos personales. Los usuarios de demostración se usan únicamente para autenticar las pruebas de flujo existentes.

Resultados finales sobre el código de esta intervención:

| Comprobación | Resultado |
| --- | --- |
| Build de producción | Correcto; 3 rutas prerenderizadas. |
| API | 26 pruebas aprobadas, 0 fallos. Incluye dos alumnos con entregas privadas, rechazo de otro docente, revisión obsoleta y reinicio SQLite. |
| Angular / Vitest | 265 pruebas aprobadas en 38 archivos, 0 fallos. |
| Edge / Playwright | 5 pruebas E2E aprobadas, 0 fallos. |
| axe | Sin infracciones WCAG A/AA en tareas, formulario de asignación y Foro, claro/oscuro y escritorio/móvil. |
| Diff | git diff --check sin errores. |

Evidencias generadas en la última ejecución (rutas relativas a este documento):

- [Resultado estructurado E2E](../test-results/e2e-results.json).
- [Entrega calificada y feedback](../test-results/academic-graded.png).
- [Tareas en escritorio claro](../test-results/tareas-light-desktop.png).
- [Tareas en móvil oscuro](../test-results/tareas-dark-mobile.png).
- [Foro en escritorio claro](../test-results/foro-light-desktop.png).
- [Foro en móvil oscuro](../test-results/foro-dark-mobile.png).

Las capturas se revisaron visualmente y los resultados generados están excluidos de Git. La suite restaura el contenido de test-results/ en cada ejecución. El Foro usa un respaldo visual cuando no carga un avatar externo; su contraste también se comprobó con axe.

## Límites comprobables

- La infraestructura de identidad conserva su registro de rol e institución autodeclarados y cuentas de demostración preexistentes. Antes de exponer el sistema en producción debe existir un proceso institucional que verifique docentes, matrículas y pertenencia a cursos; las pruebas comprueban autorización entre las cuentas y asignaciones existentes, no esa validación organizativa externa.
- No existe catálogo de grupos o periodos académicos. El rango de fechas no se presenta como un periodo institucional inventado.
- Los adjuntos se almacenan dentro de documentos SQLite; es una implementación funcional con límite explícito, no almacenamiento masivo de archivos.
- Las pruebas de navegador usan sesiones separadas del mismo equipo; no sustituyen una comprobación de despliegue desde un dispositivo físico externo.
- La revisión visual automatizada está centrada en tareas y Foro. La suite existente detecta regresiones del resto de módulos; no equivale a certificar visualmente cada pantalla de toda la plataforma.
- npm informó 12 vulnerabilidades altas durante la instalación. No se aplicaron actualizaciones mayores ni npm audit fix --force fuera de alcance. El build conserva un aviso de eval en la dependencia lottie-web; las pruebas jsdom informan que canvas no está implementado.

El flujo académico local puede aceptarse al pasar las pruebas finales; este informe no certifica un despliegue público ni la verificación de identidad institucional.
