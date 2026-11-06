import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ThemeService, AppTheme } from '../core/services/theme.service';
import { User } from '../core/models/auth.model';
import {
  AiTone,
  ConfigSection,
  ConfigSectionId,
  FontSizePreference,
  UserPreferences,
} from './models/configuracion.model';
import {
  ConfiguracionAparienciaComponent,
  ConfiguracionCuentaComponent,
  ConfiguracionHeaderComponent,
  ConfiguracionIaComponent,
  ConfiguracionLogoutModalComponent,
  ConfiguracionNotificacionesComponent,
  ConfiguracionTabsComponent,
} from './components';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfiguracionHeaderComponent,
    ConfiguracionTabsComponent,
    ConfiguracionCuentaComponent,
    ConfiguracionAparienciaComponent,
    ConfiguracionIaComponent,
    ConfiguracionNotificacionesComponent,
    ConfiguracionLogoutModalComponent,
  ],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // Inputs & Outputs (Patrón Smart/Dumb con Signals)
  public readonly user = input<User | null>(null);
  public readonly isEmbedded = input<boolean>(false);

  public readonly logoutRequested = output<void>();
  public readonly preferencesSaved = output<UserPreferences>();
  public readonly themeChanged = output<AppTheme>();

  // Pestaña Activa de Configuración
  public readonly activeSection = signal<ConfigSectionId>('cuenta');

  public readonly sections: ConfigSection[] = [
    {
      id: 'cuenta',
      label: 'Cuenta y Sesión',
      icon: 'bi bi-person-badge',
      description: 'Gestión de credenciales, perfil institucional y sesión activa.',
    },
    {
      id: 'apariencia',
      label: 'Tema y Apariencia',
      icon: 'bi bi-palette-fill',
      description: 'Alterna entre Modo Claro y Oscuro y personaliza la visualización.',
    },
    {
      id: 'ia',
      label: 'Asistente IA',
      icon: 'bi bi-robot',
      description: 'Ajusta el estilo de respuesta, tono y recomendaciones automáticas.',
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: 'bi bi-bell-fill',
      description: 'Gestiona alertas de exámenes, avisos de foros y resúmenes.',
    },
  ];

  // Estado del Tema Actual desde ThemeService
  public readonly currentTheme = this.themeService.currentTheme;
  public readonly isDarkMode = this.themeService.isDarkMode;

  // Confirmación de Logout Modal
  public readonly isLogoutConfirmOpen = signal<boolean>(false);

  // Toast Feedback
  public readonly toastFeedback = signal<string | null>(null);

  // Usuario Efectivo
  public readonly effectiveUser = computed<User>(() => {
    const inputUser = this.user();
    if (inputUser) return inputUser;

    const authUser = this.authService.currentUser();
    if (authUser) return authUser;

    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem('disceria_registered_user');
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<User>;
          return {
            id: parsed.id ?? 'usr-local',
            email: parsed.email ?? 'usuario@disceria.edu',
            fullName: parsed.fullName ?? 'Usuario DiscerIA',
            role: parsed.role ?? 'student',
            institution: parsed.institution ?? 'Universidad Tecnológica',
          };
        }
      } catch {
        // Ignorar
      }
    }

    return {
      id: 'usr-default',
      email: 'estudiante@disceria.edu',
      fullName: 'Alejandro Morales',
      role: 'student',
      institution: 'Universidad Tecnológica Nacional',
    };
  });

  public readonly userInitials = computed<string>(() => {
    const name = this.effectiveUser().fullName || 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  // Formulario Reactivo de Preferencias
  public readonly preferencesForm: FormGroup = this.fb.group({
    theme: [this.themeService.currentTheme(), [Validators.required]],
    emailNotifications: [true],
    forumReplyNotifications: [true],
    examAlerts: [true],
    weeklyAiSummary: [false],
    aiTone: ['detailed' as AiTone, [Validators.required]],
    aiAutoSuggestions: [true],
    fontSize: ['base' as FontSizePreference, [Validators.required]],
    reduceMotion: [false],
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((t) => clearTimeout(t));
    });
  }

  public selectSection(id: ConfigSectionId): void {
    this.activeSection.set(id);
  }

  public selectTheme(theme: AppTheme): void {
    this.preferencesForm.patchValue({ theme });
    this.themeService.setTheme(theme);
    this.themeChanged.emit(theme);
    this.showToast(
      theme === 'dark' ? 'Modo Oscuro activado.' : 'Modo Claro activado.'
    );
  }

  public toggleTheme(): void {
    const newTheme = this.themeService.toggleTheme();
    this.preferencesForm.patchValue({ theme: newTheme });
    this.themeChanged.emit(newTheme);
    this.showToast(
      newTheme === 'dark' ? 'Modo Oscuro activado.' : 'Modo Claro activado.'
    );
  }

  public promptLogout(): void {
    this.isLogoutConfirmOpen.set(true);
  }

  public cancelLogout(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  public confirmLogout(): void {
    this.isLogoutConfirmOpen.set(false);
    this.logoutRequested.emit();
  }

  public savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      this.showToast('Por favor verifica los campos con error.');
      return;
    }

    const value = this.preferencesForm.value as UserPreferences;
    this.preferencesSaved.emit(value);
    this.showToast('Preferencias guardadas exitosamente.');
  }

  private showToast(message: string): void {
    this.toastFeedback.set(message);
    const timer = setTimeout(() => {
      this.toastFeedback.set(null);
    }, 3000);
    this.timerIds.push(timer);
  }
}
