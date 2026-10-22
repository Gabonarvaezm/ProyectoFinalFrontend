import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, throwError, tap } from 'rxjs';
import { AuthResponse, LoginCredentials, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _currentUser = signal<User | null>(null);

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /**
   * Autenticación con credenciales institucionales
   */
  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    const { email, password } = credentials;

    // Validación simulada (preparada para integrarse a backend real)
    if (!email || !password) {
      return throwError(() => new Error('Credenciales incompletas.'));
    }

    // Simulación de respuesta exitosa
    const mockUser: User = {
      id: 'usr-101',
      email: email.toLowerCase(),
      fullName: this.extractNameFromEmail(email),
      role: 'student',
      institution: 'Universidad Tecnológica',
    };

    const mockResponse: AuthResponse = {
      user: mockUser,
      token: 'jwt-simulated-token-disceria',
    };

    return of(mockResponse).pipe(
      delay(900),
      tap((response) => {
        this._currentUser.set(response.user);
        if (credentials.rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('disceria_user_email', email);
        }
      })
    );
  }

  /**
   * Autenticación mediante Google Institucional
   */
  public loginWithGoogle(): Observable<AuthResponse> {
    const mockUser: User = {
      id: 'usr-google-202',
      email: 'estudiante.google@universidad.edu',
      fullName: 'Estudiante Institucional',
      role: 'student',
      institution: 'Universidad Institucional Google Workspace',
    };

    const mockResponse: AuthResponse = {
      user: mockUser,
      token: 'jwt-google-auth-token',
    };

    return of(mockResponse).pipe(
      delay(1100),
      tap((response) => {
        this._currentUser.set(response.user);
      })
    );
  }

  /**
   * Cierre de sesión
   */
  public logout(): void {
    this._currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('disceria_user_email');
    }
  }

  private extractNameFromEmail(email: string): string {
    const namePart = email.split('@')[0] || 'Estudiante';
    return namePart
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
