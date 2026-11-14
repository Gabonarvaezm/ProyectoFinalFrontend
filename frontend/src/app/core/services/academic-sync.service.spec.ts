import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AcademicSyncService } from './academic-sync.service';
import { AuthService } from './auth.service';
import { STORAGE_KEYS, User } from '../models/auth.model';
import { AcademicSnapshot } from '../models/academic.model';

const EMPTY: AcademicSnapshot = { books: [], posts: [], exams: [], messages: [], tareas: [], notifications: [], students: [] };
const teacher: User = { id: 'teacher', email: 'teacher@example.com', fullName: 'Docente', role: 'professor' };

describe('AcademicSyncService', () => {
  let service: AcademicSyncService;
  let http: HttpTestingController;
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(teacher));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'teacher-session');
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AcademicSyncService);
    http = TestBed.inject(HttpTestingController);
    TestBed.runInInjectionContext(() => service.start());
    TestBed.tick();
    http.expectOne('/api/academic/state').flush(EMPTY);
    await Promise.resolve();
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  it('publica con la sesión del docente y actualiza los datos después de la confirmación del servidor', async () => {
    service.publish('exam.publish', { id: 'exam', title: 'Fracciones' });
    const write = http.expectOne('/api/academic/events');
    expect(write.request.headers.get('Authorization')).toBe('Bearer teacher-session');
    expect(write.request.body.type).toBe('exam.publish');
    expect(write.request.body.id).toBeTruthy();
    expect(service.saving()).toBe(true);
    write.flush(EMPTY);
    await Promise.resolve();
    http.expectOne('/api/academic/state').flush(EMPTY);
    await Promise.resolve();
    expect(service.saving()).toBe(false);
    expect(localStorage.getItem('disceria_outbox:teacher@example.com')).toBe('[]');
  });

  it('conserva un envío si falla la conexión y lo reintenta sin cambiar su identificador', async () => {
    service.publish('book.publish', { id: 'book', title: 'Geografía' });
    const write = http.expectOne('/api/academic/events');
    const eventId = write.request.body.id;
    write.flush({ error: 'Sin conexión' }, { status: 503, statusText: 'Unavailable' });
    await Promise.resolve();
    expect(service.error()).toBe('Sin conexión');
    expect(localStorage.getItem('disceria_outbox:teacher@example.com')).toContain(eventId);
    service.retry();
    const retry = http.expectOne('/api/academic/events');
    expect(retry.request.body.id).toBe(eventId);
    retry.flush(EMPTY);
    await Promise.resolve();
    http.expectOne('/api/academic/state').flush(EMPTY);
    await Promise.resolve();
    expect(service.error()).toBeNull();
  });

  it('vacía el estado anterior al cambiar de cuenta y carga la bandeja del nuevo estudiante', async () => {
    const auth = TestBed.inject(AuthService);
    const learner: User = { id: 'learner', email: 'learner@example.com', fullName: 'Estudiante', role: 'student' };
    const login = firstValueFrom(auth.login({ email: learner.email, password: 'school123' }));
    http.expectOne('/api/academic/login').flush({ user: learner, token: 'learner-session' });
    await login;
    TestBed.tick();
    expect(service.snapshot()).toBeNull();
    const read = http.expectOne('/api/academic/state');
    expect(read.request.headers.get('Authorization')).toBe('Bearer learner-session');
    read.flush(EMPTY);
    await Promise.resolve();
    expect(service.snapshot()?.messages).toEqual([]);
  });
});
