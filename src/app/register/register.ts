import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Estados reactivos con Signals
  public readonly isLoading = signal<boolean>(false);
  public readonly isGoogleLoading = signal<boolean>(false);
  public readonly showPassword = signal<boolean>(false);
  public readonly showConfirmPassword = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);

  // Validador personalizado para confirmación de contraseñas
  private readonly passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
      return null;
    }
  };

  // Formulario Reactivo tipado
  public readonly registerForm: FormGroup = this.fb.group(
    {
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        ],
      ],
      institution: [
        '',
        [Validators.required, Validators.minLength(3)],
      ],
      role: ['student', [Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: this.passwordMatchValidator }
  );

  // Conexión reactiva de valueChanges a Signal
  private readonly passwordSignal = toSignal(
    this.registerForm.get('password')!.valueChanges,
    { initialValue: '' }
  );

  // Computed Signal para calcular la fortaleza de la contraseña
  public readonly passwordStrength = computed(() => {
    const pwd = this.passwordSignal() || '';
    if (!pwd) return { level: 0, text: 'No ingresada', colorClass: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, text: 'Débil', colorClass: 'weak' };
    if (score <= 3) return { level: 2, text: 'Media', colorClass: 'medium' };
    return { level: 3, text: 'Fuerte', colorClass: 'strong' };
  });

  // Getters para controles
  public get fullNameControl(): AbstractControl | null {
    return this.registerForm.get('fullName');
  }

  public get emailControl(): AbstractControl | null {
    return this.registerForm.get('email');
  }

  public get institutionControl(): AbstractControl | null {
    return this.registerForm.get('institution');
  }

  public get passwordControl(): AbstractControl | null {
    return this.registerForm.get('password');
  }

  public get confirmPasswordControl(): AbstractControl | null {
    return this.registerForm.get('confirmPassword');
  }

  public get acceptTermsControl(): AbstractControl | null {
    return this.registerForm.get('acceptTerms');
  }

  /**
   * Determina si un campo es inválido y fue tocado
   */
  public isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Obtiene el mensaje de error contextual para cada campo
   */
  public getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.hasError('required') || control.hasError('requiredTrue')) {
      switch (fieldName) {
        case 'fullName':
          return 'El nombre completo es requerido';
        case 'email':
          return 'El correo institucional es requerido';
        case 'institution':
          return 'La universidad o institución es requerida';
        case 'password':
          return 'La contraseña es requerida';
        case 'confirmPassword':
          return 'Debes confirmar tu contraseña';
        case 'acceptTerms':
          return 'Debes aceptar los términos y condiciones';
        default:
          return 'Campo obligatorio';
      }
    }

    if (control.hasError('minlength')) {
      const min = control.getError('minlength')?.requiredLength;
      return `Mínimo ${min} caracteres`;
    }

    if (control.hasError('pattern')) {
      if (fieldName === 'fullName') {
        return 'Ingresa solo letras y espacios válidos';
      }
      if (fieldName === 'email') {
        return 'Ingresa un formato de correo válido (ej: usuario@universidad.edu)';
      }
      if (fieldName === 'password') {
        return 'Debe incluir al menos 8 caracteres, combinando letras y números';
      }
    }

    if (control.hasError('email')) {
      return 'Formato de correo electrónico inválido';
    }

    if (control.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    return 'Dato inválido';
  }

  /**
   * Alterna visibilidad de contraseña
   */
  public togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  /**
   * Alterna visibilidad de confirmar contraseña
   */
  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /**
   * Envío y procesamiento del registro reactivo
   */
  public onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage.set('Por favor, completa correctamente todos los campos obligatorios.');
      return;
    }

    this.isLoading.set(true);
    const formValue = this.registerForm.value;

    // Simulación de registro en la plataforma DiscerIA
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(
        `¡Cuenta creada exitosamente para ${formValue.fullName}! Redirigiendo al inicio de sesión...`
      );

      // Guardado local simulado
      if (typeof window !== 'undefined') {
        const newUser = {
          fullName: formValue.fullName,
          email: formValue.email.toLowerCase(),
          institution: formValue.institution,
          role: formValue.role,
        };
        localStorage.setItem('disceria_registered_user', JSON.stringify(newUser));
      }

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
    }, 1200);
  }

  /**
   * Servicio y registro con Google Institucional
   */
  public onGoogleRegister(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isGoogleLoading.set(true);

    setTimeout(() => {
      this.isGoogleLoading.set(false);
      this.successMessage.set(
        '¡Registro institucional con Google completado con éxito! Redirigiendo a tu espacio de estudio...'
      );

      if (typeof window !== 'undefined') {
        const googleUser = {
          fullName: 'Estudiante Google Institucional',
          email: 'estudiante.nuevo@universidad.edu',
          institution: 'Universidad Google Workspace',
          role: 'student',
        };
        localStorage.setItem('disceria_registered_user', JSON.stringify(googleUser));
      }

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1400);
    }, 1300);
  }
}
