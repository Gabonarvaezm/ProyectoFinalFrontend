import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LottieComponent } from '../../../shared/components/lottie';
import { fadeInOut, fadeInUp } from '../../../shared/animations';
import {
  AUTH_MESSAGES,
  AUTH_TIMERS,
  VALIDATION_REGEX,
} from '../../../core/constants/auth.constants';
import { LoginCredentials } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LottieComponent],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  animations: [fadeInUp, fadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs desde el componente padre
  public readonly selectedRole = input<'student' | 'professor'>('student');
  public readonly isLoading = input<boolean>(false);
  public readonly errorMessage = input<string | null>(null);
  public readonly successMessage = input<string | null>(null);

  // Outputs hacia el componente padre
  public readonly roleChange = output<'student' | 'professor'>();
  public readonly submitLogin = output<LoginCredentials>();
  public readonly loginSubmitted = output<LoginCredentials>(); // Compatibilidad retroactiva
  public readonly forgotPasswordRequested = output<string>();

  // Estado reactivo local
  public readonly showPassword = signal<boolean>(false);
  public readonly localErrorMessage = signal<string | null>(null);

  // Formulario Reactivo
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

  public get emailControl(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  public get passwordControl(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  public isFieldInvalid(fieldName: 'email' | 'password'): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

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

  public onSelectRole(role: 'student' | 'professor'): void {
    if (this.selectedRole() !== role) {
      this.roleChange.emit(role);
    }
  }

  public togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  public onSubmit(): void {
    this.localErrorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.localErrorMessage.set(AUTH_MESSAGES.FORM_INCOMPLETE);
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;
    const credentials: LoginCredentials = {
      email: (email || '').trim(),
      password: password || '',
      rememberMe: !!rememberMe,
      role: this.selectedRole(),
    };

    this.submitLogin.emit(credentials);
    this.loginSubmitted.emit(credentials);
  }

  public onForgotPassword(event: Event): void {
    event.preventDefault();
    const emailValue = this.emailControl?.value?.trim() || '';
    if (emailValue && !this.emailControl?.hasError('email')) {
      this.forgotPasswordRequested.emit(emailValue);
    } else {
      this.localErrorMessage.set(AUTH_MESSAGES.PASSWORD_RESET_PROMPT);
      this.emailControl?.markAsTouched();
    }
  }
}
