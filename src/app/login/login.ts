import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Estados reactivos con Signals
  public readonly isLoading = signal<boolean>(false);
  public readonly isGoogleLoading = signal<boolean>(false);
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
   * Procesamiento y validación del formulario de inicio de sesión
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

    // Simulación de procesamiento de login (listo para conectar con backend/API)
    setTimeout(() => {
      // Simulación de validación institucional
      const isInstitutional = email.toLowerCase().includes('uni') || 
                              email.toLowerCase().includes('edu') || 
                              email.toLowerCase().includes('@');

      if (isInstitutional && password.length >= 6) {
        this.isLoading.set(false);
        this.successMessage.set('¡Acceso concedido! Redirigiendo a tu espacio de estudio...');
        
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('disceria_remembered_email', email);
        }

        // Redirección hacia la vista principal
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1200);
      } else {
        this.isLoading.set(false);
        this.errorMessage.set('Credenciales no válidas o usuario no registrado.');
      }
    }, 1000);
  }

  /**
   * Manejador de inicio de sesión institucional con Google
   */
  public onGoogleLogin(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isGoogleLoading.set(true);

    setTimeout(() => {
      this.isGoogleLoading.set(false);
      this.successMessage.set('Autenticado con Google Institucional. Redirigiendo...');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }, 1200);
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
   * Solicitud de acceso / Registro
   */
  public onRequestAccess(event: Event): void {
    event.preventDefault();
    this.successMessage.set('Solicitud recibida. Tu institución educativa validará tu acceso.');
  }
}
