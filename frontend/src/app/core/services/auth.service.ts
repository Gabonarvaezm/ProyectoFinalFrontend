import { isPlatformBrowser } from '@angular/common';
import { Injectable, computed, inject, PLATFORM_ID, DestroyRef, signal } from '@angular/core';
import { Observable, throwError, tap, catchError, defer } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ACADEMIC_MODE } from './academic-mode';
import { LocalAcademicRepository } from './local-academic.repository';
import { LocalPersistenceService } from './local-persistence.service';
import { AUTH_ROUTES } from '../constants/auth.constants';
import {
  AuthResponse,
  LoginCredentials,
  RegisteredUserData,
  STORAGE_KEYS,
  User,
} from '../models/auth.model';

export interface MockAccount {
  user: User;
  passwordHash: string;
}

/**
 * Catálogo central de usuarios mock predefinidos para la plataforma DiscerIA.
 * Conserva las cuentas de demostración utilizadas por la interfaz y sus pruebas.
 */
export const MOCK_USERS: MockAccount[] = [
  {
    user: {
      id: 'usr-prof-001',
      email: 'profesor@universidad.edu',
      fullName: 'Prof. Carlos Mendoza',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      role: 'professor',
      institution: 'Universidad Tecnológica Nacional',
    },
    passwordHash: 'password123',
  },
  {
    user: {
      id: 'usr-stud-001',
      email: 'estudiante@universidad.edu',
      fullName: 'Alejandro Silva',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256',
      role: 'student',
      institution: 'Universidad Tecnológica Nacional',
    },
    passwordHash: 'password123',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly mode = inject(ACADEMIC_MODE);
  private readonly local = inject(LocalAcademicRepository);
  private readonly storage = inject(LocalPersistenceService);
  readonly isLocalDemo = this.mode === 'local';
  private readonly restored = this.restore();
  private readonly _sessionToken = signal<string | null>(this.restored?.token ?? null);
  private readonly _currentUser = signal<User | null>(this.restored?.user ?? null);
  readonly sessionToken = this._sessionToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isProfessor = computed(() => this.currentUser()?.role === 'professor');
  readonly isStudent = computed(() => this.currentUser()?.role === 'student');
  readonly dashboardRoute = computed(() => this.isProfessor() ? AUTH_ROUTES.PROFESSOR : AUTH_ROUTES.STUDENT);

  constructor() {
    if (this.isLocalDemo && isPlatformBrowser(this.platformId)) {
      const changed = (event: StorageEvent) => {
        if (event.key === STORAGE_KEYS.LOCAL_SESSION || event.key === STORAGE_KEYS.LOCAL_ACADEMIC || event.key === null) {
          const session = this.restore();
          if (session?.user.id !== this.currentUser()?.id) {
            this._currentUser.set(session?.user ?? null); this._sessionToken.set(session?.token ?? null);
          }
        }
      };
      window.addEventListener('storage', changed);
      inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', changed));
    }
  }
  private restore(): AuthResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      if (this.isLocalDemo) return this.local.session();
      const token = this.storage.readText(STORAGE_KEYS.AUTH_TOKEN);
      const user = this.storage.read<User | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
      return token && !token.startsWith('local-') && user ? { token, user } : null;
    } catch (error: unknown) {
      // The storage service exposes a persistent visible error; never substitute another account.
      console.error('[AuthService] No se pudo restaurar la sesión.', error); return null;
    }
  }
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const email = credentials.email.trim().toLowerCase();
    if (!email.includes('@')) return throwError(() => new Error('Correo no válido.'));
    const request = this.isLocalDemo ? defer(() => [this.local.login(email)])
      : !credentials.password || credentials.password.length < 6 ? throwError(() => new Error('Credenciales incompletas.'))
      : this.http.post<AuthResponse>('/api/academic/login', { email, password: credentials.password });
    return request.pipe(tap((res) => {
      if (!this.isLocalDemo && isPlatformBrowser(this.platformId)) {
        this.storage.writeText(STORAGE_KEYS.AUTH_TOKEN, res.token);
        this.storage.write(STORAGE_KEYS.ACTIVE_SESSION, res.user);
      }
      if (credentials.rememberMe && isPlatformBrowser(this.platformId)) this.storage.writeText(STORAGE_KEYS.USER_EMAIL, email);
      this._currentUser.set(res.user); this._sessionToken.set(res.token);
    }), catchError((error: unknown) => throwError(() => this.toError(error))));
  }
  register(data: RegisteredUserData & { password: string }): Observable<{ user: User }> {
    if (this.isLocalDemo) return defer(() => [{ user: this.local.register(data) }]);
    return this.http.post<{ user: User }>('/api/academic/register', data).pipe(
      tap(({ user }) => { if (isPlatformBrowser(this.platformId)) this.storage.write(STORAGE_KEYS.REGISTERED_USER, user); }),
      catchError((error: unknown) => throwError(() => this.toError(error))));
  }
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isLocalDemo) this.local.logout();
      else { this.storage.remove(STORAGE_KEYS.ACTIVE_SESSION); this.storage.remove(STORAGE_KEYS.AUTH_TOKEN); }
      this.storage.remove(STORAGE_KEYS.USER_EMAIL);
    }
    this._currentUser.set(null); this._sessionToken.set(null);
  }
  hasRole(role: User['role']): boolean { return this.currentUser()?.role === role || this.currentUser()?.role === 'admin'; }
  getCurrentRole(): User['role'] | null { return this.currentUser()?.role ?? null; }
  getRegisteredUserData(email: string): RegisteredUserData | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (this.isLocalDemo) {
      const user = this.local.profile(email);
      return user ? { ...user, institution: user.institution ?? '' } : null;
    }
    const user = this.storage.read<RegisteredUserData | null>(STORAGE_KEYS.REGISTERED_USER, null);
    return user?.email.toLowerCase() === email.trim().toLowerCase() ? user : null;
  }
  getRegisteredUserRole(email: string): string | null { return this.getRegisteredUserData(email)?.role ?? MOCK_USERS.find((m) => m.user.email === email.trim().toLowerCase())?.user.role ?? null; }
  private toError(error: unknown): Error {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) return error;
    const detail: unknown = error instanceof HttpErrorResponse ? error.error : null;
    return new Error(typeof detail === 'object' && detail !== null && 'error' in detail && typeof detail.error === 'string'
      ? detail.error : 'No se pudo conectar con el servidor. Revisa la configuración del modo servidor.');
  }
}
