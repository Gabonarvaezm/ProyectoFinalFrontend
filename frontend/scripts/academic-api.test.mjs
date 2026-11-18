import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import express from 'express';
import { AcademicStore, createAcademicRouter } from '../src/server/academic-api.mjs';

async function withSchool(run) {
  const store = new AcademicStore(':memory:');
  const app = express();
  app.use('/api/academic', createAcademicRouter({ store }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/academic`;
  const request = async (path, data, token) => {
    const response = await fetch(base + path, {
      method: data ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  try { await run({ request, store }); }
  finally { await new Promise((done) => server.close(done)); store.close(); }
}

const student = (email) => ({ fullName: email.split('@')[0], email, institution: 'Universidad Tecnológica Nacional', role: 'student', password: 'school123' });

test('publica biblioteca, foro, exámenes y mensajes entre sesiones distintas de profesor y estudiantes', async () => {
  await withSchool(async ({ request }) => {
    for (const email of ['ana@example.com', 'luis@example.com']) assert.equal((await request('/register', student(email))).status, 200);
    const teacher = (await request('/login', { email: 'profesor@universidad.edu', password: 'password123' })).body;
    const ana = (await request('/login', { email: 'ana@example.com', password: 'school123' })).body;
    const luis = (await request('/login', { email: 'luis@example.com', password: 'school123' })).body;
    assert.notEqual(ana.token, luis.token);
    const events = [
      ['book.publish', { id: 'book-new', title: 'Fracciones', description: 'Guía de fracciones para sexto grado', category: 'matematicas' }],
      ['post.publish', { id: 'post-new', title: 'Dudas de fracciones', content: 'Escribe tus preguntas sobre fracciones.', subject: 'Matemáticas', replies: [], repliesCount: 0, helpfulCount: 0 }],
      ['exam.publish', { id: 'exam-new', title: 'Evaluación de fracciones', topic: 'Fracciones', subject: 'Matemáticas', questionsCount: 3, durationMinutes: 20, difficulty: 'Media', instructions: 'Repasar la guía de fracciones.' }],
      ['message.publish', { id: 'message-new', subject: 'Recordatorio', message: 'Traer el cuaderno.', priority: 'normal', targetGroup: 'all', sendToForums: true }],
    ];
    for (const [type, payload] of events) {
      const event = { id: randomUUID(), type, payload };
      assert.equal((await request('/events', event, teacher.token)).status, 200);
      assert.equal((await request('/events', event, teacher.token)).status, 200);
    }
    for (const account of [ana, luis]) {
      const { body, status } = await request('/state', undefined, account.token);
      assert.equal(status, 200);
      assert.ok(body.books.some((book) => book.id === 'book-new'));
      assert.ok(body.posts.some((post) => post.id === 'post-new'));
      assert.ok(body.posts.some((post) => post.id === 'message-message-new'));
      assert.ok(body.exams.some((exam) => exam.id === 'exam-new'));
      assert.ok(body.messages.some((message) => message.id === 'message-new'));
      assert.equal(body.notifications.length, 4, 'Reenviar una operación no duplica sus avisos.');
    }
    const state = (await request('/state', undefined, ana.token)).body;
    const id = state.notifications[0].id;
    await request('/events', { id: randomUUID(), type: 'notice.receipt', payload: { id, read: true } }, ana.token);
    assert.equal((await request('/state', undefined, ana.token)).body.notifications.find((n) => n.id === id).read, true);
    assert.equal((await request('/state', undefined, luis.token)).body.notifications.find((n) => n.id === id).read, false);
    assert.equal((await request('/state', undefined, teacher.token)).body.students.filter((s) => ['ana@example.com', 'luis@example.com'].includes(s.email)).length, 2);
  });
});

test('respeta grupos de destinatarios y protege los comunicados privados publicados en foro', async () => {
  await withSchool(async ({ request }) => {
    await request('/register', student('risk@example.com'));
    await request('/register', student('active@example.com'));
    const teacher = (await request('/login', { email: 'profesor@universidad.edu', password: 'password123' })).body;
    const risk = (await request('/login', { email: 'risk@example.com', password: 'school123' })).body;
    const active = (await request('/login', { email: 'active@example.com', password: 'school123' })).body;
    await request('/events', { type: 'student.upsert', payload: { id: 'risk', email: 'risk@example.com', studentName: 'Risk', score: 40, status: 'needs-attention' } }, teacher.token);
    await request('/events', { type: 'message.publish', payload: { id: 'private', subject: 'Refuerzo', message: 'Actividad de apoyo', targetGroup: 'needs-attention', sendToForums: true } }, teacher.token);
    const received = (await request('/state', undefined, risk.token)).body;
    const excluded = (await request('/state', undefined, active.token)).body;
    assert.ok(received.messages.some((m) => m.id === 'private'));
    assert.ok(received.posts.some((p) => p.id === 'message-private'));
    assert.ok(!excluded.messages.some((m) => m.id === 'private'));
    assert.ok(!excluded.posts.some((p) => p.id === 'message-private'));
    assert.equal(excluded.notifications.length, 0);
    const denied = await request('/events', { type: 'post.reply', payload: { id: 'intrusion', postId: 'message-private', content: 'No autorizado' } }, active.token);
    assert.equal(denied.status, 403);
  });
});

test('protege las publicaciones docentes, las sesiones y las entregas de cada alumno', async () => {
  await withSchool(async ({ request }) => {
    const teacher = (await request('/login', { email: 'profesor@universidad.edu', password: 'password123' })).body;
    const learner = (await request('/login', { email: 'estudiante@universidad.edu', password: 'password123', role: 'professor' })).body;
    assert.equal(learner.user.role, 'student');
    assert.equal((await request('/state')).status, 401);
    assert.equal((await request('/login', { email: learner.user.email, password: 'wrongpass' })).status, 401);
    assert.equal((await request('/events', { type: 'exam.publish', payload: { id: 'unauthorized' } }, learner.token)).status, 403);
    const task = { id: 'shared-task', title: 'Reporte de ciencias', description: 'Escribe tus observaciones', maxScore: 100 };
    await request('/events', { type: 'tarea.publish', payload: task }, teacher.token);
    assert.ok((await request('/state', undefined, learner.token)).body.tareas.some((t) => t.id === task.id));
    await request('/events', { type: 'tarea.submit', payload: { id: 'delivery', tareaId: task.id, content: 'Mis observaciones', submittedAt: new Date().toISOString() } }, learner.token);
    const submitted = (await request('/state', undefined, teacher.token)).body.tareas.find((t) => t.id === task.id);
    assert.equal(submitted.mySubmission.studentId, learner.user.id);
    assert.equal(submitted.submissionsCount, 1);
    for (const grade of [0, 0.9, 5.1, 4.55]) {
      assert.equal((await request('/events', { type: 'tarea.grade', payload: { submissionId: submitted.mySubmission.id, grade, feedback: 'Nota inválida' } }, teacher.token)).status, 400);
    }
    await request('/events', { type: 'tarea.grade', payload: { submissionId: submitted.mySubmission.id, grade: 4.5, feedback: 'Buen trabajo' } }, teacher.token);
    const gradedState = (await request('/state', undefined, learner.token)).body;
    const grade = gradedState.tareas.find((t) => t.id === task.id).mySubmission;
    assert.equal(grade.grade, 4.5);
    assert.equal(grade.gradeScale, 5);
    assert.ok(gradedState.notifications.some((notice) => JSON.stringify(notice).includes('4.5 / 5.0')));
  });
});

test('conserva publicaciones y cuentas después de reiniciar el almacenamiento', () => {
  const directory = mkdtempSync(join(tmpdir(), 'disceria-school-'));
  const path = join(directory, 'school.sqlite');
  try {
    let store = new AcademicStore(path);
    const { user } = store.login({ email: 'profesor@universidad.edu', password: 'password123' });
    store.mutate(user, { type: 'exam.publish', payload: { id: 'persistent', title: 'Examen persistente', topic: 'Historia', subject: 'Sociales', questionsCount: 5, durationMinutes: 15 } });
    store.close();
    store = new AcademicStore(path);
    assert.ok(store.snapshot(user).exams.some((exam) => exam.id === 'persistent'));
    store.close();
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('disceria-school-'));
    rmSync(directory, { recursive: true, force: true });
  }
});


test('ciclo real: asignación privada, borrador, conflictos, entrega, revisión, corrección y nota', async () => {
  await withSchool(async ({ request }) => {
    const teacher = (await request('/login', { email: 'profesor@universidad.edu', password: 'password123' })).body;
    await request('/register', student('draft@example.com'));
    await request('/register', student('excluded@example.com'));
    const learner = (await request('/login', { email: 'draft@example.com', password: 'school123' })).body;
    const excluded = (await request('/login', { email: 'excluded@example.com', password: 'school123' })).body;
    const event = (type, payload, account = teacher) => request('/events', { id: randomUUID(), type, payload }, account.token);
    const task = { id: 'lifecycle', title: 'Informe', description: 'Explica el experimento', subject: 'Ciencias', dueDate: '2099-12-01', maxScore: 20, recipientEmails: [learner.user.email] };
    const file = { name: 'respuesta.txt', mime: 'text/plain', base64: Buffer.from('Evidencia persistente').toString('base64') };
    assert.equal((await event('tarea.publish', { ...task, material: file })).status, 200);
    assert.ok(!(await request('/state', undefined, excluded.token)).body.tareas.some((t) => t.id === task.id));
    assert.equal((await event('tarea.draft', { tareaId: task.id, content: 'Intrusión' }, excluded)).status, 403);
    const getTask = async (account = learner) => (await request('/state', undefined, account.token)).body.tareas.find((t) => t.id === task.id);
    assert.equal((await event('tarea.draft', { tareaId: task.id, content: 'Avance', attachment: file, grade: 20 }, learner)).status, 200);
    let mine = await getTask();
    assert.equal(mine.status, 'en_progreso');
    assert.equal(mine.mySubmission.grade, undefined);
    assert.equal(mine.mySubmission.submittedAt, undefined);
    assert.equal((await getTask(teacher)).submissionsCount, 0);
    assert.equal((await getTask(teacher)).recipients.length, 1);
    assert.equal((await event('tarea.grade', { submissionId: mine.mySubmission.id, grade: 10, feedback: 'Borrador' })).status, 409);
    assert.equal((await event('tarea.draft', { tareaId: task.id, content: 'Obsoleto', revision: 0 }, learner)).status, 409);
    const session2 = (await request('/login', { email: learner.user.email, password: 'school123' })).body;
    assert.equal((await getTask(session2)).mySubmission.attachment.base64, file.base64);
    assert.equal((await event('tarea.submit', { tareaId: task.id, content: 'Respuesta final', revision: mine.mySubmission.revision, grade: 20 }, learner)).status, 200);
    mine = await getTask();
    assert.equal(mine.status, 'entregada');
    assert.equal(mine.mySubmission.grade, undefined);
    assert.equal((await getTask(teacher)).submissionsCount, 1);
    assert.equal((await event('tarea.draft', { tareaId: task.id, content: 'Cambio', revision: mine.mySubmission.revision }, learner)).status, 409);
    assert.equal((await event('tarea.grade', { submissionId: mine.mySubmission.id, grade: 20, feedback: 'Fraude' }, learner)).status, 403);
    assert.equal((await event('tarea.review', { submissionId: mine.mySubmission.id })).status, 200);
    assert.equal((await getTask()).status, 'en_revision');
    assert.equal((await event('tarea.correction', { submissionId: mine.mySubmission.id, feedback: 'Amplía las conclusiones' })).status, 200);
    mine = await getTask();
    assert.equal(mine.status, 'requiere_correccion');
    assert.equal((await event('tarea.submit', { tareaId: task.id, content: 'Respuesta corregida', attachment: file, revision: mine.mySubmission.revision }, learner)).status, 200);
    mine = await getTask();
    assert.equal((await event('tarea.grade', { submissionId: mine.mySubmission.id, grade: 21, feedback: 'Fuera de escala' })).status, 400);
    assert.equal((await event('tarea.grade', { submissionId: mine.mySubmission.id, grade: 4.5, feedback: 'Conclusiones correctas' })).status, 200);
    mine = await getTask(session2);
    assert.equal(mine.status, 'calificada');
    assert.equal(mine.mySubmission.grade, 4.5);
    assert.equal(mine.mySubmission.feedback, 'Conclusiones correctas');
    assert.equal((await getTask(teacher)).submissions[0].attachment.base64, file.base64);
    assert.equal((await event('tarea.submit', { tareaId: task.id, content: 'Borrar nota', revision: mine.mySubmission.revision }, learner)).status, 409);
  });
});

test('vence sin entrega, rechaza archivos falsos y aísla instituciones y docentes', async () => {
  await withSchool(async ({ request }) => {
    const teacher = (await request('/login', { email: 'profesor@universidad.edu', password: 'password123' })).body;
    const learner = (await request('/login', { email: 'estudiante@universidad.edu', password: 'password123' })).body;
    await request('/register', { ...student('other@example.com'), role: 'professor' });
    const other = (await request('/login', { email: 'other@example.com', password: 'school123' })).body;
    const event = (type, payload, account = teacher) => request('/events', { type, payload }, account.token);
    const task = { id: 'overdue', title: 'Vencida', description: 'Sin entrega', dueDate: '2020-01-01', maxScore: 10 };
    assert.equal((await event('tarea.publish', task)).status, 200);
    const state = (await request('/state', undefined, learner.token)).body;
    assert.equal(state.tareas.find((t) => t.id === task.id).status, 'vencida');
    assert.equal((await event('tarea.submit', { tareaId: task.id, content: 'Tarde' }, learner)).status, 409);
    assert.ok(!(await request('/state', undefined, other.token)).body.tareas.some((t) => t.id === task.id));
    assert.equal((await event('tarea.publish', { ...task, material: { name: 'fake.pdf', mime: 'application/pdf', base64: Buffer.from('not pdf').toString('base64') } })).status, 400);
    await request('/register', { ...student('outside@example.com'), institution: 'Otra institución' });
    assert.equal((await event('tarea.publish', { ...task, recipientEmails: ['outside@example.com'] })).status, 400);
  });
});


test('recupera borrador, adjuntos y calificación después de reiniciar SQLite', () => {
  const directory = mkdtempSync(join(tmpdir(), 'disceria-school-'));
  const path = join(directory, 'school.sqlite');
  let store;
  try {
    store = new AcademicStore(path);
    const teacher = store.login({ email: 'profesor@universidad.edu', password: 'password123' }).user;
    const learner = store.login({ email: 'estudiante@universidad.edu', password: 'password123' }).user;
    const attachment = { name: 'evidencia.txt', mime: 'text/plain', base64: Buffer.from('Respuesta persistente').toString('base64') };
    store.mutate(teacher, { type: 'tarea.publish', payload: { id: 'disk-task', title: 'Persistencia', description: 'Informe persistente', dueDate: '2099-01-01', maxScore: 10 } });
    store.mutate(learner, { type: 'tarea.draft', payload: { tareaId: 'disk-task', content: 'Avance almacenado', attachment } });
    store.close(); store = new AcademicStore(path);
    let task = store.snapshot(learner).tareas.find((t) => t.id === 'disk-task');
    assert.equal(task.status, 'en_progreso');
    assert.equal(task.mySubmission.attachment.base64, attachment.base64);
    store.mutate(learner, { type: 'tarea.submit', payload: { tareaId: task.id, content: 'Respuesta final persistente', attachment, revision: task.mySubmission.revision } });
    task = store.snapshot(teacher).tareas.find((t) => t.id === 'disk-task');
    store.mutate(teacher, { type: 'tarea.grade', payload: { submissionId: task.mySubmission.id, grade: 4.0, feedback: 'Buen análisis persistente' } });
    store.close(); store = new AcademicStore(path);
    const session = store.login({ email: 'estudiante@universidad.edu', password: 'password123' });
    task = store.snapshot(store.authenticate('Bearer ' + session.token)).tareas.find((t) => t.id === 'disk-task');
    assert.equal(task.status, 'calificada');
    assert.equal(task.mySubmission.grade, 4.0);
    assert.equal(task.mySubmission.feedback, 'Buen análisis persistente');
    assert.equal(task.mySubmission.attachment.base64, attachment.base64);
  } finally {
    store?.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('disceria-school-'));
    rmSync(directory, { recursive: true, force: true });
  }
});


test('dos alumnos asignados conservan entregas privadas y el docente califica cada una por separado', async () => {
  await withSchool(async ({ request }) => {
    const teacher = (await request('/login', { email: 'profesor@universidad.edu', password: 'password123' })).body;
    const first = (await request('/login', { email: 'estudiante@universidad.edu', password: 'password123' })).body;
    await request('/register', student('second@example.com'));
    const second = (await request('/login', { email: 'second@example.com', password: 'school123' })).body;
    await request('/register', { ...student('teacher2@example.com'), role: 'professor' });
    const teacher2 = (await request('/login', { email: 'teacher2@example.com', password: 'school123' })).body;
    const event = (account, type, payload) => request('/events', { type, payload }, account.token);
    assert.equal((await event(teacher, 'tarea.publish', { id: 'multi', title: 'Individual', description: 'Entregas distintas', maxScore: 10, dueDate: '2099-12-01', recipientEmails: [first.user.email, second.user.email] })).status, 200);
    for (const [account, content] of [[first, 'Respuesta confidencial A'], [second, 'Respuesta confidencial B']]) {
      assert.equal((await event(account, 'tarea.submit', { tareaId: 'multi', content })).status, 200);
    }
    const get = async (account) => (await request('/state', undefined, account.token)).body.tareas.find((t) => t.id === 'multi');
    const task = await get(teacher);
    assert.equal(task.submissionsCount, 2);
    assert.equal(task.recipients.length, 2);
    assert.equal(task.submissions.length, 2);
    const a = task.submissions.find((item) => item.studentId === first.user.id);
    const b = task.submissions.find((item) => item.studentId === second.user.id);
    assert.equal((await get(first)).mySubmission.content, 'Respuesta confidencial A');
    assert.equal((await get(second)).mySubmission.content, 'Respuesta confidencial B');
    assert.equal((await get(first)).submissions, undefined);
    assert.equal((await get(first)).recipients, undefined);
    assert.equal((await get(first)).recipientEmails, undefined);
    assert.equal((await event(teacher2, 'tarea.grade', { submissionId: a.id, grade: 10, feedback: 'Intrusión' })).status, 404);
    assert.equal((await event(teacher2, 'tarea.delete', { id: 'multi' })).status, 403);
    assert.equal((await event(teacher, 'tarea.grade', { submissionId: a.id, grade: 4.5, feedback: 'Buen trabajo A', revision: a.revision })).status, 200);
    assert.equal((await event(teacher, 'tarea.grade', { submissionId: a.id, grade: 2, feedback: 'Nota obsoleta', revision: a.revision })).status, 409);
    assert.equal((await event(teacher, 'tarea.grade', { submissionId: b.id, grade: 3.5, feedback: 'Buen trabajo B', revision: b.revision })).status, 200);
    assert.equal((await get(first)).mySubmission.grade, 4.5);
    assert.equal((await get(second)).mySubmission.grade, 3.5);
  });
});
