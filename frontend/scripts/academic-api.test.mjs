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

const student = (email) => ({ fullName: email.split('@')[0], email, institution: 'Colegio', role: 'student', password: 'school123' });

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
    await request('/events', { type: 'tarea.grade', payload: { submissionId: submitted.mySubmission.id, grade: 95, feedback: 'Buen trabajo' } }, teacher.token);
    assert.equal((await request('/state', undefined, learner.token)).body.tareas.find((t) => t.id === task.id).mySubmission.grade, 95);
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
