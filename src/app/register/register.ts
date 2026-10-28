import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
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
import { environment } from '../../environments/environment';
import { LottieComponent } from '../shared/components/lottie';
import { fadeInOut, fadeInUp } from '../shared/animations';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces tipadas para Google Identity Services (GIS) — sin `any`
// ─────────────────────────────────────────────────────────────────────────────

/** Respuesta del callback de Google con el JWT firmado */
export interface GoogleCredentialResponse {
  /** JWT firmado que contiene la identidad del usuario */
  credential: string;
  /** Cómo fue seleccionada la cuenta (auto, user, etc.) */
  select_by?: string;
}

/** Payload decodificado del JWT de Google */
export interface GoogleUserPayload {
  iss?: string;
  /** Subject: identificador único del usuario en Google */
  sub?: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  /** Hosted Domain: dominio institucional (ej: universidad.edu.co) */
  hd?: string;
}

/** Notificación del estado del prompt One Tap */
interface GooglePromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  getMomentType(): string;
}

/** Configuración del botón renderizado por Google */
interface GoogleButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  locale?: string;
  width?: number;
}

/** Configuración de inicialización del cliente GIS */
interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
}

/** Namespace tipado del SDK de Google Identity Services */
declare const google: {
  accounts: {
    id: {
      initialize(config: GoogleIdConfig): void;
      prompt(callback?: (n: GooglePromptNotification) => void): void;
      renderButton(element: HTMLElement, config: GoogleButtonConfig): void;
      disableAutoSelect(): void;
    };
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de validación y configuración
// ─────────────────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
/** Mínimo 8 caracteres, al menos una letra y un número */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Client ID de Google Cloud Console, leído desde el archivo de entorno.
 * - DEV:  src/environments/environment.ts       → googleClientId: ''
 * - PROD: src/environments/environment.prod.ts  → valor inyectado por CI/CD
 *
 * Angular reemplaza automáticamente el archivo de entorno al compilar
 * con `ng build --configuration production`.
 */
const GOOGLE_CLIENT_ID = environment.googleClientId;

@Component({
  imports: [ReactiveFormsModule, RouterLink, LottieComponent],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
  animations: [fadeInUp, fadeInOut],
})
export class Register implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  /** Contenedor donde Google renderizará su botón nativo (Signal Query) */
  public readonly googleBtnContainer = viewChild<ElementRef<HTMLDivElement>>('googleBtnContainer');

  // ── Estados reactivos (Signals) ─────────────────────────────────────────
  public readonly isLoading = signal<boolean>(false);
  public readonly isGoogleLoading = signal<boolean>(false);
  /** true cuando el SDK de GIS está inicializado y listo */
  public readonly isGoogleSdkReady = signal<boolean>(false);
  public readonly showPassword = signal<boolean>(false);
  public readonly showConfirmPassword = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
  /** true cuando no hay Client ID real configurado (modo desarrollo/demo) */
  public readonly isSandboxMode = signal<boolean>(GOOGLE_CLIENT_ID.includes('TU_GOOGLE_CLIENT_ID'));

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

  // ── Ciclo de vida ────────────────────────────────────────────────────────

  public ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Inicializa el SDK oficial de Google (el script ya viene en index.html)
    this.initializeGoogleSdk();
  }

  public ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Intentar renderizar el botón nativo de Google si el SDK ya estaba listo
    this.tryRenderGoogleButton();
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
   * Envío y procesamiento del registro reactivo manual
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
      fullName: string; email: string; institution: string;
      role: string; password: string; confirmPassword: string; acceptTerms: boolean;
    };

    // Simulación de llamada al backend — listo para conectar con API real
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(
        `¡Cuenta creada exitosamente para ${fullName}! Redirigiendo al inicio de sesión...`
      );

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          'disceria_registered_user',
          JSON.stringify({ fullName, email: email.toLowerCase(), institution, role })
        );
      }

      setTimeout(() => this.router.navigate(['/login']), 1500);
    }, 1200);
  }

  // ── Google Identity Services ─────────────────────────────────────────────

  /**
   * Punto de entrada del flujo de registro con Google.
   * Prioridades:
   *  1. Prompt One Tap de Google (si Client ID real está configurado).
   *  2. Modo sandbox para desarrollo local (cuando no hay Client ID real).
   */
  public onGoogleRegister(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isGoogleLoading.set(true);

    if (this.isGoogleSdkAvailable()) {
      try {
        google.accounts.id.prompt((notification: GooglePromptNotification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.isGoogleLoading.set(false);
            this.errorMessage.set(
              'El popup de Google fue bloqueado por el navegador. ' +
              'Usa el botón "G" de abajo o habilita los popups para este sitio.'
            );
          }
        });
        return;
      } catch (err) {
        console.warn('[Register] Error al abrir Google One Tap, activando sandbox:', err);
      }
    }

    // Fallback al modo sandbox/desarrollo
    this.runSandboxGoogleLogin();
  }

  /**
   * Inicializa el SDK de Google Identity Services.
   * El script ya viene en index.html; aquí esperamos a que esté disponible.
   */
  private initializeGoogleSdk(): void {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      this.setupGoogleAccountsClient();
      return;
    }

    // Escuchar el evento `load` del script inyectado en index.html
    const scriptEl = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (scriptEl) {
      scriptEl.addEventListener('load', () => this.setupGoogleAccountsClient(), { once: true });
    }
  }

  /**
   * Configura el cliente de Google Identity Services con su callback.
   * Solo se ejecuta si el SDK está disponible y el Client ID es real.
   */
  private setupGoogleAccountsClient(): void {
    if (typeof google === 'undefined' || !google?.accounts?.id) return;

    // En modo sandbox no inicializamos GIS para evitar errores de consola
    if (this.isSandboxMode()) return;

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: GoogleCredentialResponse) => {
          this.handleGoogleCredentialResponse(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signup',
      });

      this.isGoogleSdkReady.set(true);
      // Intentar renderizar el botón nativo tras inicialización
      this.tryRenderGoogleButton();
    } catch (e) {
      console.warn('[Register] Google Identity Client en modo demostración:', e);
    }
  }

  /**
   * Renderiza el botón oficial de Google dentro del contenedor del template.
   * Es más fiable que el prompt en entornos con restricciones de popup.
   */
  private tryRenderGoogleButton(): void {
    const containerEl = this.googleBtnContainer()?.nativeElement;
    if (!this.isGoogleSdkReady() || !containerEl) return;

    try {
      google.accounts.id.renderButton(containerEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        shape: 'rectangular',
        width: containerEl.offsetWidth || 360,
        locale: 'es',
      });
    } catch (e) {
      console.warn('[Register] No se pudo renderizar el botón nativo de Google:', e);
    }
  }

  /** Verifica si el SDK está disponible y el Client ID está configurado */
  private isGoogleSdkAvailable(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      typeof google !== 'undefined' &&
      !!google?.accounts?.id &&
      !this.isSandboxMode()
    );
  }

  /**
   * Manejador de la respuesta con credencial JWT devuelta por Google.
   * Valida el token, decodifica el payload y procesa el registro.
   */
  private handleGoogleCredentialResponse(response: GoogleCredentialResponse): void {
    this.isGoogleLoading.set(true);
    this.errorMessage.set(null);

    if (!response?.credential) {
      this.isGoogleLoading.set(false);
      this.errorMessage.set('No se recibió la credencial de autenticación de Google. Intenta de nuevo.');
      return;
    }

    const payload = this.decodeGoogleJwt(response.credential);
    if (!payload || !payload.email) {
      this.isGoogleLoading.set(false);
      this.errorMessage.set('No se pudo leer la información de tu cuenta Google. Intenta de nuevo.');
      return;
    }

    if (!payload.email_verified) {
      this.isGoogleLoading.set(false);
      this.errorMessage.set('Tu correo de Google no ha sido verificado. Verifica tu cuenta e intenta de nuevo.');
      return;
    }

    this.processGoogleUser(payload, response.credential);
  }

  /**
   * Decodifica de forma segura el JWT firmado por Google.
   * Nota: solo extrae el payload; la verificación de firma la hace el backend.
   */
  private decodeGoogleJwt(token: string): GoogleUserPayload | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as GoogleUserPayload;
    } catch (error) {
      console.error('[Register] Error al decodificar token JWT de Google:', error);
      return null;
    }
  }

  /**
   * Procesa los datos del usuario autenticado por Google:
   *  - Persiste la sesión en localStorage.
   *  - Redirige al dashboard.
   * En producción, aquí se envía el token al backend para crear la sesión.
   */
  private processGoogleUser(payload: GoogleUserPayload, token: string): void {
    const institutionFromDomain = payload.hd
      ? `Universidad (${payload.hd})`
      : 'Institución Universitaria';

    const fullName =
      payload.name ||
      `${payload.given_name ?? ''} ${payload.family_name ?? ''}`.trim() ||
      'Estudiante Google';

    const googleUser = {
      fullName,
      email: payload.email.toLowerCase(),
      avatarUrl: payload.picture ?? null,
      institution: institutionFromDomain,
      role: 'student',
      googleId: payload.sub ?? null,
    };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('disceria_registered_user', JSON.stringify(googleUser));
      // El token se enviaría al backend; aquí solo se almacena para demo
      localStorage.setItem('disceria_auth_token', token);
    }

    this.isGoogleLoading.set(false);
    this.successMessage.set(
      `¡Bienvenido ${fullName}! 🎉 Cuenta vinculada con ${googleUser.email}. Redirigiendo a tu espacio...`
    );

    setTimeout(() => this.router.navigate(['/']), 1800);
  }

  /**
   * Modo sandbox: simula un registro con Google para desarrollo local.
   * Se activa automáticamente cuando GOOGLE_CLIENT_ID no está configurado.
   * Reemplazar GOOGLE_CLIENT_ID con el ID real de Google Cloud Console para producción.
   */
  private runSandboxGoogleLogin(): void {
    setTimeout(() => {
      const mockPayload: GoogleUserPayload = {
        sub: 'sandbox-google-usr-987654321',
        name: 'Estudiante Demo DiscerIA',
        given_name: 'Estudiante',
        family_name: 'Demo',
        email: 'estudiante.demo@universidad.edu.co',
        email_verified: true,
        picture: 'https://ui-avatars.com/api/?name=Estudiante+Demo&background=6366f1&color=fff',
        hd: 'universidad.edu.co',
      };

      this.processGoogleUser(mockPayload, 'sandbox-jwt-no-valido-en-produccion');
    }, 1200);
  }
}
