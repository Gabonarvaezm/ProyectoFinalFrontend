import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
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
import { LottieComponent } from '../shared/components/lottie';
import { fadeInOut, fadeInUp } from '../shared/animations';
import { STORAGE_KEYS } from '../core/models/auth.model';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de validación
// ─────────────────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
/** Mínimo 8 caracteres, al menos una letra y un número */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

@Component({
  imports: [ReactiveFormsModule, RouterLink, LottieComponent],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
  animations: [fadeInUp, fadeInOut],
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Estados reactivos (Signals) ─────────────────────────────────────────
  public readonly isLoading = signal<boolean>(false);
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

  // ── Formulario Reactivo tipado ───────────────────────────────────────────
  public readonly registerForm: FormGroup = this.fb.group(
    {
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(FULL_NAME_REGEX),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(EMAIL_REGEX),
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
          Validators.pattern(PASSWORD_REGEX),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: this.passwordMatchValidator }
  );

  // Conexión reactiva de valueChanges a Signal
  private readonly passwordSignal = toSignal(
    this.registerForm.controls['password'].valueChanges,
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

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
    });
  }

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
   * Envío y procesamiento del registro reactivo.
   * Persiste los datos del usuario registrado en localStorage
   * y redirige al login para que inicie sesión.
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
    const { fullName, email, institution, role } = this.registerForm.value as {
      fullName: string;
      email: string;
      institution: string;
      role: 'student' | 'professor' | 'admin';
    };

    // Simulación de llamada al backend — listo para conectar con API real
    const submitTimer = setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(
        `¡Cuenta creada exitosamente para ${fullName}! Redirigiendo al inicio de sesión...`
      );

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          STORAGE_KEYS.REGISTERED_USER,
          JSON.stringify({ fullName, email: email.toLowerCase(), institution, role })
        );
      }

      const navTimer = setTimeout(() => this.router.navigate(['/login']), 1500);
      this.timerIds.push(navTimer);
    }, 1200);

    this.timerIds.push(submitTimer);
  }
}
