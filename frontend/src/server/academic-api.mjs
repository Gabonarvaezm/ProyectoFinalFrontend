import { Router, json } from 'express';
import { createRequire } from 'node:module';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProjectDirectory } from './server-environment.mjs';
import { INITIAL_BOOKS } from '../app/biblioteca/data/books.data.ts';
import { INITIAL_FORUM_POSTS } from '../app/foro/data/foro.data.ts';
import { INITIAL_TAREAS } from '../app/tarea/data/tarea.data.ts';

function reject(status, message) {
  throw Object.assign(new Error(message), { status });
}
function text(value, max = 10000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) reject(400, 'Revisa los datos enviados.');
  return value.trim();
}
const hash = (value) => createHash('sha256').update(value).digest('hex');
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
function academicFile(file) {
  if (file === undefined || file === null) return undefined;
  if (!file || typeof file !== 'object' || typeof file.base64 !== 'string' || file.base64.length > 245760 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)) reject(400, 'Archivo inválido o mayor de 180 KB.');
  const data = Buffer.from(file.base64, 'base64');
  const valid = file.mime === 'application/pdf' ? data.subarray(0, 5).toString() === '%PDF-'
    : file.mime === 'image/png' ? data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    : file.mime === 'image/jpeg' ? data.subarray(0, 3).toString('hex') === 'ffd8ff'
    : file.mime === 'text/plain' && !data.includes(0);
  if (!data.length || data.length > 180 * 1024 || !valid) reject(400, 'El contenido no corresponde a un formato permitido.');
  return { name: text(file.name, 150).replace(/[\\/\r\n]/g, '_'), mime: file.mime, base64: data.toString('base64') };
}
const canRead = (row, user) => row.owner === user.id || row.audience === 'all' || JSON.parse(row.audience).includes(user.email);

export class AcademicStore {
  constructor(path = join(findProjectDirectory(dirname(fileURLToPath(import.meta.url))), 'data', 'academic.sqlite')) {
    const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, profile TEXT NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS documents (kind TEXT NOT NULL, id TEXT NOT NULL, owner TEXT NOT NULL, audience TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(kind,id));
      CREATE TABLE IF NOT EXISTS notices (id TEXT PRIMARY KEY, owner TEXT NOT NULL, audience TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (user_id TEXT NOT NULL, notice_id TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,notice_id));
      CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS operations (user_id TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY(user_id,id));
      CREATE TABLE IF NOT EXISTS votes (user_id TEXT NOT NULL, post_id TEXT NOT NULL, reply_id TEXT NOT NULL, PRIMARY KEY(user_id,post_id,reply_id));
    `);
    for (const [email, fullName, role] of [
      ['profesor@universidad.edu', 'Prof. Carlos Mendoza', 'professor'],
      ['estudiante@universidad.edu', 'Alejandro Silva', 'student'],
    ]) {
      if (!this.db.prepare('SELECT id FROM users WHERE email=?').get(email)) {
        this.register({ email, fullName, role, password: 'password123', institution: 'Universidad Tecnológica Nacional' });
      }
    }
    if (!this.db.prepare("SELECT value FROM settings WHERE name='seed'").get()) {
      const owner = this.db.prepare("SELECT id FROM users WHERE email='profesor@universidad.edu'").get().id;
      for (const [kind, items] of [['book', INITIAL_BOOKS], ['post', INITIAL_FORUM_POSTS]]) {
        for (const item of items) this.put(kind, item, owner);
      }
      this.db.prepare("INSERT INTO settings VALUES ('seed','1')").run();
    }
  }

  close() { this.db.close(); }

  register(data) {
    const email = text(data.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject(400, 'El correo no es válido.');
    if (!['student', 'professor'].includes(data.role)) reject(400, 'Selecciona un rol válido.');
    const password = text(data.password, 256);
    if (password.length < 6) reject(400, 'La contraseña debe tener al menos 6 caracteres.');
    if (this.db.prepare('SELECT id FROM users WHERE email=?').get(email)) reject(409, 'Este correo ya tiene una cuenta. Inicia sesión.');
    const user = { id: randomUUID(), email, fullName: text(data.fullName, 150), role: data.role, institution: text(data.institution || 'Comunidad DiscerIA', 200) };
    const salt = randomBytes(16).toString('hex');
    this.db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(user.id, email, JSON.stringify(user), salt, scryptSync(password, salt, 64).toString('hex'));
    return user;
  }

  login(data) {
    const row = this.db.prepare('SELECT * FROM users WHERE email=?').get(text(data.email, 254).toLowerCase());
    const password = text(data.password, 256);
    if (!row || !timingSafeEqual(scryptSync(password, row.salt, 64), Buffer.from(row.password, 'hex'))) reject(401, 'Correo o contraseña incorrectos.');
    const token = randomBytes(32).toString('hex');
    this.db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    this.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), row.id, Date.now() + 7 * 86400000);
    return { token, user: JSON.parse(row.profile) };
  }

  authenticate(authorization) {
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) reject(401, 'Inicia sesión para acceder a tus contenidos.');
    const row = this.db.prepare('SELECT u.profile FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?').get(hash(authorization.slice(7)), Date.now());
    if (!row) reject(401, 'Tu sesión ha caducado. Inicia sesión de nuevo.');
    return JSON.parse(row.profile);
  }

  put(kind, payload, owner, audience = 'all') {
    const previous = this.db.prepare('SELECT owner FROM documents WHERE kind=? AND id=?').get(kind, payload.id);
    if (previous && previous.owner !== owner) reject(403, 'Solo el autor puede modificar este contenido.');
    this.db.prepare('INSERT INTO documents VALUES (?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload, audience=excluded.audience')
      .run(kind, text(payload.id, 200), owner, typeof audience === 'string' ? audience : JSON.stringify(audience), JSON.stringify(payload));
  }

  notice(user, audience, type, title, message, actionRoute, resourceId) {
    const payload = { id: randomUUID(), type, title, message, authorName: user.fullName, authorRole: user.role, authorInitials: initials(user.fullName), timeAgo: 'Hace un momento', createdAt: new Date().toISOString(), read: false, actionRoute, resourceId };
    this.db.prepare('INSERT INTO notices VALUES (?,?,?,?)').run(payload.id, user.id, typeof audience === 'string' ? audience : JSON.stringify(audience), JSON.stringify(payload));
  }

  documents(kind, user) {
    return this.db.prepare('SELECT * FROM documents WHERE kind=? ORDER BY rowid DESC').all(kind)
      .filter((row) => canRead(row, user)).map((row) => JSON.parse(row.payload));
  }

  students(scope) {
    const progress = this.db.prepare("SELECT payload FROM documents WHERE kind='student'").all().map((row) => JSON.parse(row.payload));
    return this.db.prepare('SELECT profile FROM users').all().map((row) => JSON.parse(row.profile)).filter((user) => user.role === 'student' && (!scope || user.institution === scope.institution)).map((user) => ({
      studentName: user.fullName, topic: 'Sin asignar', score: 0, status: 'active', statusLabel: 'Activo',
      ...progress.find((item) => item.email === user.email),
      id: user.id, email: user.email,
    }));
  }

  snapshot(user) {
    const notifications = this.db.prepare('SELECT n.*, r.is_read, r.deleted FROM notices n LEFT JOIN receipts r ON r.notice_id=n.id AND r.user_id=? ORDER BY n.rowid DESC').all(user.id)
      .filter((row) => !row.deleted && row.owner !== user.id && canRead(row, user))
      .map((row) => ({ ...JSON.parse(row.payload), read: !!row.is_read }));
    const tareas = this.documents('tarea', user)
      .filter((tarea) => !INITIAL_TAREAS.some((demo) => JSON.stringify(demo) === JSON.stringify(tarea)))
      .filter((tarea) => user.role !== 'professor' || this.db.prepare("SELECT owner FROM documents WHERE kind='tarea' AND id=?").get(tarea.id)?.owner === user.id).map((tarea) => {
      const submissions = this.documents('submission', user).filter((item) => item.tareaId === tarea.id);
      const statusOf = (submission) => submission?.status === 'requiere_correccion' ? 'requiere_correccion'
        : submission?.grade !== undefined ? 'calificada'
        : submission?.submittedAt ? (submission.status === 'en_revision' ? 'en_revision' : 'entregada')
        : tarea.dueDate && Date.now() > Date.parse(`${tarea.dueDate}T23:59:59-05:00`) ? 'vencida'
        : submission ? 'en_progreso' : 'pendiente';
      const mySubmission = user.role === 'professor' ? submissions.find((item) => item.submittedAt) : submissions.find((item) => item.studentId === user.id);
      const recipients = user.role === 'professor' ? this.students(user).filter((student) => {
        const profile = JSON.parse(this.db.prepare('SELECT profile FROM users WHERE id=?').get(student.id).profile);
        return canRead({ owner: '', audience: tarea.recipientEmails ? JSON.stringify(tarea.recipientEmails) : 'all' }, profile) && profile.institution === user.institution;
      }).map((student) => ({ studentId: student.id, studentName: student.studentName, email: student.email,
        status: statusOf(submissions.find((item) => item.studentId === student.id)),
        submission: submissions.find((item) => item.studentId === student.id) })) : undefined;
      return { ...tarea, recipientEmails: user.role === 'professor' ? tarea.recipientEmails : undefined, recipients, submissions: user.role === 'professor' ? submissions : undefined,
        submissionsCount: submissions.filter((item) => item.submittedAt && item.status !== 'requiere_correccion').length,
        mySubmission, status: statusOf(mySubmission) };
    });
    const posts = this.documents('post', user).map((post) => {
      const votes = this.db.prepare('SELECT * FROM votes WHERE post_id=?').all(post.id);
      const withVotes = (item, replyId) => ({ ...item, helpfulCount: item.helpfulCount + votes.filter((vote) => vote.reply_id === replyId).length, userHasVotedHelpful: votes.some((vote) => vote.reply_id === replyId && vote.user_id === user.id) });
      return { ...withVotes(post, ''), replies: post.replies.map((reply) => withVotes(reply, reply.id)) };
    });
    return { books: this.documents('book', user), posts, exams: this.documents('exam', user), messages: this.documents('message', user), tareas, notifications, students: user.role === 'professor' ? this.students(user) : [] };
  }

  mutate(user, event) {
    const type = text(event.type, 80);
    const p = event.payload;
    if (!p || typeof p !== 'object' || Array.isArray(p)) reject(400, 'Contenido inválido.');
    const professorOnly = ['book.publish', 'book.recommend', 'exam.publish', 'message.publish', 'student.upsert', 'student.remove', 'tarea.publish', 'tarea.delete', 'tarea.grade', 'tarea.review', 'tarea.correction'];
    if (professorOnly.includes(type) && user.role !== 'professor') reject(403, 'Esta acción solo está disponible para docentes.');
    const author = { id: user.id, name: user.fullName, role: user.role, institution: user.institution, initials: initials(user.fullName) };
    if (event.id && this.db.prepare('SELECT id FROM operations WHERE user_id=? AND id=?').get(user.id, event.id)) return this.snapshot(user);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (type === 'book.publish') {
        text(p.title, 150); text(p.description); text(p.category, 100);
        this.put('book', p, user.id);
        this.notice(user, 'all', 'teacher_announcement', `Nuevo recurso: ${p.title}`, p.description, '/biblioteca', p.id);
      } else if (type === 'book.recommend') {
        const row = this.db.prepare("SELECT * FROM documents WHERE kind='book' AND id=?").get(text(p.id, 200));
        if (!row) reject(404, 'El recurso no existe.');
        const book = JSON.parse(row.payload);
        this.notice(user, 'all', 'teacher_announcement', `Lectura recomendada: ${book.title}`, book.description, '/biblioteca', book.id);
      } else if (type === 'post.publish') {
        text(p.title, 150); text(p.content); text(p.subject, 100);
        const previous = this.db.prepare("SELECT payload FROM documents WHERE kind='post' AND id=?").get(p.id);
        const replies = previous ? JSON.parse(previous.payload).replies : [];
        this.put('post', { ...p, author, replies, repliesCount: replies.length, isUnanswered: !replies.length, helpfulCount: 0, isTeacherVerified: user.role === 'professor' }, user.id);
        this.notice(user, 'all', 'forum_reply', `Nueva publicación: ${p.title}`, p.content, '/foro', p.id);
      } else if (type === 'post.reply') {
        text(p.content);
        const row = this.db.prepare("SELECT * FROM documents WHERE kind='post' AND id=?").get(text(p.postId, 200));
        if (!row) reject(404, 'La publicación no existe en el servidor.');
        if (!canRead(row, user)) reject(403, 'No tienes acceso a esta publicación.');
        const post = JSON.parse(row.payload);
        const reply = { ...p, author, isTeacherVerified: user.role === 'professor' && !!p.isTeacherVerified };
        if (!post.replies.some((item) => item.id === reply.id)) post.replies.push(reply);
        Object.assign(post, { repliesCount: post.replies.length, isUnanswered: false, isTeacherVerified: post.isTeacherVerified || reply.isTeacherVerified });
        this.put('post', post, row.owner, row.audience);
        this.notice(user, row.audience, 'forum_reply', `Nueva respuesta: ${post.title}`, p.content, '/foro', post.id);
      } else if (type === 'post.vote') {
        const row = this.db.prepare("SELECT * FROM documents WHERE kind='post' AND id=?").get(text(p.postId, 200));
        if (!row || !canRead(row, user)) reject(404, 'La publicación no existe.');
        const replyId = typeof p.replyId === 'string' ? p.replyId : '';
        if (replyId && !JSON.parse(row.payload).replies.some((reply) => reply.id === replyId)) reject(404, 'La respuesta no existe.');
        if (p.voted) this.db.prepare('INSERT OR IGNORE INTO votes VALUES (?,?,?)').run(user.id, p.postId, replyId);
        else this.db.prepare('DELETE FROM votes WHERE user_id=? AND post_id=? AND reply_id=?').run(user.id, p.postId, replyId);
      } else if (type === 'exam.publish') {
        text(p.title, 150); text(p.topic, 200); text(p.subject, 100);
        if (!Number.isInteger(p.questionsCount) || p.questionsCount < 1 || p.questionsCount > 100 || !Number.isFinite(p.durationMinutes) || p.durationMinutes < 1) reject(400, 'Revisa la duración y el número de preguntas.');
        this.put('exam', { ...p, authorName: user.fullName, createdAt: new Date().toISOString() }, user.id);
        this.notice(user, 'all', 'exam', `Nuevo examen: ${p.title}`, `${p.topic}. ${p.instructions || ''}`, '/estudiante', p.id);
      } else if (type === 'message.publish') {
        text(p.subject, 200); text(p.message);
        if (!['all', 'active', 'needs-attention'].includes(p.targetGroup)) reject(400, 'Selecciona los destinatarios.');
        const audience = p.targetGroup === 'all' ? 'all' : this.students().filter((student) => student.status === p.targetGroup).map((student) => student.email);
        if (Array.isArray(audience) && !audience.length) reject(400, 'No hay estudiantes registrados en ese grupo.');
        this.put('message', { ...p, authorName: user.fullName, createdAt: new Date().toISOString() }, user.id, audience);
        this.notice(user, audience, 'teacher_announcement', p.subject, p.message, '/estudiante', p.id);
        if (p.sendToForums) {
          const post = { id: `message-${p.id}`, title: p.subject, content: p.message, subject: 'General', author, createdAt: 'Hace un momento', helpfulCount: 0, viewsCount: 0, repliesCount: 0, replies: [], isUnanswered: true, isTeacherVerified: true };
          this.put('post', post, user.id, audience);
        }
      } else if (type === 'student.upsert') {
        p.email = text(p.email, 254).toLowerCase();
        this.put('student', { ...p, id: p.email }, user.id);
      } else if (type === 'student.remove') {
        this.db.prepare("DELETE FROM documents WHERE kind='student' AND id=?").run(text(p.email, 254).toLowerCase());
      } else if (type === 'tarea.publish') {
        text(p.title, 150); text(p.description);
        if (!Number.isFinite(p.maxScore) || p.maxScore <= 0) reject(400, 'Escala de calificación inválida.');
        if (p.dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(p.dueDate) || !Number.isFinite(Date.parse(p.dueDate)))) reject(400, 'Fecha inválida.');
        const roster = this.db.prepare('SELECT profile FROM users').all().map((row) => JSON.parse(row.profile))
          .filter((profile) => profile.role === 'student' && profile.institution === user.institution);
        if (p.recipientEmails !== undefined && (!Array.isArray(p.recipientEmails) || !p.recipientEmails.length || p.recipientEmails.some((email) => !roster.some((s) => s.email === email)))) reject(400, 'Selecciona estudiantes de tu institución.');
        const audience = p.recipientEmails ?? roster.map((student) => student.email);
        const { mySubmission, submissions, recipients, ...taskData } = p;
        this.put('tarea', { ...taskData, material: academicFile(p.material), recipientEmails: audience, assignedBy: user.fullName }, user.id, audience);
        this.notice(user, audience, 'task', `Nueva tarea: ${p.title}`, p.description, '/tareas', p.id);
      } else if (type === 'tarea.delete') {
        const row = this.db.prepare("SELECT owner FROM documents WHERE kind='tarea' AND id=?").get(text(p.id, 200));
        if (!row || row.owner !== user.id) reject(403, 'No puedes eliminar esta tarea.');
        this.db.prepare("DELETE FROM documents WHERE kind='tarea' AND id=? AND owner=?").run(p.id, user.id);
      } else if (type === 'tarea.submit' || type === 'tarea.draft') {
        if (user.role !== 'student') reject(403, 'Solo los estudiantes pueden entregar tareas.');
        const task = this.db.prepare("SELECT * FROM documents WHERE kind='tarea' AND id=?").get(text(p.tareaId, 200));
        if (!task) reject(404, 'La tarea no está publicada en el servidor.');
        if (!canRead(task, user)) reject(403, 'No tienes asignada esta tarea.');
        const id = `${p.tareaId}:${user.id}`;
        const previous = this.db.prepare("SELECT payload FROM documents WHERE kind='submission' AND id=?").get(id);
        const saved = previous ? JSON.parse(previous.payload) : undefined;
        if (saved?.submittedAt && saved.status !== 'requiere_correccion') reject(409, 'La entrega está cerrada. El docente debe autorizar una corrección.');
        if ((saved?.revision ?? 0) !== (p.revision ?? 0)) reject(409, 'Hay cambios más recientes. Recarga antes de guardar.');
        const deadline = JSON.parse(task.payload).dueDate;
        if (deadline && Date.now() > Date.parse(`${deadline}T23:59:59-05:00`) && saved?.status !== 'requiere_correccion') reject(409, 'El plazo de esta tarea ha vencido.');
        if (type === 'tarea.submit') text(p.content);
        if (typeof p.content !== 'string' || p.content.length > 10000) reject(400, 'Respuesta inválida.');
        if (p.attachmentUrl && !/^https:\/\//i.test(p.attachmentUrl)) reject(400, 'El enlace debe usar HTTPS.');
        const teacher = JSON.parse(this.db.prepare('SELECT profile FROM users WHERE id=?').get(task.owner).profile);
        this.put('submission', { id, tareaId: p.tareaId, studentId: user.id, studentName: user.fullName,
          content: p.content.trim(), attachment: academicFile(p.attachment), attachmentUrl: p.attachmentUrl || undefined, comments: typeof p.comments === 'string' ? p.comments.slice(0, 500) : '',
          feedback: type === 'tarea.draft' ? saved?.feedback : undefined,
          revision: (saved?.revision ?? 0) + 1, updatedAt: new Date().toISOString(),
          status: type === 'tarea.submit' ? 'entregada' : saved?.status === 'requiere_correccion' ? 'requiere_correccion' : 'en_progreso',
          submittedAt: type === 'tarea.submit' ? new Date().toISOString() : undefined,
          history: saved ? [...(saved.history || []), saved && { content: saved.content, grade: saved.grade, gradeScale: saved.gradeScale, feedback: saved.feedback, submittedAt: saved.submittedAt, updatedAt: saved.updatedAt }] : []
        }, user.id, [user.email, teacher.email]);
      } else if (['tarea.grade', 'tarea.review', 'tarea.correction'].includes(type)) {
        const row = this.db.prepare("SELECT * FROM documents WHERE kind='submission' AND id=?").get(text(p.submissionId, 300));
        if (!row || !canRead(row, user)) reject(404, 'No se encontró esa entrega.');
        const submission = JSON.parse(row.payload);
        if (p.revision !== undefined && p.revision !== (submission.revision ?? 0)) reject(409, 'La entrega cambió. Recarga antes de calificar.');
        const task = this.db.prepare("SELECT * FROM documents WHERE kind='tarea' AND id=?").get(submission.tareaId);
        if (!task || task.owner !== user.id) reject(403, 'No puedes gestionar esta entrega.');
        if (!submission.submittedAt || submission.status === 'requiere_correccion') reject(409, 'Solo puedes revisar entregas definitivas.');
        if (type === 'tarea.review' && submission.grade !== undefined) reject(409, 'La entrega ya está calificada. Solicita una corrección para reabrirla.');
        if (type === 'tarea.grade' && (!Number.isFinite(p.grade) || p.grade < 1 || p.grade > 5 || Math.abs(p.grade * 10 - Math.round(p.grade * 10)) > 1e-8)) reject(400, 'La calificación no es válida.');
        if (type !== 'tarea.review') text(p.feedback, 2000);
        this.put('submission', { ...submission, status: type === 'tarea.grade' ? 'calificada' : type === 'tarea.review' ? 'en_revision' : 'requiere_correccion',
          grade: type === 'tarea.grade' ? p.grade : undefined,
          gradeScale: type === 'tarea.grade' ? 5 : undefined,
          feedback: type === 'tarea.review' ? submission.feedback : p.feedback,
          gradedAt: type === 'tarea.grade' ? new Date().toISOString() : undefined,
          revision: (submission.revision ?? 0) + 1 }, row.owner, row.audience);
        const student = JSON.parse(this.db.prepare('SELECT profile FROM users WHERE id=?').get(submission.studentId).profile);
        this.notice(user, [student.email], 'task', type === 'tarea.grade' ? 'Tu tarea ha sido calificada' : type === 'tarea.review' ? 'Tu tarea está en revisión' : 'Tu tarea requiere corrección', type === 'tarea.grade' ? `Nota: ${p.grade.toFixed(1)} / 5.0. ${p.feedback}` : p.feedback || 'Consulta el estado de tu entrega.', '/tareas', submission.tareaId);
      } else if (type === 'notice.receipt') {
        const row = this.db.prepare('SELECT * FROM notices WHERE id=?').get(text(p.id, 200));
        if (!row || !canRead(row, user)) reject(404, 'La notificación no existe.');
        this.db.prepare('INSERT INTO receipts VALUES (?,?,?,?) ON CONFLICT(user_id,notice_id) DO UPDATE SET is_read=excluded.is_read, deleted=excluded.deleted').run(user.id, p.id, p.read ? 1 : 0, p.deleted ? 1 : 0);
      } else reject(400, 'Acción no válida.');
      if (event.id) this.db.prepare('INSERT INTO operations VALUES (?,?)').run(user.id, text(event.id, 200));
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    return this.snapshot(user);
  }
}

let sharedStore;
export function createAcademicRouter({ store } = {}) {
  const router = Router();
  const database = () => store ?? (sharedStore ??= new AcademicStore());
  router.use(json({ limit: '512kb' }));
  const endpoint = (handler) => (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try { res.json(handler(req, database())); }
    catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo guardar el contenido. Intenta de nuevo.' }); }
  };
  router.post('/register', endpoint((req, db) => ({ user: db.register(req.body) })));
  router.post('/login', endpoint((req, db) => db.login(req.body)));
  router.get('/state', endpoint((req, db) => db.snapshot(db.authenticate(req.headers.authorization))));
  router.post('/events', endpoint((req, db) => db.mutate(db.authenticate(req.headers.authorization), req.body)));
  return router;
}
