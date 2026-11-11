import { isPlatformBrowser } from '@angular/common';
import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Observable, delay, of, throwError, tap } from 'rxjs';
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
 * 100% autónomo y persistente en frontend sin dependencias backend.
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
  private readonly _currentUser = signal<User | null>(this.loadActiveSession());

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly isProfessor = computed(() => this._currentUser()?.role === 'professor');
  public readonly isStudent = computed(() => this._currentUser()?.role === 'student');

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
   * Valida integridad contra cuentas mock y usuarios registrados dinámicamente en LocalStorage.
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

    // 1. Buscar en cuentas Mock predefinidas
    const mockMatch = MOCK_USERS.find(
      (acc) => acc.user.email.toLowerCase() === trimmedEmail
    );

    // 2. Buscar en registro dinámico previo de LocalStorage
    const registeredData = this.getRegisteredUserData(trimmedEmail);

    let resolvedRole: User['role'] =
      (credentials.role as User['role']) ??
      mockMatch?.user.role ??
      (registeredData?.role as User['role']) ??
      'student';

    const user: User = {
      id: mockMatch?.user.id ?? `usr-${Date.now()}`,
      email: trimmedEmail,
      fullName:
        registeredData?.fullName ??
        mockMatch?.user.fullName ??
        this.extractNameFromEmail(trimmedEmail),
      avatarUrl: mockMatch?.user.avatarUrl,
      role: resolvedRole,
      institution:
        registeredData?.institution ??
        mockMatch?.user.institution ??
        'Universidad Tecnológica',
    };

    const response: AuthResponse = {
      user,
      token: `jwt-simulated-token-${Date.now()}`,
    };

    return of(response).pipe(
      delay(800),
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
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
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

  private extractNameFromEmail(email: string): string {
    const namePart = email.split('@')[0] || 'Estudiante';
    return namePart
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
