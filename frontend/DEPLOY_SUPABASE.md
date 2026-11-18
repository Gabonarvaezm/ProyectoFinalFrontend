# DiscerIA: Supabase y Vercel

La aplicación normal (`npm start`) y la compilación de producción utilizan Supabase. No necesitan Express, SQLite ni un servidor Node permanente. La interfaz conserva sus componentes padre-hijo; los repositorios centrales conectan Auth, Postgres, Storage y la función de IA.

## 1. Base de datos (una sola vez)

En el proyecto **wzovaazmfmohqaskldwv**, abre **SQL Editor → New query**, copia todo `supabase/setup.sql` y pulsa **Run**. El archivo se genera desde las migraciones con `node scripts/prepare-supabase.mjs` y es una transacción: si falla, no deja una instalación parcial.

No vuelvas a ejecutar `setup.sql` si ya terminó con Success. Para una instalación hecha durante la preparación del proyecto, ejecuta después `supabase/finish-setup.sql`: valida valores vacíos, recarga PostgREST y muestra la existencia de profiles, academic_snapshot y la autorización docente. No elimina datos.

Se crean:

- `profiles`, con rol protegido y solicitudes de rol docente.
- `academic_documents`, que conserva los contratos actuales de libros, foro, exámenes, mensajes, tareas y entregas.
- `academic_notices` y `academic_votes`.
- RPC `academic_snapshot`, `academic_mutate` y `consume_ai_quota`.
- Esquema `private`, inaccesible por la API pública, para autorizaciones, idempotencia y cuotas.
- Bucket **privado** `academic-files` para PDF, PNG, JPEG y texto, hasta 180 KB. Los archivos no usan enlaces públicos.

En **Project Settings → Data API**, activa la Data API y expón **public**. No expongas `private`. Los permisos de lectura son explícitos; las escrituras académicas pasan por RPC, con controles de propietario, rol, institución, destinatario y revisión.

Para comprobar la API desde `frontend`:

```powershell
npm run check:supabase
```

El resultado esperado es Auth conectado y RPC instalado/protegido. `PGRST202` indica migración pendiente; `PGRST002` indica que PostgREST no puede construir su caché: revisar Data API y sus esquemas expuestos, ejecutar `NOTIFY pgrst, 'reload schema';` y consultar los logs si persiste. Ese error no se arregla cambiando claves públicas.

## 2. Registro y cuentas

El profesor autorizado inicialmente es **juan17patino@gmail.com**, de **Universidad Cooperativa de Colombia**. Debe registrarse en la aplicación con su contraseña y confirmar el correo; el SQL no crea cuentas con contraseñas compartidas. Los estudiantes se registran con la misma institución. La institución aparece prellenada en registro.

La base determina el rol. Cambiar el selector del formulario o los metadatos de Auth no otorga permisos docentes. Para autorizar otro docente, el administrador ejecuta en SQL Editor:

```sql
select private.approve_teacher('docente@ejemplo.edu', 'Universidad Cooperativa de Colombia');
```

Después, esa cuenta vuelve a iniciar sesión. No publiques claves secretas ni `service_role` para realizar esta operación.

En **Authentication → URL Configuration** configura:

- **Site URL**: la URL final de Vercel.
- **Redirect URLs**: `http://localhost:4200/login`, `http://localhost:4200/recuperar-contrasena`, y esas dos rutas en el dominio final de Vercel.

Mantén la confirmación del correo activada. Para que los estudiantes reciban confirmaciones y recuperación de contraseña, configura **Custom SMTP**. El servicio de correo predeterminado de Supabase solo envía a miembros del equipo del proyecto, no a todos los estudiantes. Documentación: https://supabase.com/docs/guides/auth/auth-smtp

Las cuentas y los datos de demostración local o SQLite no se importan automáticamente: cada persona registra una cuenta real y el profesor publica sus materiales. Esto evita subir perfiles ficticios o contenido privado almacenado en otro navegador.

## 3. IA (Edge Function)

La IA se ejecuta en **academic-chat**, nunca directamente desde Angular hacia OpenRouter.

Desde el panel: **Edge Functions → Deploy a new function → Via Editor**. Usa el nombre `academic-chat` y pega todo `supabase/functions/academic-chat/index.ts`. La función es autocontenida. Configura la opción de comprobación JWT heredada como desactivada: el código verifica cada token directamente en Supabase Auth antes de consultar al proveedor, compatible con claves de firma asimétricas. No elimines ese control del código.

Alternativamente, desde `frontend`, con la CLI de Supabase:

```powershell
npx supabase login
npx supabase link --project-ref wzovaazmfmohqaskldwv
npx supabase functions deploy academic-chat
```

En **Edge Functions → Secrets**, define:

| Secreto | Valor |
|---|---|
| `OPENROUTER_API_KEY` | Tu clave de OpenRouter; solo en Supabase |
| `OPENROUTER_MODEL` | El modelo habilitado en tu cuenta |
| `ALLOWED_ORIGINS` | `http://localhost:4200,https://TU-PROYECTO.vercel.app` |

`SUPABASE_URL` y las claves del proyecto son variables incorporadas del entorno de la función. El manejador usa una clave pública, el JWT del usuario y una cuota de 30 consultas por usuario/hora. Ninguna clave privilegiada es necesaria. No pegues la clave de OpenRouter en archivos de Angular ni en variables públicas de Vercel.

Sin desplegar la función y configurar su secreto, la IA no responderá. Las pruebas locales usan un proveedor simulado; no sustituyen una consulta real con tu cuenta.

## 4. Vercel

Sube los cambios al repositorio e importa el proyecto en Vercel:

| Ajuste | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework | Angular |
| Node | `24.x` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist/DiscerIA/browser` |

`frontend/vercel.json` conserva archivos estáticos y resuelve rutas de Angular al recargar. La producción se compila con `outputMode: static`; no depende de `/api/academic`, `/api/chat` o de la carpeta `dist/.../server`.

La URL y la Publishable key del proyecto actual ya están configuradas en `src/environments/supabase.config.ts`. Son públicas por diseño; RLS y RPC validan el acceso. Para otro proyecto, define en Vercel **ambas** variables `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`; el prebuild genera únicamente la configuración pública. Rechaza claves `sb_secret` y JWT `service_role`.

Cuando Vercel asigne el dominio, actualiza Site URL/Redirect URLs de Auth y `ALLOWED_ORIGINS` de la función.

## 5. Validación

```powershell
npm test -- --watch=false
npm run test:supabase
npm run build
npm run check:supabase
```

Las pruebas de PostgreSQL embebido aplican las migraciones reales con roles y RLS; cubren autorizaciones, separación entre instituciones y estudiantes, revisión, notas 1.0–5.0, conflictos, correcciones, notificaciones privadas, archivos y cuota de IA. Las pruebas de la Edge Function cubren autenticación, historial y respuestas del proveedor sin gastar crédito.

Antes de entregar, usa dos sesiones independientes (por ejemplo, navegador normal e incógnito): profesor publica, estudiante entrega, profesor revisa/califica, estudiante recibe nota y comentarios. Cambia de navegador o dispositivo para confirmar la persistencia compartida. Recarga `/tareas` directamente en Vercel. Prueba también confirmar correo, recuperar contraseña y consultar la IA.

Las preferencias de interfaz, favoritos y el historial visual del chatbot siguen siendo personales del navegador. Las cuentas, publicaciones, mensajes, tareas, entregas, notas, notificaciones y archivos se guardan en Supabase.

Los modos anteriores permanecen explícitos para desarrollo: `npm run start:local` (demostración sin conexión) y `npm run start:server` (API Node/SQLite). Nunca se activan automáticamente si Supabase falla.
