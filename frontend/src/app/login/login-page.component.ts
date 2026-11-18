import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import {
  AUTH_MESSAGES,
  AUTH_ROUTES,
  AUTH_TIMERS,
} from '../core/constants/auth.constants';
import { LoginCredentials } from '../core/models/auth.model';
import { LoginHeroComponent, LoginFormComponent } from './components';

/**
 * Componente Padre Orquestador: LoginPageComponent
 * Centraliza la lógica de autenticación, el estado reactivo del rol seleccionado ('student' | 'professor'),
 * los mensajes de éxito/error y la redirección basada en roles hacia los dashboards respectivos.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginHeroComponent, LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Identificador de timeout activo para cancelación defensiva */
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Estados reactivos globales de la vista
  public readonly currentRole = signal<'student' | 'professor'>('student');
  public readonly isLoading = signal<boolean>(false);
  public readonly loading = this.isLoading; // Alias para compatibilidad
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.redirectTimeoutId) {
        clearTimeout(this.redirectTimeoutId);
      }
    });
  }

  /**
   * Actualiza el rol actual emitido por el componente hijo
   */
  public onRoleChange(role: 'student' | 'professor'): void {
    this.currentRole.set(role);
    this.resetStateMessages();
  }

  /**
   * Procesa las credenciales emitidas por el componente hijo LoginFormComponent
   */
  public handleLogin(credentials: LoginCredentials): void {
    this.resetStateMessages();
    this.isLoading.set(true);

    const roleToUse = credentials.role ?? this.currentRole();
    const payload: LoginCredentials = {
      ...credentials,
      role: roleToUse,
    };



    this.authService
      .login(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          const effectiveRole = response.user.role;
          const targetRoute = this.resolveTargetRoute(effectiveRole);
          const successText = this.resolveSuccessMessage(effectiveRole);

          this.successMessage.set(successText);
          this.redirectTimeoutId = setTimeout(() => {
            this.router.navigate([targetRoute]);
          }, AUTH_TIMERS.LOGIN_REDIRECT_DELAY_MS);
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || AUTH_MESSAGES.LOGIN_FAILED);
        },
      });
  }

  /**
   * Atiende solicitud de recuperación de contraseña emitida por el formulario
   */
  public handleForgotPassword(email: string): void {
    this.resetStateMessages();
    this.successMessage.set(AUTH_MESSAGES.PASSWORD_RESET_SENT(email));
  }

  private resetStateMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  public resolveTargetRoute(role: string): string {
    if (role === 'professor') return AUTH_ROUTES.PROFESSOR_DASHBOARD;
    if (role === 'student') return AUTH_ROUTES.STUDENT_DASHBOARD;
    return AUTH_ROUTES.HOME;
  }

  private resolveSuccessMessage(role: string): string {
    if (role === 'professor') return AUTH_MESSAGES.LOGIN_SUCCESS_PROFESSOR;
    if (role === 'student') return AUTH_MESSAGES.LOGIN_SUCCESS_STUDENT;
    return AUTH_MESSAGES.LOGIN_SUCCESS_DEFAULT;
  }
}

