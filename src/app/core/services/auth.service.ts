import { isPlatformBrowser } from '@angular/common';
import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Observable, delay, of, throwError, tap } from 'rxjs';
import { AuthResponse, LoginCredentials, User } from '../models/auth.model';

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
   * Lee los datos del usuario registrado desde localStorage para
   * asignar correctamente el rol y nombre al usuario autenticado.
   */
  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      return throwError(() => new Error('Credenciales incompletas.'));
    }

    // Intentar obtener datos del registro previo
    const registeredData = this.getRegisteredUserData(email);

    const user: User = {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      fullName: registeredData?.fullName ?? this.extractNameFromEmail(email),
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
          localStorage.setItem('disceria_user_email', email);
        }
      })
    );
  }

  /**
   * Cierre de sesión
   */
  public logout(): void {
    this._currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('disceria_user_email');
    }
  }

  /**
   * Lee los datos del usuario registrado desde localStorage.
   * Esto permite que el servicio conozca el rol, nombre e institución
   * del usuario que se registró previamente.
   */
  private getRegisteredUserData(email: string): {
    fullName: string;
    email: string;
    institution: string;
    role: string;
  } | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const stored = localStorage.getItem('disceria_registered_user');
      if (!stored) return null;

      const data = JSON.parse(stored) as {
        fullName: string;
        email: string;
        institution: string;
        role: string;
      };

      if (data.email === email.toLowerCase()) {
        return data;
      }
    } catch {
      // Si hay error al parsear, se ignora silenciosamente
    }

    return null;
  }

  private extractNameFromEmail(email: string): string {
    const namePart = email.split('@')[0] || 'Estudiante';
    return namePart
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
