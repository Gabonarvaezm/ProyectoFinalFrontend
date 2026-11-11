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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginHeroComponent, LoginFormComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Identificador de timeout activo para cancelación defensiva */
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Estados reactivos globales de la vista
  public readonly isLoading = signal<boolean>(false);
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
   * Procesa las credenciales emitidas por el componente hijo LoginFormComponent
   */
  public handleLogin(credentials: LoginCredentials): void {
    this.resetStateMessages();
    this.isLoading.set(true);

    const registeredRole = this.authService.getRegisteredUserRole(credentials.email);

    this.authService
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          const role = registeredRole ?? response.user.role;
          const targetRoute = this.resolveTargetRoute(role);
          const successText = this.resolveSuccessMessage(role);

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

  private resolveTargetRoute(role: string): string {
    if (role === 'professor') return AUTH_ROUTES.PROFESSOR;
    if (role === 'student') return AUTH_ROUTES.STUDENT;
    return AUTH_ROUTES.HOME;
  }

  private resolveSuccessMessage(role: string): string {
    if (role === 'professor') return AUTH_MESSAGES.LOGIN_SUCCESS_PROFESSOR;
    if (role === 'student') return AUTH_MESSAGES.LOGIN_SUCCESS_STUDENT;
    return AUTH_MESSAGES.LOGIN_SUCCESS_DEFAULT;
  }
}
