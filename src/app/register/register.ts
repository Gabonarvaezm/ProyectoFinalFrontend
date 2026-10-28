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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Interfaces tipadas para Google Identity Services (GIS) Ã¢â‚¬â€ sin `any`
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/** Respuesta del callback de Google con el JWT firmado */
export interface GoogleCredentialResponse {
  /** JWT firmado que contiene la identidad del usuario */
  credential: string;
  /** CÃƒÂ³mo fue seleccionada la cuenta (auto, user, etc.) */
  select_by?: string;
}

/** Payload decodificado del JWT de Google */
export interface GoogleUserPayload {
  iss?: string;
  /** Subject: identificador ÃƒÂºnico del usuario en Google */
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

/** NotificaciÃƒÂ³n del estado del prompt One Tap */
interface GooglePromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  getMomentType(): string;
}

/** ConfiguraciÃƒÂ³n del botÃƒÂ³n renderizado por Google */
interface GoogleButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  locale?: string;
  width?: number;
}

/** ConfiguraciÃƒÂ³n de inicializaciÃƒÂ³n del cliente GIS */
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Constantes de validaciÃƒÂ³n y configuraciÃƒÂ³n
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
/** MÃƒÂ­nimo 8 caracteres, al menos una letra y un nÃƒÂºmero */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Client ID de Google Cloud Console, leÃƒÂ­do desde el archivo de entorno.
 * - DEV:  src/environments/environment.ts       Ã¢â€ â€™ googleClientId: ''
 * - PROD: src/environments/environment.prod.ts  Ã¢â€ â€™ valor inyectado por CI/CD
 *
 * Angular reemplaza automÃƒÂ¡ticamente el archivo de entorno al compilar
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

  /** Contenedor donde Google renderizarÃ¡ su botÃ³n nativo (Signal Query) */
  public readonly googleBtnContainer = viewChild<ElementRef<HTMLDivElement>>('googleBtnContainer');

  // Ã¢â€â‚¬Ã¢â€â‚¬ Estados reactivos (Signals) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  public readonly isLoading = signal<boolean>(false);
  public readonly isGoogleLoading = signal<boolean>(false);
  /** true cuando el SDK de GIS estÃƒÂ¡ inicializado y listo */
  public readonly isGoogleSdkReady = signal<boolean>(false);
  public readonly showPassword = signal<boolean>(false);
  public readonly showConfirmPassword = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
  /** true cuando no hay Client ID real configurado (modo desarrollo/demo) */
  public readonly isSandboxMode = signal<boolean>(GOOGLE_CLIENT_ID.includes('TU_GOOGLE_CLIENT_ID'));

  // Validador personalizado para confirmaciÃƒÂ³n de contraseÃƒÂ±as
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Formulario Reactivo tipado Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

  // ConexiÃƒÂ³n reactiva de valueChanges a Signal
  private readonly passwordSignal = toSignal(
    this.registerForm.get('password')!.valueChanges,
    { initialValue: '' }
  );

  // Computed Signal para calcular la fortaleza de la contraseÃƒÂ±a
  public readonly passwordStrength = computed(() => {
    const pwd = this.passwordSignal() || '';
    if (!pwd) return { level: 0, text: 'No ingresada', colorClass: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, text: 'DÃƒÂ©bil', colorClass: 'weak' };
    if (score <= 3) return { level: 2, text: 'Media', colorClass: 'medium' };
    return { level: 3, text: 'Fuerte', colorClass: 'strong' };
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Ciclo de vida Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  public ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Inicializa el SDK oficial de Google (el script ya viene en index.html)
    this.initializeGoogleSdk();
  }

  public ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Intentar renderizar el botÃƒÂ³n nativo de Google si el SDK ya estaba listo
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
   * Determina si un campo es invÃƒÂ¡lido y fue tocado
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
          return 'La universidad o instituciÃƒÂ³n es requerida';
        case 'password':
          return 'La contraseÃƒÂ±a es requerida';
        case 'confirmPassword':
          return 'Debes confirmar tu contraseÃƒÂ±a';
        case 'acceptTerms':
          return 'Debes aceptar los tÃƒÂ©rminos y condiciones';
        default:
          return 'Campo obligatorio';
      }
    }

    if (control.hasError('minlength')) {
      const min = control.getError('minlength')?.requiredLength;
      return `MÃƒÂ­nimo ${min} caracteres`;
    }

    if (control.hasError('pattern')) {
      if (fieldName === 'fullName') {
        return 'Ingresa solo letras y espacios vÃƒÂ¡lidos';
      }
      if (fieldName === 'email') {
        return 'Ingresa un formato de correo vÃƒÂ¡lido (ej: usuario@universidad.edu)';
      }
      if (fieldName === 'password') {
        return 'Debe incluir al menos 8 caracteres, combinando letras y nÃƒÂºmeros';
      }
    }

    if (control.hasError('email')) {
      return 'Formato de correo electrÃƒÂ³nico invÃƒÂ¡lido';
    }

    if (control.hasError('passwordMismatch')) {
      return 'Las contraseÃƒÂ±as no coinciden';
    }

    return 'Dato invÃƒÂ¡lido';
  }

  /**
   * Alterna visibilidad de contraseÃƒÂ±a
   */
  public togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  /**
   * Alterna visibilidad de confirmar contraseÃƒÂ±a
   */
  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  /**
   * EnvÃƒÂ­o y procesamiento del registro reactivo manual
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

    // SimulaciÃƒÂ³n de llamada al backend Ã¢â‚¬â€ listo para conectar con API real
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(
        `Ã‚Â¡Cuenta creada exitosamente para ${fullName}! Redirigiendo al inicio de sesiÃƒÂ³n...`
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Google Identity Services Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  /**
   * Punto de entrada del flujo de registro con Google.
   * Prioridades:
   *  1. Prompt One Tap de Google (si Client ID real estÃƒÂ¡ configurado).
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
              'Usa el botÃƒÂ³n "G" de abajo o habilita los popups para este sitio.'
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
   * El script ya viene en index.html; aquÃƒÂ­ esperamos a que estÃƒÂ© disponible.
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
   * Solo se ejecuta si el SDK estÃƒÂ¡ disponible y el Client ID es real.
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
      // Intentar renderizar el botÃƒÂ³n nativo tras inicializaciÃƒÂ³n
      this.tryRenderGoogleButton();
    } catch (e) {
      console.warn('[Register] Google Identity Client en modo demostraciÃƒÂ³n:', e);
    }
  }

  /**
   * Renderiza el botÃƒÂ³n oficial de Google dentro del contenedor del template.
   * Es mÃƒÂ¡s fiable que el prompt en entornos con restricciones de popup.
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
      console.warn('[Register] No se pudo renderizar el botÃ³n nativo de Google:', e);
    }
  }

  /** Verifica si el SDK estÃƒÂ¡ disponible y el Client ID estÃƒÂ¡ configurado */
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
      this.errorMessage.set('No se recibiÃƒÂ³ la credencial de autenticaciÃƒÂ³n de Google. Intenta de nuevo.');
      return;
    }

    const payload = this.decodeGoogleJwt(response.credential);
    if (!payload || !payload.email) {
      this.isGoogleLoading.set(false);
      this.errorMessage.set('No se pudo leer la informaciÃƒÂ³n de tu cuenta Google. Intenta de nuevo.');
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
   * Nota: solo extrae el payload; la verificaciÃƒÂ³n de firma la hace el backend.
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
   *  - Persiste la sesiÃƒÂ³n en localStorage.
   *  - Redirige al dashboard.
   * En producciÃƒÂ³n, aquÃƒÂ­ se envÃƒÂ­a el token al backend para crear la sesiÃƒÂ³n.
   */
  private processGoogleUser(payload: GoogleUserPayload, token: string): void {
    const institutionFromDomain = payload.hd
      ? `Universidad (${payload.hd})`
      : 'InstituciÃƒÂ³n Universitaria';

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
      // El token se enviarÃƒÂ­a al backend; aquÃƒÂ­ solo se almacena para demo
      localStorage.setItem('disceria_auth_token', token);
    }

    this.isGoogleLoading.set(false);
    this.successMessage.set(
      `Ã‚Â¡Bienvenido ${fullName}! Ã°Å¸Å½â€° Cuenta vinculada con ${googleUser.email}. Redirigiendo a tu espacio...`
    );

    setTimeout(() => this.router.navigate(['/']), 1800);
  }

  /**
   * Modo sandbox: simula un registro con Google para desarrollo local.
   * Se activa automÃƒÂ¡ticamente cuando GOOGLE_CLIENT_ID no estÃƒÂ¡ configurado.
   * Reemplazar GOOGLE_CLIENT_ID con el ID real de Google Cloud Console para producciÃƒÂ³n.
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
