import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
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
  private readonly platformId = inject(PLATFORM_ID);

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
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
      ],
    ],
    rememberMe: [false],
  });

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
        ? 'El correo electrónico es requerido'
        : 'La contraseña es requerida';
    }

    if (control.hasError('email') || control.hasError('pattern')) {
      return 'Ingresa un correo válido (ej: estudiante@universidad.edu)';
    }

    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength')?.requiredLength ?? 6;
      return `La contraseña debe contener al menos ${minLength} caracteres`;
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
   * Usa AuthService para autenticar y redirige según el rol del usuario:
   *  - Profesor → /profesor (dashboard del profesor)
   *  - Estudiante → /estudiante (dashboard del estudiante)
   *  - Otros roles → / (página principal)
   */
  public onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Por favor, completa correctamente los campos obligatorios.');
      return;
    }

    this.isLoading.set(true);
    const { email, password, rememberMe } = this.loginForm.value;

    // Buscar datos del usuario registrado en localStorage
    const registeredRole = this.getRegisteredUserRole(email);

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Determinar la ruta de destino y mensaje de feedback según el rol
        const role = registeredRole ?? response.user.role;
        const targetRoute =
          role === 'professor' ? '/profesor' : role === 'student' ? '/estudiante' : '/';

        const successText =
          role === 'professor'
            ? '¡Acceso concedido! Redirigiendo a tu panel docente...'
            : '¡Acceso concedido! Redirigiendo a tu espacio de estudio...';

        this.successMessage.set(successText);

        setTimeout(() => {
          this.router.navigate([targetRoute]);
        }, 1200);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Credenciales no válidas o usuario no registrado.');
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
      this.successMessage.set(`Se ha enviado un enlace de recuperación a ${emailValue}`);
    } else {
      this.errorMessage.set('Ingresa tu correo en el formulario para solicitar la recuperación.');
      this.emailControl?.markAsTouched();
    }
  }

  /**
   * Obtiene el rol del usuario registrado desde localStorage.
   * Esto permite que cuando un usuario se registra (profesor o estudiante) y luego inicia sesión,
   * se redirija correctamente a su dashboard correspondiente.
   */
  private getRegisteredUserRole(email: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const stored = localStorage.getItem('disceria_registered_user');
      if (!stored) return null;

      const userData = JSON.parse(stored) as { email: string; role: string };
      if (userData.email === email.toLowerCase()) {
        return userData.role;
      }
    } catch {
      // Si hay error al parsear, se ignora silenciosamente
    }

    return null;
  }
}
