import { TestBed } from '@angular/core/testing';
import { LocalAcademicRepository } from './local-academic.repository';
import { LocalPersistenceService } from './local-persistence.service';
import { STORAGE_KEYS, User } from '../models/auth.model';

const task = { id: 'task', title: 'Informe local', description: 'Explica el experimento', subject: 'Ciencias', dueDate: '2099-01-01', maxScore: 20, priority: 'media' };
describe('Repositorio académico local', () => {
  let repository: LocalAcademicRepository;
  const act = (user: User, type: string, payload: object) => repository.mutate(user, { id: crypto.randomUUID(), type, payload });
  const teacher = () => repository.login('profesor@universidad.edu').user;
  const student = () => repository.login('estudiante@universidad.edu').user;
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); repository = TestBed.inject(LocalAcademicRepository); });
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

  it('registra múltiples perfiles con identificadores estables y sin guardar contraseñas', () => {
    const data = { email: 'ana@local.edu', fullName: 'Ana Local', institution: 'Colegio', role: 'student' as const, password: 'NO-GUARDAR-ESTA-CLAVE' };
    const user = repository.register(data);
    repository.register({ ...data, email: 'luis@local.edu', fullName: 'Luis Local' });
    repository.login(data.email); repository.logout();
    expect(repository.login(data.email).user.id).toBe(user.id);
    expect(repository.profile('luis@local.edu')?.fullName).toBe('Luis Local');
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC)).not.toContain('NO-GUARDAR');
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC)).not.toContain('password');
    expect(() => repository.register(data)).toThrow('ya tiene');
    repository.logout(); expect(repository.session()).toBeNull();
    expect(() => repository.login('desconocido@local.edu')).toThrow('No existe');
  });

  it('guarda borrador, entrega, revisión, corrección y nota al alternar perfiles del mismo origen', async () => {
    let user = teacher(); act(user, 'tarea.publish', task);
    user = student();
    const attachment = { name: 'informe.txt', mime: 'text/plain', base64: btoa('Archivo persistente') };
    act(user, 'tarea.draft', { tareaId: task.id, content: 'Borrador', attachment, grade: 20 });
    let current = repository.snapshot(user).tareas[0];
    expect(current.status).toBe('en_progreso'); expect(current.mySubmission?.grade).toBeUndefined(); expect(current.mySubmission?.submittedAt).toBeUndefined();
    expect(() => act(user, 'tarea.draft', { tareaId: task.id, content: 'Obsoleto', revision: 0 })).toThrow('más recientes');
    user = teacher(); current = repository.snapshot(user).tareas[0];
    expect(current.submissionsCount).toBe(0);
    expect(current.recipients?.[0].submission?.content).toBe('Borrador');
    expect(() => act(user, 'tarea.grade', { submissionId: current.submissions![0].id, grade: 15, feedback: 'No calificar borrador' })).toThrow('definitivas');
    user = student(); current = repository.snapshot(user).tareas[0];
    expect(current.mySubmission?.attachment?.base64).toBe(attachment.base64);
    await repository.commit(user, { id: 'submit-once', type: 'tarea.submit', payload: { tareaId: task.id, content: 'Respuesta definitiva', attachment, revision: current.mySubmission!.revision } });
    await repository.commit(user, { id: 'submit-once', type: 'tarea.submit', payload: { tareaId: task.id, content: 'Respuesta definitiva', attachment, revision: current.mySubmission!.revision } });
    current = repository.snapshot(user).tareas[0];
    expect(current.submissionsCount).toBe(1);
    expect(() => act(user, 'tarea.draft', { tareaId: task.id, content: 'No permitido', revision: current.mySubmission!.revision })).toThrow('cerrada');
    user = teacher();
    const submissionId = current.mySubmission!.id;
    act(user, 'tarea.review', { submissionId });
    act(user, 'tarea.correction', { submissionId, feedback: 'Amplía tus conclusiones' });
    user = student(); current = repository.snapshot(user).tareas[0];
    expect(current.status).toBe('requiere_correccion');
    act(user, 'tarea.submit', { tareaId: task.id, content: 'Respuesta corregida', attachment, revision: current.mySubmission!.revision });
    user = teacher();
    for (const grade of [0, 0.9, 5.1, 4.55]) {
      expect(() => act(user, 'tarea.grade', { submissionId, grade, feedback: 'Fuera de escala' })).toThrow('no es válida');
    }
    act(user, 'tarea.grade', { submissionId, grade: 4.5, feedback: 'Buen trabajo experimental' });
    user = student(); current = repository.snapshot(user).tareas[0];
    expect(current.status).toBe('calificada'); expect(current.mySubmission?.grade).toBe(4.5);
    expect(current.mySubmission?.feedback).toBe('Buen trabajo experimental');
    expect(current.mySubmission?.gradeScale).toBe(5);
    expect(repository.snapshot(user).notifications.some((n) => JSON.stringify(n).includes('4.5 / 5.0'))).toBe(true);
    expect(current.mySubmission?.attachment?.base64).toBe(attachment.base64);
    expect(repository.snapshot(user).notifications.some((n) => n.title.includes('calificada'))).toBe(true);
    repository.logout(); expect(repository.login(user.email).user.id).toBe(user.id);
    expect(repository.snapshot(user).tareas[0].mySubmission?.grade).toBe(4.5);
  });

  it('rechaza roles falsificados, cuentas ajenas y cambios después de cerrar sesión', () => {
    const owner = teacher(); act(owner, 'tarea.publish', { ...task, recipientEmails: ['estudiante@universidad.edu'] });
    const learner = student();
    expect(() => act({ ...learner, role: 'professor' }, 'tarea.publish', task)).toThrow('docentes');
    act(learner, 'tarea.submit', { tareaId: task.id, content: 'Respuesta propia', grade: 20 });
    expect(repository.snapshot(learner).tareas[0].mySubmission?.grade).toBeUndefined();
    repository.register({ email: 'otro@local.edu', fullName: 'Otro Alumno', role: 'student', institution: owner.institution! });
    const other = repository.login('otro@local.edu').user;
    expect(repository.snapshot(other).tareas).toEqual([]);
    expect(() => act(other, 'tarea.submit', { tareaId: task.id, content: 'Intrusión' })).toThrow('asignada');
    repository.register({ email: 'otrodocente@local.edu', fullName: 'Otro Docente', role: 'professor', institution: owner.institution! });
    const otherTeacher = repository.login('otrodocente@local.edu').user;
    expect(() => act(otherTeacher, 'tarea.grade', { submissionId: `${task.id}:${learner.id}`, grade: 20, feedback: 'Intrusión' })).toThrow('gestionar');
    repository.logout(); expect(() => repository.snapshot(otherTeacher)).toThrow('sesión');
  });

  it('no confirma ni sobrescribe datos cuando se agota la cuota', () => {
    const owner = teacher(); const before = localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
    expect(() => act(owner, 'tarea.publish', task)).toThrow('almacenamiento');
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC)).toBe(before);
    expect(repository.snapshot(owner).tareas).toEqual([]);
    expect(TestBed.inject(LocalPersistenceService).error()).toBeTruthy();
  });

  it('informa corrupción del almacenamiento sin sustituirlo silenciosamente', () => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_ACADEMIC, '{invalid');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => teacher()).toThrow('leer');
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC)).toBe('{invalid');
  });
  it('conserva libros, publicaciones y respuestas al cambiar de perfil sin aceptar verificación docente del alumno', () => {
    let user = teacher();
    const state = repository.snapshot(user);
    act(user, 'book.publish', { ...state.books[0], id: 'new-book', title: 'Libro local nuevo' });
    act(user, 'post.publish', { ...state.posts[0], id: 'new-post', title: 'Pregunta local nueva', content: 'Explica el experimento', replies: [] });
    user = student();
    expect(repository.snapshot(user).books.some((book) => book.id === 'new-book')).toBe(true);
    act(user, 'post.reply', { id: 'reply', postId: 'new-post', content: 'Respuesta local guardada', isTeacherVerified: true });
    repository.logout(); user = teacher();
    const post = repository.snapshot(user).posts.find((item) => item.id === 'new-post')!;
    expect(post.replies).toHaveLength(1);
    expect(post.replies[0].content).toBe('Respuesta local guardada');
    expect(post.replies[0].isTeacherVerified).toBe(false);
    expect(post.replies[0].author.id).toBe('usr-stud-001');
  });

  it('consulta documentos v1 sin migrarlos y conserva el adjunto definitivo al guardar una corrección', () => {
    let user = teacher(); act(user, 'tarea.publish', task); user = student();
    const attachment = { name: 'entrega.txt', mime: 'text/plain', base64: btoa('Entrega original persistente') };
    act(user, 'tarea.submit', { tareaId: task.id, content: 'Definitiva original', attachment });
    const original = localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC);
    repository.snapshot(user);
    expect(localStorage.getItem(STORAGE_KEYS.LOCAL_ACADEMIC)).toBe(original);
    user = teacher(); const submissionId = repository.snapshot(user).tareas[0].submissions![0].id;
    act(user, 'tarea.correction', { submissionId, feedback: 'Amplía el desarrollo' });
    user = student(); const before = repository.snapshot(user).tareas[0].mySubmission!;
    act(user, 'tarea.draft', { tareaId: task.id, content: 'Corrección aún sin entregar', revision: before.revision });
    user = teacher(); const submission = repository.snapshot(user).tareas[0].submissions![0];
    expect(submission.content).toBe('Corrección aún sin entregar');
    expect(submission.submittedAt).toBeUndefined();
    expect(submission.history?.find((item) => item.submittedAt)?.content).toBe('Definitiva original');
    expect(submission.history?.find((item) => item.submittedAt)?.attachment).toEqual(attachment);
  });

});
