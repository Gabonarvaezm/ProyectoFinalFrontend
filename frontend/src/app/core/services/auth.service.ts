import { isPlatformBrowser } from '@angular/common';
import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Observable, throwError, tap, catchError, switchMap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly _sessionToken = signal<string | null>(this.loadToken());
  public readonly sessionToken = this._sessionToken.asReadonly();
  private readonly _currentUser = signal<User | null>(this.loadActiveSession());

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly isProfessor = computed(() => this._currentUser()?.role === 'professor');
  public readonly isStudent = computed(() => this._currentUser()?.role === 'student');
  public readonly dashboardRoute = computed(() =>
    this.isProfessor() ? AUTH_ROUTES.PROFESSOR : AUTH_ROUTES.STUDENT
  );

  /**
   * Carga la sesión activa almacenada previamente en localStorage
   */
  private loadActiveSession(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storedSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        if (storedSession) {
          return JSON.parse(storedSession) as User;
        }
      } catch (err) {
        console.warn('[AuthService] No se pudo restaurar la sesión:', err);
      }
    }
    return null;
  }

  /**
   * Autenticación con credenciales institucionales.
   * El servidor valida la contraseña y determina el rol de la cuenta registrada.
   */
  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      return throwError(() => new Error('Credenciales incompletas.'));
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes('@') || password.length < 6) {
      return throwError(
        () => new Error('Credenciales no válidas o contraseña inferior a 6 caracteres.')
      );
    }

    const registeredData = this.getRegisteredUserData(trimmedEmail);
    const request = () => this.http.post<AuthResponse>('/api/academic/login', { email: trimmedEmail, password });
    return request().pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !registeredData) return throwError(() => this.toError(error));
        return this.http.post('/api/academic/register', { ...registeredData, password }).pipe(
          catchError(() => throwError(() => this.toError(error))),
          switchMap(() => request())
        );
      }),
      tap((res) => {
        this._sessionToken.set(res.token);
        if (isPlatformBrowser(this.platformId)) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
      }),
      tap((res) => {
        this._currentUser.set(res.user);
        if (isPlatformBrowser(this.platformId)) {
          // Persistencia de la sesión activa en LocalStorage
          try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(res.user));
            if (credentials.rememberMe) {
              localStorage.setItem(STORAGE_KEYS.USER_EMAIL, trimmedEmail);
            }
          } catch (e) {
            console.warn('[AuthService] Error al persistir sesión en localStorage:', e);
          }
        }
      })
    );
  }

  /**
   * Cierre de sesión y limpieza reactiva en LocalStorage
   */
  public logout(): void {
    this._currentUser.set(null);
    this._sessionToken.set(null);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      } catch (e) {
        console.warn('[AuthService] Error al limpiar storage en logout:', e);
      }
    }
  }

  /**
   * Verifica si el usuario autenticado posee un rol determinado
   */
  public hasRole(role: 'student' | 'professor' | 'admin'): boolean {
    const user = this._currentUser();
    return !!user && (user.role === role || user.role === 'admin');
  }

  /**
   * Retorna el rol actual del usuario autenticado
   */
  public getCurrentRole(): 'student' | 'professor' | 'admin' | null {
    return this._currentUser()?.role ?? null;
  }

  /**
   * Lee de forma segura los datos del usuario registrado desde localStorage
   */
  public getRegisteredUserData(email: string): RegisteredUserData | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_USER);
      if (!stored) return null;

      const data = JSON.parse(stored) as RegisteredUserData;
      if (data?.email && data.email.toLowerCase() === email.trim().toLowerCase()) {
        return data;
      }
    } catch (e) {
      console.warn('[AuthService] Error al leer usuario registrado de storage:', e);
    }

    return null;
  }

  /**
   * Obtiene el rol del usuario registrado para un correo específico
   */
  public getRegisteredUserRole(email: string): string | null {
    const data = this.getRegisteredUserData(email);
    if (data?.role) return data.role;

    const mock = MOCK_USERS.find((m) => m.user.email.toLowerCase() === email.trim().toLowerCase());
    return mock?.user.role ?? null;
  }

  public register(data: RegisteredUserData & { password: string }): Observable<{ user: User }> {
    return this.http.post<{ user: User }>('/api/academic/register', data).pipe(
      tap(({ user }) => {
        if (isPlatformBrowser(this.platformId)) localStorage.setItem(STORAGE_KEYS.REGISTERED_USER, JSON.stringify(user));
      }),
      catchError((error: unknown) => throwError(() => this.toError(error)))
    );
  }

  private loadToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try { return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN); } catch { return null; }
  }

  private toError(error: unknown): Error {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) return error;
    const detail: unknown = error instanceof HttpErrorResponse ? error.error : null;
    return new Error(typeof detail === 'object' && detail !== null && 'error' in detail && typeof detail.error === 'string'
      ? detail.error : 'No se pudo conectar con el servidor. Intenta de nuevo.');
  }
}
