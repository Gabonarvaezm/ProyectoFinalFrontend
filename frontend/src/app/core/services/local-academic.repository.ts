import { Injectable, inject } from '@angular/core';
import { AcademicEvent, AcademicSnapshot, PublishedExam, PublishedMessage } from '../models/academic.model';
import { AuthResponse, RegisteredUserData, STORAGE_KEYS, User } from '../models/auth.model';
import { Tarea, TareaSubmission, TareaStatus, AcademicFile } from '../../tarea/models/tarea.model';
import { Book } from '../../biblioteca/models/book.model';
import { ForumAuthor, ForumPost, ForumReply } from '../../foro/models/foro.model';
import { StudentNotification } from '../../estudiante/models/estudiante.model';
import { StudentProgress } from '../../profesor/models/profesor.model';
import { INITIAL_BOOKS } from '../../biblioteca/data/books.data';
import { INITIAL_FORUM_POSTS } from '../../foro/data/foro.data';
import { LocalPersistenceService } from './local-persistence.service';

type OwnedTask = Tarea & { ownerId: string };
type LocalNotice = StudentNotification & { ownerId: string; audience: string[]; createdAt: string; resourceId: string };
interface LocalSchool {
  version: 1;
  revision: number;
  users: User[];
  tareas: OwnedTask[];
  submissions: TareaSubmission[];
  books: (Book & { ownerId?: string })[];
  posts: (ForumPost & { audience?: string[] })[];
  exams: (PublishedExam & { ownerId: string; audience: string[] })[];
  messages: (PublishedMessage & { ownerId: string; audience: string[] })[];
  students: (StudentProgress & { ownerId: string })[];
  notifications: LocalNotice[];
  receipts: Record<string, { read: boolean; deleted: boolean }>;
  votes: string[];
  operations: string[];
}
const demoUsers: User[] = [
  { id: 'usr-prof-001', fullName: 'Prof. Carlos Mendoza', email: 'profesor@universidad.edu', role: 'professor', institution: 'Universidad Tecnológica Nacional' },
  { id: 'usr-stud-001', fullName: 'Alejandro Silva', email: 'estudiante@universidad.edu', role: 'student', institution: 'Universidad Tecnológica Nacional' },
];
function initialSchool(): LocalSchool {
  return { version: 1, revision: 0, users: structuredClone(demoUsers), tareas: [], submissions: [],
    books: structuredClone(INITIAL_BOOKS), posts: structuredClone([...INITIAL_FORUM_POSTS]), exams: [], messages: [], students: [], notifications: [], receipts: {}, votes: [], operations: [] };
}
function required(value: unknown, limit = 10000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error('Revisa los datos enviados.');
  return value.trim();
}
function file(value: unknown): AcademicFile | undefined {
  if (value === undefined || value === null) return undefined;
  const f = value as Partial<AcademicFile>;
  if (!f || typeof f.base64 !== 'string' || f.base64.length > 245760 || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.base64)) throw new Error('Archivo inválido o mayor de 180 KB.');
  const bytes = atob(f.base64);
  const valid = f.mime === 'application/pdf' ? bytes.startsWith('%PDF-')
    : f.mime === 'image/png' ? bytes.startsWith('\x89PNG\r\n\x1a\n')
    : f.mime === 'image/jpeg' ? bytes.startsWith('\xff\xd8\xff')
    : f.mime === 'text/plain' && !bytes.includes('\0');
  if (!bytes.length || bytes.length > 180 * 1024 || !valid) throw new Error('El contenido no corresponde a un archivo permitido.');
  return { name: required(f.name, 150).replace(/[\\/\r\n]/g, '_'), mime: f.mime!, base64: f.base64 };
}
const authorOf = (user: User): ForumAuthor => ({ id: user.id, name: user.fullName, role: user.role === 'professor' ? 'professor' : 'student', institution: user.institution ?? '', initials: user.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() });
const statusOf = (task: Tarea, submission?: TareaSubmission): TareaStatus => submission?.status === 'requiere_correccion' ? 'requiere_correccion'
  : submission?.grade !== undefined ? 'calificada' : submission?.submittedAt ? (submission.status === 'en_revision' ? 'en_revision' : 'entregada')
  : expired(task) ? 'vencida' : submission ? 'en_progreso' : 'pendiente';
const expired = (task: Tarea): boolean => !!task.dueDate && Date.now() > Date.parse(`${task.dueDate}T23:59:59-05:00`);

/** Local demonstration only: logical permissions, not a security boundary against DevTools. */
@Injectable({ providedIn: 'root' })
export class LocalAcademicRepository {
  private readonly storage = inject(LocalPersistenceService);
  private read(): LocalSchool {
    let db = this.storage.read<LocalSchool | null>(STORAGE_KEYS.LOCAL_ACADEMIC, null);
    if (!db) {
      db = initialSchool();
      const legacy = this.storage.read<RegisteredUserData | null>(STORAGE_KEYS.REGISTERED_USER, null);
      if (legacy && typeof legacy.email === 'string' && typeof legacy.fullName === 'string' && typeof legacy.institution === 'string' && ['student', 'professor'].includes(legacy.role) && !db.users.some((user) => user.email === legacy.email.toLowerCase())) {
        db.users.push({ id: `legacy-local:${legacy.email.toLowerCase()}`, email: legacy.email.toLowerCase(), fullName: legacy.fullName, institution: legacy.institution, role: legacy.role });
      }
    }
    if (db.version !== 1 || !Array.isArray(db.users) || !Array.isArray(db.tareas) || !Array.isArray(db.submissions)) throw new Error('Los datos locales no tienen un formato compatible. No se han sobrescrito.');
    return db;
  }
  private save(db: LocalSchool): void { db.revision++; this.storage.write(STORAGE_KEYS.LOCAL_ACADEMIC, db); }
  session(): AuthResponse | null {
    const session = this.storage.read<{ userId: string } | null>(STORAGE_KEYS.LOCAL_SESSION, null);
    if (!session) return null;
    const user = this.read().users.find((item) => item.id === session.userId);
    return user ? { user, token: `local-demo:${user.id}` } : null;
  }
  register(data: RegisteredUserData): User {
    const db = this.read();
    const email = required(data.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo no es válido.');
    if (db.users.some((user) => user.email === email)) throw new Error('Este correo ya tiene un perfil local. Inicia sesión.');
    if (!['student', 'professor'].includes(data.role)) throw new Error('Selecciona un rol válido.');
    // Construct explicitly: passwords and arbitrary client fields never enter persistence.
    const user: User = { id: crypto.randomUUID(), email, fullName: required(data.fullName, 150), institution: required(data.institution, 200), role: data.role };
    db.users.push(user); this.save(db); return user;
  }
  login(email: string): AuthResponse {
    const db = this.read();
    const user = db.users.find((item) => item.email === email.trim().toLowerCase());
    if (!user) throw new Error('No existe ese perfil local. Regístrate primero en este navegador.');
    this.save(db);
    this.storage.write(STORAGE_KEYS.LOCAL_SESSION, { userId: user.id });
    return { user, token: `local-demo:${user.id}` };
  }
  logout(): void { this.storage.remove(STORAGE_KEYS.LOCAL_SESSION); }
  profile(email: string): User | undefined { return this.read().users.find((user) => user.email === email.trim().toLowerCase()); }
  private account(db: LocalSchool, caller: User): User {
    const session = this.storage.read<{ userId: string } | null>(STORAGE_KEYS.LOCAL_SESSION, null);
    const user = db.users.find((item) => item.id === caller.id);
    if (!user || session?.userId !== user.id) throw new Error('La sesión local cambió. Inicia sesión de nuevo.');
    return user;
  }
  snapshot(caller: User): AcademicSnapshot {
    const db = this.read(); return this.view(db, this.account(db, caller));
  }
  private roster(db: LocalSchool, teacher: User): User[] { return db.users.filter((user) => user.role === 'student' && user.institution === teacher.institution); }
  private view(db: LocalSchool, user: User): AcademicSnapshot {
    const tareas = db.tareas.filter((task) => user.role === 'professor' ? task.ownerId === user.id : task.recipientEmails?.includes(user.email)).map((task) => {
      const visible = db.submissions.filter((s) => s.tareaId === task.id && (user.role === 'professor' || s.studentId === user.id));
      const mySubmission = user.role === 'professor' ? visible.find((s) => s.submittedAt) : visible.find((s) => s.studentId === user.id);
      return { ...task, recipientEmails: user.role === 'professor' ? task.recipientEmails : undefined,
        mySubmission, status: statusOf(task, mySubmission), submissionsCount: visible.filter((s) => s.submittedAt && s.status !== 'requiere_correccion').length,
        submissions: user.role === 'professor' ? visible : undefined,
        recipients: user.role === 'professor' ? this.roster(db, user).filter((student) => task.recipientEmails?.includes(student.email)).map((student) => {
          const submission = visible.find((s) => s.studentId === student.id);
          return { studentId: student.id, studentName: student.fullName, email: student.email, status: statusOf(task, submission), submission };
        }) : undefined };
    });
    const students: StudentProgress[] = user.role === 'professor' ? this.roster(db, user).map((student) => {
      const progress = db.students.find((item) => item.email === student.email && item.ownerId === user.id);
      const assignments = tareas.flatMap((task) => (task.recipients ?? []).filter((r) => r.studentId === student.id).map((r) => ({ ...r, maxScore: task.maxScore, subject: task.subject })));
      const grades = assignments.filter((item) => item.submission?.grade !== undefined);
      const score = grades.length ? Math.round(grades.reduce((sum, item) => sum + item.submission!.grade! / (item.submission!.gradeScale ?? item.maxScore) * 100, 0) / grades.length) : 0;
      const attention = assignments.some((item) => ['vencida', 'requiere_correccion'].includes(item.status)) || (grades.length > 0 && score < 50);
      return { studentName: student.fullName, topic: assignments[0]?.subject ?? 'Sin asignar', score,
        status: attention ? 'needs-attention' : 'active', statusLabel: attention ? 'Requiere atención' : 'Activo',
        ...progress, ...(assignments.length ? { score, status: attention ? 'needs-attention' as const : 'active' as const, statusLabel: attention ? 'Requiere atención' : 'Activo' } : {}), id: student.id, email: student.email };
    }) : [];
    const posts = db.posts.filter((post) => !post.audience || post.author.id === user.id || post.audience.includes(user.email)).map((post) => {
      const votes = (replyId: string) => db.votes.filter((key) => key.startsWith(`${post.id}:${replyId}:`));
      return { ...post, helpfulCount: post.helpfulCount + votes('').length, userHasVotedHelpful: votes('').includes(`${post.id}::${user.id}`),
        repliesCount: post.replies.length, replies: post.replies.map((reply) => ({ ...reply, helpfulCount: reply.helpfulCount + votes(reply.id).length, userHasVotedHelpful: votes(reply.id).includes(`${post.id}:${reply.id}:${user.id}`) })) };
    });
    return { tareas, students, books: db.books, posts,
      exams: db.exams.filter((item) => item.ownerId === user.id || item.audience.includes(user.email)),
      messages: db.messages.filter((item) => item.ownerId === user.id || item.audience.includes(user.email)),
      notifications: db.notifications.filter((notice) => notice.ownerId !== user.id && notice.audience.includes(user.email) && !db.receipts[`${user.id}:${notice.id}`]?.deleted)
        .map((notice) => ({ ...notice, read: db.receipts[`${user.id}:${notice.id}`]?.read ?? false })) };
  }
  async commit(user: User, event: AcademicEvent): Promise<AcademicSnapshot> {
    // Web Locks serialize cooperating same-origin tabs. No network is involved.
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(STORAGE_KEYS.LOCAL_ACADEMIC, () => this.mutate(user, event));
    return this.mutate(user, event);
  }
  mutate(caller: User, event: AcademicEvent): AcademicSnapshot {
    const db = this.read();
    const user = this.account(db, caller);
    const type = event.type;
    const p = event.payload as Record<string, unknown>;
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Contenido inválido.');
    const operation = `${user.id}:${event.id}`;
    if (event.id && db.operations.includes(operation)) return this.view(db, user);
    if (['tarea.publish', 'tarea.delete', 'tarea.grade', 'tarea.review', 'tarea.correction', 'book.publish', 'book.recommend', 'exam.publish', 'message.publish', 'student.upsert', 'student.remove'].includes(type) && user.role !== 'professor') throw new Error('Esta acción solo está disponible para docentes.');
    const notice = (audience: string[], title: string, message: string, route = '/tareas', resourceId = String(p['id'] ?? p['tareaId'] ?? '')) => {
      db.notifications.unshift({ id: crypto.randomUUID(), type: route === '/tareas' ? 'task' : 'teacher_announcement', title, message, authorName: user.fullName, authorRole: user.role === 'professor' ? 'professor' : 'student', authorInitials: authorOf(user).initials,
        timeAgo: 'Hace un momento', createdAt: new Date().toISOString(), read: false, actionRoute: route, resourceId, ownerId: user.id, audience });
    };
    if (type === 'tarea.publish') {
      const id = required(p['id'], 200);
      const previous = db.tareas.find((task) => task.id === id);
      if (previous && previous.ownerId !== user.id) throw new Error('Solo el autor puede modificar esta tarea.');
      const roster = this.roster(db, user);
      const recipients = p['recipientEmails'] === undefined ? roster.map((student) => student.email) : p['recipientEmails'];
      if (!Array.isArray(recipients) || recipients.some((email: unknown) => typeof email !== 'string' || !roster.some((s) => s.email === email)) || !recipients.length) throw new Error('Selecciona estudiantes registrados de tu institución antes de asignar.');
      const dueDate = required(p['dueDate'], 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate))) throw new Error('Fecha inválida.');
      if (typeof p['maxScore'] !== 'number' || !Number.isFinite(p['maxScore']) || p['maxScore'] <= 0) throw new Error('Escala de calificación inválida.');
      const task: OwnedTask = { id, title: required(p['title'], 150), description: required(p['description']), subject: required(p['subject'], 100), dueDate, maxScore: p['maxScore'],
        priority: ['alta', 'media', 'baja'].includes(String(p['priority'])) ? p['priority'] as Tarea['priority'] : 'media', assignedDate: new Date().toISOString().slice(0, 10), assignedBy: user.fullName,
        instructions: typeof p['instructions'] === 'string' ? p['instructions'] : '', criteria: typeof p['criteria'] === 'string' ? p['criteria'] : '', material: file(p['material']),
        recipientEmails: [...new Set(recipients as string[])], ownerId: user.id, status: 'pendiente', submissionsCount: 0 };
      db.tareas = [task, ...db.tareas.filter((item) => item.id !== id)]; notice(task.recipientEmails!, `Nueva tarea: ${task.title}`, task.description);
    } else if (type === 'tarea.delete') {
      const task = db.tareas.find((item) => item.id === p['id']);
      if (!task || task.ownerId !== user.id) throw new Error('No puedes eliminar esta tarea.');
      db.tareas = db.tareas.filter((item) => item.id !== task.id);
      db.submissions = db.submissions.filter((item) => item.tareaId !== task.id);
    } else if (type === 'tarea.draft' || type === 'tarea.submit') {
      if (user.role !== 'student') throw new Error('Solo los estudiantes pueden desarrollar tareas.');
      const task = db.tareas.find((item) => item.id === p['tareaId']);
      if (!task?.recipientEmails?.includes(user.email)) throw new Error('No tienes asignada esta tarea.');
      const previous = db.submissions.find((s) => s.tareaId === task.id && s.studentId === user.id);
      if (previous?.submittedAt && previous.status !== 'requiere_correccion') throw new Error('La entrega está cerrada. El docente debe autorizar una corrección.');
      if ((previous?.revision ?? 0) !== (p['revision'] ?? 0)) throw new Error('Hay cambios más recientes. Recarga antes de guardar.');
      if (expired(task) && previous?.status !== 'requiere_correccion') throw new Error('El plazo de esta tarea ha vencido.');
      if (typeof p['content'] !== 'string' || p['content'].length > 10000 || (type === 'tarea.submit' && !p['content'].trim())) throw new Error('Escribe una respuesta válida.');
      const attachmentUrl = p['attachmentUrl'] ? required(p['attachmentUrl'], 2000) : undefined;
      if (attachmentUrl && !/^https:\/\//i.test(attachmentUrl)) throw new Error('El enlace debe usar HTTPS.');
      const submission: TareaSubmission = { id: `${task.id}:${user.id}`, tareaId: task.id, studentId: user.id, studentName: user.fullName, content: p['content'].trim(),
        attachment: file(p['attachment']), attachmentUrl, comments: typeof p['comments'] === 'string' ? p['comments'].slice(0, 500) : '',
        status: type === 'tarea.submit' ? 'entregada' : previous?.status === 'requiere_correccion' ? 'requiere_correccion' : 'en_progreso',
        submittedAt: type === 'tarea.submit' ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString(), revision: (previous?.revision ?? 0) + 1,
        feedback: type === 'tarea.draft' ? previous?.feedback : undefined,
        history: previous ? [...(previous.history ?? []), { content: previous.content, grade: previous.grade, gradeScale: previous.gradeScale, feedback: previous.feedback, submittedAt: previous.submittedAt, updatedAt: previous.updatedAt,
          ...(previous.submittedAt ? { attachment: previous.attachment, attachmentUrl: previous.attachmentUrl } : {}) }] : [] };
      db.submissions = [submission, ...db.submissions.filter((item) => item.id !== submission.id)];
      if (type === 'tarea.submit') {
        const teacher = db.users.find((item) => item.id === task.ownerId)!;
        notice([teacher.email], `Nueva entrega: ${task.title}`, `${user.fullName} envió su actividad.`, '/tareas', task.id);
      }
    } else if (['tarea.grade', 'tarea.review', 'tarea.correction'].includes(type)) {
      const submission = db.submissions.find((s) => s.id === p['submissionId']);
      const task = db.tareas.find((t) => t.id === submission?.tareaId);
      if (!task || !submission || task.ownerId !== user.id) throw new Error('No puedes gestionar esta entrega.');
      if (p['revision'] !== undefined && p['revision'] !== (submission.revision ?? 0)) throw new Error('La entrega cambió. Recarga antes de calificar.');
      if (!submission.submittedAt || submission.status === 'requiere_correccion') throw new Error('Solo puedes revisar entregas definitivas.');
      if (type === 'tarea.review' && submission.grade !== undefined) throw new Error('La entrega ya está calificada.');
      if (type === 'tarea.grade' && (typeof p['grade'] !== 'number' || !Number.isFinite(p['grade']) || p['grade'] < 1 || p['grade'] > 5 || Math.abs(p['grade'] * 10 - Math.round(p['grade'] * 10)) > 1e-8)) throw new Error('La calificación no es válida.');
      const feedback = type === 'tarea.review' ? submission.feedback : required(p['feedback'], 2000);
      if (submission.grade !== undefined) submission.history = [...(submission.history ?? []), { content: submission.content, grade: submission.grade, gradeScale: submission.gradeScale, feedback: submission.feedback, submittedAt: submission.submittedAt, updatedAt: submission.gradedAt }];
      Object.assign(submission, { status: type === 'tarea.grade' ? 'calificada' : type === 'tarea.review' ? 'en_revision' : 'requiere_correccion',
        grade: type === 'tarea.grade' ? p['grade'] : undefined, gradeScale: type === 'tarea.grade' ? 5 : undefined, feedback, gradedAt: type === 'tarea.grade' ? new Date().toISOString() : undefined, revision: (submission.revision ?? 0) + 1 });
      const student = db.users.find((item) => item.id === submission.studentId)!;
      notice([student.email], type === 'tarea.grade' ? 'Tu tarea ha sido calificada' : type === 'tarea.review' ? 'Tu tarea está en revisión' : 'Tu tarea requiere corrección', type === 'tarea.grade' ? `Nota: ${Number(p['grade']).toFixed(1)} / 5.0. ${feedback}` : feedback ?? 'Consulta el estado de tu entrega.', '/tareas', task.id);
    } else if (type === 'book.publish') {
      const book = p as unknown as Book;
      required(book.id, 200); required(book.title, 150); required(book.description);
      const previous = db.books.find((item) => item.id === book.id);
      if (previous?.ownerId && previous.ownerId !== user.id) throw new Error('Solo el autor puede modificar este libro.');
      db.books = [{ ...book, ownerId: user.id }, ...db.books.filter((item) => item.id !== book.id)];
      notice(this.roster(db, user).map((s) => s.email), `Nuevo recurso: ${book.title}`, book.description, '/biblioteca', book.id);
    } else if (type === 'book.recommend') {
      const book = db.books.find((item) => item.id === p['id']); if (!book) throw new Error('El recurso no existe.');
      notice(this.roster(db, user).map((s) => s.email), `Lectura recomendada: ${book.title}`, book.description, '/biblioteca', book.id);
    } else if (type === 'post.publish') {
      const post = p as unknown as ForumPost;
      required(post.id, 200); required(post.title, 150); required(post.content); required(post.subject, 100);
      const previous = db.posts.find((item) => item.id === post.id);
      if (previous && previous.author.id !== user.id) throw new Error('Solo el autor puede modificar esta publicación.');
      db.posts = [{ ...post, author: authorOf(user), replies: previous?.replies ?? [], repliesCount: previous?.replies.length ?? 0, helpfulCount: previous?.helpfulCount ?? 0, isTeacherVerified: user.role === 'professor' }, ...db.posts.filter((item) => item.id !== post.id)];
    } else if (type === 'post.reply') {
      const post = db.posts.find((item) => item.id === p['postId']); if (!post) throw new Error('La publicación no existe.');
      if (post.audience && post.author.id !== user.id && !post.audience.includes(user.email)) throw new Error('No tienes acceso a esta publicación.');
      const reply = p as unknown as ForumReply;
      required(reply.id, 200); required(reply.content);
      post.replies.push({ ...reply, author: authorOf(user), helpfulCount: 0, isTeacherVerified: user.role === 'professor' && !!reply.isTeacherVerified });
      post.repliesCount = post.replies.length; post.isUnanswered = false;
      const recipient = db.users.find((item) => item.id === post.author.id);
      if (recipient) notice([recipient.email], `Nueva respuesta: ${post.title}`, reply.content, '/foro', post.id);
    } else if (type === 'post.vote') {
      const post = db.posts.find((item) => item.id === p['postId']); if (!post) throw new Error('La publicación no existe.');
      if (post.audience && post.author.id !== user.id && !post.audience.includes(user.email)) throw new Error('No tienes acceso a esta publicación.');
      const replyId = typeof p['replyId'] === 'string' ? p['replyId'] : '';
      if (replyId && !post.replies.some((item) => item.id === replyId)) throw new Error('La respuesta no existe.');
      const key = `${post.id}:${replyId}:${user.id}`;
      db.votes = db.votes.filter((item) => item !== key); if (p['voted']) db.votes.push(key);
    } else if (type === 'exam.publish') {
      const exam = p as unknown as PublishedExam; required(exam.id, 200); required(exam.title, 150);
      db.exams.unshift({ ...exam, authorName: user.fullName, createdAt: new Date().toISOString(), ownerId: user.id, audience: this.roster(db, user).map((s) => s.email) });
      notice(this.roster(db, user).map((s) => s.email), `Nuevo examen: ${exam.title}`, exam.instructions ?? exam.topic, '/estudiante', exam.id);
    } else if (type === 'message.publish') {
      const message = p as unknown as PublishedMessage; required(message.subject, 200); required(message.message);
      const roster = this.view(db, user).students;
      const audience = roster.filter((s) => message.targetGroup === 'all' || s.status === message.targetGroup).map((s) => s.email!);
      if (!audience.length) throw new Error('No hay estudiantes registrados en ese grupo.');
      db.messages.unshift({ ...message, authorName: user.fullName, createdAt: new Date().toISOString(), ownerId: user.id, audience });
      notice(audience, message.subject, message.message, '/estudiante', message.id);
      if (message.sendToForums) db.posts.unshift({ id: `message-${message.id}`, title: message.subject, content: message.message,
        subject: 'General', author: authorOf(user), createdAt: 'Hace un momento', helpfulCount: 0, viewsCount: 0,
        repliesCount: 0, replies: [], isUnanswered: true, isTeacherVerified: true, audience });
    } else if (type === 'student.upsert') {
      const student = p as unknown as StudentProgress;
      const email = required(student.email, 254).toLowerCase();
      if (!this.roster(db, user).some((item) => item.email === email)) throw new Error('El estudiante debe registrar primero un perfil local de tu institución.');
      db.students = [{ ...student, id: email, email, ownerId: user.id }, ...db.students.filter((item) => !(item.email === email && item.ownerId === user.id))];
    } else if (type === 'student.remove') {
      db.students = db.students.filter((item) => !(item.email === p['email'] && item.ownerId === user.id));
    } else if (type === 'notice.receipt') {
      const id = required(p['id'], 200); const item = db.notifications.find((n) => n.id === id);
      if (!item || !item.audience.includes(user.email)) throw new Error('No puedes acceder a este aviso.');
      db.receipts[`${user.id}:${id}`] = { read: !!p['read'], deleted: !!p['deleted'] };
    } else throw new Error('Acción académica desconocida.');
    if (event.id) db.operations = [...db.operations.slice(-999), operation];
    this.save(db);
    return this.view(db, user);
  }
}
