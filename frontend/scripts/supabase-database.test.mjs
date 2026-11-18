import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

let db;
const teacher = randomUUID(), student = randomUUID(), otherStudent = randomUUID(), otherTeacher = randomUUID(), outsider = randomUUID();
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; grant usage on schema auth to authenticated;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant execute on function auth.uid() to authenticated;`);
  // Minimal Storage/Auth infrastructure; application migrations run unchanged on real PostgreSQL.
  await db.exec(`create schema storage; grant usage on schema storage to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert on storage.objects to authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202611180001_academic.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611180002_files.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611180003_chat_quota.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611180004_teacher.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/finish-setup.sql', import.meta.url), 'utf8'));
  await db.exec(`select private.approve_teacher('teacher@school.edu','Colegio'); select private.approve_teacher('otherteacher@school.edu','Colegio');`);
  for (const [id, email, school, role] of [
    [teacher,'teacher@school.edu','Colegio','professor'], [otherTeacher,'otherteacher@school.edu','Colegio','professor'],
    [student,'ana@school.edu','Colegio','professor'], [otherStudent,'luis@school.edu','Colegio','student'], [outsider,'outsider@other.edu','Otra institución','student'],
  ]) await db.query('insert into auth.users values($1,$2,$3)', [id,email,{full_name:email,institution:school,requested_role:role}]);
});
after(async () => { await db?.close(); });

async function asUser(id, statement, args = []) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? '']);
  await db.exec(`set role ${id ? 'authenticated' : 'anon'}`);
  try { return (await db.query(statement,args)).rows; }
  finally { await db.exec('reset role'); }
}
async function mutate(id, type, payload, eventId = randomUUID()) {
  return asUser(id,'select public.academic_mutate($1::jsonb) result',[{id:eventId,type,payload}]);
}
async function snapshot(id) { return (await asUser(id,'select public.academic_snapshot() state'))[0].state; }

test('el rol docente no se obtiene modificando metadata; RLS bloquea escrituras y usuarios anónimos', async () => {
  const profile = await asUser(student,'select * from public.profiles');
  assert.equal(profile.length,1); assert.equal(profile[0].role,'student');
  await assert.rejects(asUser(student,"update public.profiles set role='professor'"),/permission denied/);
  await assert.rejects(asUser(student,"insert into public.academic_documents values('book','fake',$1,'Colegio',null,'{}',now())",[student]),/permission denied/);
  await assert.rejects(snapshot(null),/permission denied/);
  await assert.rejects(asUser(student,"select private.approve_teacher('ana@school.edu','Colegio')"),/permission denied/);
});

test('biblioteca, foro, exámenes y mensajes se comparten en la institución y los votos no se falsifican', async () => {
  await mutate(teacher,'book.publish',{id:'book',title:'Libro de ciencias',description:'Recurso compartido'});
  await mutate(teacher,'post.publish',{id:'post',title:'Dudas de ciencias',content:'Pregunta académica',subject:'Ciencias',helpfulCount:999,author:{role:'admin'}});
  await mutate(teacher,'exam.publish',{id:'exam',title:'Examen de ciencias',topic:'Biología',subject:'Ciencias',questionsCount:3,durationMinutes:15,difficulty:'Baja'});
  await mutate(teacher,'message.publish',{id:'message',subject:'Aviso',message:'Comunicado privado a la clase',targetGroup:'all',sendToForums:true});
  let state = await snapshot(student);
  assert.equal(state.books.length,1); assert.equal(state.exams.length,1); assert.equal(state.messages.length,1);
  assert.equal(state.posts.find(p=>p.id==='post').author.id,teacher);
  await mutate(student,'post.reply',{id:'reply',postId:'post',content:'Mi respuesta',isTeacherVerified:true});
  await mutate(student,'post.vote',{postId:'post',voted:true});
  await mutate(otherStudent,'post.vote',{postId:'post',replyId:'reply',voted:true});
  state=await snapshot(student);
  const post=state.posts.find(p=>p.id==='post');
  assert.equal(post.helpfulCount,1); assert.equal(post.userHasVotedHelpful,true);
  assert.equal(post.replies[0].isTeacherVerified,false); assert.equal(post.replies[0].helpfulCount,1);
  assert.deepEqual((await snapshot(outsider)).books,[]);
  assert.deepEqual((await snapshot(outsider)).posts,[]);
  assert.deepEqual((await snapshot(outsider)).messages,[]);
});

test('asigna, revisa, califica de 1.0 a 5.0 y notifica solo al estudiante correcto', async () => {
  const task={id:'task',title:'Informe científico',description:'Explicar el experimento',dueDate:'2099-01-01',subject:'Ciencias',maxScore:100,recipientEmails:['ana@school.edu','luis@school.edu']};
  await mutate(teacher,'tarea.publish',task);
  await mutate(student,'tarea.draft',{tareaId:'task',content:'Avance',grade:5});
  let mine=(await snapshot(student)).tareas[0]; assert.equal(mine.mySubmission.grade,undefined);
  await assert.rejects(mutate(teacher,'tarea.grade',{submissionId:mine.mySubmission.id,grade:4,feedback:'No calificar borrador'}),/definitivas/);
  await mutate(student,'tarea.submit',{tareaId:'task',content:'Respuesta definitiva',revision:mine.mySubmission.revision});
  mine=(await snapshot(student)).tareas[0];
  await mutate(teacher,'tarea.review',{submissionId:mine.mySubmission.id});
  mine=(await snapshot(student)).tareas[0]; assert.equal(mine.status,'en_revision');
  await assert.rejects(mutate(otherTeacher,'tarea.grade',{submissionId:mine.mySubmission.id,grade:4.5,feedback:'Otro profesor'}),/gestionar/);
  await assert.rejects(mutate(student,'tarea.grade',{submissionId:mine.mySubmission.id,grade:5,feedback:'Autoevaluación falsa'}),/docentes/);
  for (const grade of [undefined,null,'4.5',0,0.9,5.1,4.55]) await assert.rejects(mutate(teacher,'tarea.grade',{submissionId:mine.mySubmission.id,grade,feedback:'Fuera de escala'}),/calificación/);
  const eventId=randomUUID();
  const grading={submissionId:mine.mySubmission.id,revision:mine.mySubmission.revision,grade:4.5,feedback:'Buen análisis experimental'};
  await mutate(teacher,'tarea.grade',grading,eventId);
  await mutate(teacher,'tarea.grade',grading,eventId);
  mine=(await snapshot(student)).tareas[0];
  assert.equal(mine.mySubmission.grade,4.5); assert.equal(mine.mySubmission.gradeScale,5); assert.equal(mine.status,'calificada');
  assert.equal(mine.submissions,undefined); assert.equal((await snapshot(otherStudent)).tareas[0].mySubmission,undefined);
  const state=await snapshot(student);
  assert.ok(state.notifications.some(n=>n.message.includes('4.5 / 5.0')));
  assert.ok(!(await snapshot(otherStudent)).notifications.some(n=>n.message.includes('4.5 / 5.0')));
  assert.equal((await snapshot(otherTeacher)).tareas.length,0);
  assert.equal((await snapshot(teacher)).students.find(s=>s.id===student).score,90);
  await assert.rejects(mutate(teacher,'tarea.grade',{...grading,grade:2}),/cambió/);
  await mutate(teacher,'tarea.correction',{submissionId:mine.mySubmission.id,feedback:'Ampliar conclusiones'});
  mine=(await snapshot(student)).tareas[0];
  assert.equal(mine.status,'requiere_correccion'); assert.equal(mine.mySubmission.grade,undefined);
  await mutate(student,'tarea.submit',{tareaId:'task',content:'Respuesta corregida',revision:mine.mySubmission.revision});
  mine=(await snapshot(student)).tareas[0];
  assert.ok(mine.mySubmission.history.some(attempt=>attempt.grade===4.5 && attempt.gradeScale===5));
});

test('Storage mantiene privados los archivos; solo dueño y destinatarios pueden descargarlos', async () => {
  const path = `${teacher}/material/documento`;
  await asUser(teacher,"insert into storage.objects(bucket_id,name) values('academic-files',$1)",[path]);
  assert.equal((await asUser(student,'select * from storage.objects where name=$1',[path])).length,0);
  await assert.rejects(asUser(student,"insert into storage.objects(bucket_id,name) values('academic-files',$1)",[`${teacher}/invasion`]),/row-level security/);
  await mutate(teacher,'tarea.publish',{id:'with-file',title:'Actividad con material',description:'Leer el documento',dueDate:'2099-01-01',subject:'Ciencias',recipientEmails:['ana@school.edu'],
    material:{name:'documento.pdf',mime:'application/pdf',base64:'',storagePath:path}});
  assert.equal((await asUser(student,'select * from storage.objects where name=$1',[path])).length,1);
  assert.equal((await asUser(otherStudent,'select * from storage.objects where name=$1',[path])).length,0);
  await assert.rejects(mutate(otherStudent,'tarea.submit',{tareaId:'with-file',content:'Intrusión'}),/asignada/);
  await assert.rejects(mutate(teacher,'tarea.publish',{id:'fake-file',title:'Archivo inexistente',description:'Material',dueDate:'2099-01-01',material:{name:'f.pdf',mime:'application/pdf',storagePath:'another/private/file'}}),/archivo/);
});

test('la función de IA tiene una cuota por usuario y hora que el navegador no puede reiniciar', async () => {
  for (let i=0;i<30;i++) await asUser(student,'select public.consume_ai_quota()');
  await assert.rejects(asUser(student,'select public.consume_ai_quota()'),/30 consultas/);
  await asUser(otherStudent,'select public.consume_ai_quota()');
  await assert.rejects(asUser(student,'delete from private.ai_quota'),/permission denied/);
});
