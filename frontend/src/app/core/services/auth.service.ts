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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _currentUser = signal<User | null>(null);

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /**
   * Autenticación con credenciales institucionales.
   * Valida integridad básica y lee los datos del usuario registrado desde localStorage
   * para asignar el rol institucional ('student' | 'professor' | 'admin').
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

    // Obtener datos del registro previo si existen
    const registeredData = this.getRegisteredUserData(trimmedEmail);

    const user: User = {
      id: `usr-${Date.now()}`,
      email: trimmedEmail,
      fullName: registeredData?.fullName ?? this.extractNameFromEmail(trimmedEmail),
      role: (registeredData?.role as User['role']) ?? 'student',
      institution: registeredData?.institution ?? 'Universidad Tecnológica',
    };

    const response: AuthResponse = {
      user,
      token: `jwt-simulated-token-${Date.now()}`,
    };

    return of(response).pipe(
      delay(900),
      tap((res) => {
        this._currentUser.set(res.user);
        if (credentials.rememberMe && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(STORAGE_KEYS.USER_EMAIL, trimmedEmail);
        }
      })
    );
  }

  /**
   * Cierre de sesión y limpieza reactiva
   */
  public logout(): void {
    this._currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    }
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
    return data?.role ?? null;
  }

  private extractNameFromEmail(email: string): string {
    const namePart = email.split('@')[0] || 'Estudiante';
    return namePart
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
