import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/services/auth.service';
import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AUTH_ROUTES,
  AUTH_TIMERS,
} from '../core/constants/auth.constants';
import {
  RegisterFormComponent,
  RegisterFormPayload,
  RegisterHeroComponent,
} from './components';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RegisterHeroComponent, RegisterFormComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // Estados reactivos globales
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
      this.timerIds = [];
    });
  }

  /**
   * Procesa la solicitud de registro emitida por RegisterFormComponent
   */
  public handleRegister(payload: RegisterFormPayload): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isLoading.set(true);

    this.authService.register(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set(`¡Cuenta creada exitosamente para ${payload.fullName}! Redirigiendo al inicio de sesión...`);
        const timer = setTimeout(() => this.router.navigate([AUTH_ROUTES.LOGIN]), AUTH_TIMERS.REGISTER_REDIRECT_DELAY_MS);
        this.timerIds.push(timer);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }
}
