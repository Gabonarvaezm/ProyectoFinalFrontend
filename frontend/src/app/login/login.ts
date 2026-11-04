import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LottieComponent } from '../shared/components/lottie';
import { fadeInOut, fadeInUp } from '../shared/animations';
import { AuthService } from '../core/services/auth.service';
import {
  AUTH_MESSAGES,
  AUTH_ROUTES,
  AUTH_TIMERS,
  VALIDATION_REGEX,
} from '../core/constants/auth.constants';

@Component({
  imports: [ReactiveFormsModule, RouterLink, LottieComponent],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
  animations: [fadeInUp, fadeInOut],
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Identificador de timeout activo para cancelación defensiva */
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Estados reactivos con Signals
  public readonly isLoading = signal<boolean>(false);
  public readonly showPassword = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);

  // Formulario Reactivo tipado
  public readonly loginForm: FormGroup = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(VALIDATION_REGEX.EMAIL),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(AUTH_TIMERS.PASSWORD_MIN_LENGTH),
      ],
    ],
    rememberMe: [false],
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.redirectTimeoutId) {
        clearTimeout(this.redirectTimeoutId);
      }
    });
  }

  // Getters para acceso limpio a controles
  public get emailControl(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  public get passwordControl(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  /**
   * Determina si un campo específico debe mostrar feedback de error visual
   */
  public isFieldInvalid(fieldName: 'email' | 'password'): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Retorna el mensaje de validación correspondiente al error activo
   */
  public getFieldError(fieldName: 'email' | 'password'): string {
    const control = this.loginForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      return fieldName === 'email'
        ? AUTH_MESSAGES.REQUIRED_EMAIL
        : AUTH_MESSAGES.REQUIRED_PASSWORD;
    }

    if (control.hasError('email') || control.hasError('pattern')) {
      return AUTH_MESSAGES.INVALID_EMAIL_FORMAT;
    }

    if (control.hasError('minlength')) {
      const minLength =
        control.getError('minlength')?.requiredLength ??
        AUTH_TIMERS.PASSWORD_MIN_LENGTH;
      return AUTH_MESSAGES.INVALID_PASSWORD_MIN_LENGTH(minLength);
    }

    return 'Dato inválido';
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  public togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  /**
   * Procesamiento y validación del formulario de inicio de sesión.
   */
  public onSubmit(): void {
    this.resetStateMessages();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set(AUTH_MESSAGES.FORM_INCOMPLETE);
      return;
    }

    this.isLoading.set(true);
    const { email, password, rememberMe } = this.loginForm.value;
    const registeredRole = this.authService.getRegisteredUserRole(email);

    this.authService
      .login({ email, password, rememberMe })
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
   * Recuperación de contraseña
   */
  public onForgotPassword(event: Event): void {
    event.preventDefault();
    const emailValue = this.emailControl?.value;
    if (emailValue && !this.emailControl?.hasError('email')) {
      this.successMessage.set(AUTH_MESSAGES.PASSWORD_RESET_SENT(emailValue));
    } else {
      this.errorMessage.set(AUTH_MESSAGES.PASSWORD_RESET_PROMPT);
      this.emailControl?.markAsTouched();
    }
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
