import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ACADEMIC_MODE } from './academic-mode';
import { AuthService } from './auth.service';
import { AcademicSyncService } from './academic-sync.service';
import { SupabaseAuthRepository } from './supabase-auth.repository';
import { SupabaseAcademicError, SupabaseAcademicRepository } from './supabase-academic.repository';
import { SupabaseClientService } from './supabase-client.service';
import { SupabaseFilesRepository } from './supabase-files.repository';
import { authGuard } from '../guards/auth.guard';
import type { AuthResponse } from '../models/auth.model';
import type { AcademicSnapshot } from '../models/academic.model';

const response: AuthResponse = { token: 'supabase-jwt', user: {
  id: 'teacher', email: 'teacher@school.edu', fullName: 'Docente', institution: 'Colegio', role: 'professor',
} };
const empty: AcademicSnapshot = { books: [], posts: [], exams: [], messages: [], tareas: [], students: [], notifications: [] };

describe('Autenticación Supabase y recarga de rutas protegidas', () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  it('espera la restauración y el evento inicial antes de decidir si permite entrar', async () => {
    const repository = {
      subscribe: vi.fn((listener: (session: object) => void) => { listener({ access_token: 'supabase-jwt' }); return vi.fn(); }),
      restore: vi.fn().mockResolvedValue(response), profile: vi.fn().mockResolvedValue(response),
    };
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([]),
      { provide: ACADEMIC_MODE, useValue: 'supabase' }, { provide: SupabaseAuthRepository, useValue: repository }] });
    const auth = TestBed.inject(AuthService);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe(true);
    expect(auth.currentUser()?.role).toBe('professor');
    expect(auth.dashboardRoute()).toBe('/profesor');
  });

  it('usa el rol devuelto por la base y no el seleccionado en el formulario', async () => {
    const repository = { subscribe: vi.fn(() => vi.fn()), restore: vi.fn().mockResolvedValue(null), login: vi.fn().mockResolvedValue(response) };
    TestBed.configureTestingModule({ providers: [provideHttpClient(),
      { provide: ACADEMIC_MODE, useValue: 'supabase' }, { provide: SupabaseAuthRepository, useValue: repository }] });
    const auth = TestBed.inject(AuthService); await auth.whenReady();
    const login = await firstValueFrom(auth.login({ email: 'teacher@school.edu', password: 'Password123', role: 'student' }));
    expect(login.user.role).toBe('professor');
    expect(localStorage.getItem('disceria_auth_token')).toBeNull();
  });
});

describe('Repositorio Supabase', () => {
  it('muta por RPC y después lee con RLS; no usa datos devueltos por una función privilegiada', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: { ok: true }, error: null }).mockResolvedValueOnce({ data: empty, error: null });
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseClientService, useValue: { client: { rpc } } },
      { provide: SupabaseFilesRepository, useValue: { upload: vi.fn() } }] });
    const repository = TestBed.inject(SupabaseAcademicRepository);
    expect(await repository.commit({ id: 'event', type: 'book.publish', payload: { id: 'book' } })).toEqual(empty);
    expect(rpc.mock.calls.map(call => call[0])).toEqual(['academic_mutate', 'academic_snapshot']);
  });

  it('conserva un error de permisos en la cola de fallidos para corregirlo sin reenvíos infinitos', async () => {
    const repository = { snapshot: vi.fn().mockResolvedValue(empty), commit: vi.fn().mockRejectedValue(new SupabaseAcademicError('Solo docentes', 'P0001')) };
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([]),
      { provide: ACADEMIC_MODE, useValue: 'supabase' },
      { provide: SupabaseAcademicRepository, useValue: repository },
      { provide: AuthService, useValue: { currentUser: signal(response.user), sessionToken: signal(response.token), isProfessor: () => true, logout: vi.fn() } }] });
    const sync = TestBed.inject(AcademicSyncService);
    TestBed.runInInjectionContext(() => sync.start()); TestBed.tick();
    await new Promise(resolve => setTimeout(resolve, 0));
    sync.publish('book.publish', { id: 'test' });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(sync.error()).toBe('Solo docentes');
    expect(repository.commit).toHaveBeenCalledTimes(1);
    await sync.refresh();
    expect(repository.commit).toHaveBeenCalledTimes(1);
    sync.discardFailed();
    localStorage.clear();
  });
});
