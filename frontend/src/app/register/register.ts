import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { STORAGE_KEYS } from '../core/models/auth.model';
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
  private readonly platformId = inject(PLATFORM_ID);
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

    const submitTimer = setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(
        `¡Cuenta creada exitosamente para ${payload.fullName}! Redirigiendo al inicio de sesión...`
      );

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          STORAGE_KEYS.REGISTERED_USER,
          JSON.stringify({
            fullName: payload.fullName,
            email: payload.email.toLowerCase(),
            institution: payload.institution,
            role: payload.role,
          })
        );
      }

      const navTimer = setTimeout(
        () => this.router.navigate([AUTH_ROUTES.LOGIN]),
        AUTH_TIMERS.REGISTER_REDIRECT_DELAY_MS
      );
      this.timerIds.push(navTimer);
    }, AUTH_TIMERS.REGISTER_SIMULATION_MS);

    this.timerIds.push(submitTimer);
  }
}
