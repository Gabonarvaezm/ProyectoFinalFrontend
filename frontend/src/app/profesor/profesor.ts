import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ProfesorService } from '../core/services/profesor.service';
import {
  AiSuggestion,
  ChatMessage,
  CreateStudentDto,
  KpiMetric,
  NavItem,
  QuickAction,
  RecentActivity,
  StudentProgress,
  StudentStatus,
  TeacherNotification,
} from './models/profesor.model';
import { Biblioteca } from '../biblioteca/biblioteca';
import { Book } from '../biblioteca/models/book.model';
import { ConfiguracionComponent } from '../configuracion/configuracion';
import {
  ProfesorActivityFeedComponent,
  ProfesorAiChatComponent,
  ProfesorCreateStudentModalComponent,
  ProfesorHeaderComponent,
  ProfesorKpiCardsComponent,
  ProfesorNotificationsDrawerComponent,
  ProfesorSidebarComponent,
  ProfesorStudentTableComponent,
} from './components';

@Component({
  imports: [
    Biblioteca,
    ConfiguracionComponent,
    ProfesorSidebarComponent,
    ProfesorHeaderComponent,
    ProfesorKpiCardsComponent,
    ProfesorStudentTableComponent,
    ProfesorActivityFeedComponent,
    ProfesorAiChatComponent,
    ProfesorCreateStudentModalComponent,
    ProfesorNotificationsDrawerComponent,
  ],
  selector: 'app-profesor',
  styleUrls: ['./profesor.scss'],
  templateUrl: './profesor.html',
})
export class Profesor {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profesorService = inject(ProfesorService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  public readonly currentUser = this.authService.currentUser;

  // ── Navegación Lateral ───────────────────────────────────────────────────
  public readonly activeNav = signal<string>('dashboard');

  public readonly navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill' },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text' },
    { id: 'progreso', label: 'Progreso', icon: 'bi bi-bar-chart' },
    { id: 'configuracion', label: 'Configuración', icon: 'bi bi-gear' },
  ]);

  // ── Panel Desplegable (Drawer) Asistente IA ─────────────────────────────
  public readonly isAiDrawerOpen = signal<boolean>(false);

  public toggleAiDrawer(): void {
    const next = !this.isAiDrawerOpen();
    if (next) {
      this.isNotificationsDrawerOpen.set(false); // Cierra notificaciones para evitar superposición
    }
    this.isAiDrawerOpen.set(next);
  }

  public closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }

  public openAiDrawer(): void {
    this.isNotificationsDrawerOpen.set(false);
    this.isAiDrawerOpen.set(true);
  }

  // ── Panel Desplegable (Drawer) Notificaciones Académicas ─────────────────
  public readonly isNotificationsDrawerOpen = signal<boolean>(false);

  public readonly notifications = this.profesorService.notifications;
  public readonly unreadNotificationsCount = this.profesorService.unreadNotificationsCount;

  public toggleNotificationsDrawer(): void {
    const next = !this.isNotificationsDrawerOpen();
    if (next) {
      this.isAiDrawerOpen.set(false); // Cierra asistente IA para evitar superposición
    }
    this.isNotificationsDrawerOpen.set(next);
  }

  public closeNotificationsDrawer(): void {
    this.isNotificationsDrawerOpen.set(false);
  }

  public openNotificationsDrawer(): void {
    this.isAiDrawerOpen.set(false);
    this.isNotificationsDrawerOpen.set(true);
  }

  // ── Estado Compartido desde ProfesorService ──────────────────────────────
  public readonly students = this.profesorService.students;
  public readonly kpiMetrics = this.profesorService.kpiMetrics;
  public readonly recentActivities = this.profesorService.recentActivities;

  // ── Búsqueda Global ──────────────────────────────────────────────────────
  public readonly searchQuery = signal<string>('');

  /** Estudiantes filtrados en tiempo real por el buscador */
  public readonly filteredStudents = computed<StudentProgress[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.students();
    if (!query) return all;

    return all.filter(
      (s) =>
        s.studentName.toLowerCase().includes(query) ||
        s.topic.toLowerCase().includes(query) ||
        s.statusLabel.toLowerCase().includes(query) ||
        (s.email && s.email.toLowerCase().includes(query))
    );
  });

  // ── Acciones Rápidas ─────────────────────────────────────────────────────
  public readonly quickActions = signal<QuickAction[]>([
    { id: 'register-student', label: 'Registrar Estudiante', icon: 'bi bi-person-plus-fill', primary: true },
    { id: 'message-class', label: 'Enviar Mensaje a la Clase', icon: 'bi bi-chat-square-text' },
    { id: 'create-exam', label: 'Crear Examen', icon: 'bi bi-file-earmark-plus' },
  ]);

  // ── Modal de Registro y Creación de Estudiante ───────────────────────────
  public readonly isRegisterModalOpen = signal<boolean>(false);
  public readonly isSubmittingStudent = signal<boolean>(false);

  public readonly studentForm: FormGroup = this.fb.group({
    studentName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['Biología: Mitosis', [Validators.required, Validators.minLength(3)]],
    score: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
    status: ['active' as StudentStatus, [Validators.required]],
  });

  // ── Asistente de IA (Chat & Sugerencias Dinámicas) ────────────────────────
  public readonly aiSuggestions = signal<AiSuggestion[]>([
    {
      id: 'grading',
      label: 'Ayuda con calificaciones',
      icon: 'bi bi-text-left',
      prompt: '¿Cuál es el promedio general y cómo evaluar la cohorte actual?',
    },
    {
      id: 'struggling',
      label: 'Identificar estudiantes con dificultades',
      icon: 'bi bi-search',
      prompt: '¿Cuáles estudiantes necesitan atención prioritaria según sus notas?',
    },
    {
      id: 'moderation',
      label: 'Moderación de foros',
      icon: 'bi bi-chat-square-dots',
      prompt: 'Resume las preguntas sin responder en los foros de Biología.',
    },
  ]);

  public readonly chatMessages = signal<ChatMessage[]>([]);
  public readonly isAiThinking = signal<boolean>(false);
  public readonly aiInputText = signal<string>('');

  // Notificación tipo toast para feedback
  public readonly actionNotification = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
    });
  }

  // ── Métodos de Interacción del Dashboard ─────────────────────────────────

  public selectNav(navId: string): void {
    if (navId === 'foros') {
      this.router.navigate(['/foro']);
      return;
    }
    if (navId === 'perfil') {
      this.activeNav.set('perfil');
      this.showToast('Perfil y Preferencias de Docente');
      return;
    }
    this.activeNav.set(navId);
  }

  /**
   * Cierre de sesión seguro y redirección al Login
   */
  public onLogout(): void {
    this.authService.logout();
    this.showToast('Cerrando sesión. Redirigiendo al inicio de sesión...');
    const timer = setTimeout(() => {
      this.router.navigate(['/login']);
    }, 800);
    this.timerIds.push(timer);
  }

  public onSearchChange(eventOrValue: Event | string): void {
    if (typeof eventOrValue === 'string') {
      this.searchQuery.set(eventOrValue);
    } else {
      const target = eventOrValue.target as HTMLInputElement;
      this.searchQuery.set(target.value);
    }
  }

  public onNotificationsClick(): void {
    this.toggleNotificationsDrawer();
  }

  public triggerQuickAction(action: QuickAction): void {
    if (action.id === 'register-student') {
      this.openRegisterModal();
    } else {
      this.showToast(`Acción seleccionada: ${action.label}`);
    }
  }

  public onNewAnalysis(): void {
    this.showToast('Generando análisis comparativo de la cohorte...');
  }

  // ── Gestión de Recomendaciones de Biblioteca ─────────────────────────────
  public onBookRecommended(book: Book): void {
    this.showToast(`"${book.title}" ha sido añadido a las lecturas recomendadas para tu clase.`);
  }

  // ── Gestión de Notificaciones ────────────────────────────────────────────

  public onMarkNotificationAsRead(id: string): void {
    this.profesorService.markNotificationAsRead(id);
  }

  public onToggleNotificationRead(id: string): void {
    this.profesorService.toggleNotificationRead(id);
  }

  public onMarkAllNotificationsAsRead(): void {
    this.profesorService.markAllNotificationsAsRead();
    this.showToast('Todas las notificaciones marcadas como leídas.');
  }

  public onDeleteNotification(id: string): void {
    this.profesorService.deleteNotification(id);
    this.showToast('Notificación eliminada de tu bandeja.');
  }

  public onNotificationSelected(item: TeacherNotification): void {
    if (item.actionRoute) {
      if (item.actionRoute.startsWith('/')) {
        this.router.navigate([item.actionRoute]);
      } else {
        this.selectNav(item.actionRoute);
      }
      this.closeNotificationsDrawer();
    } else {
      this.showToast(`Notificación: ${item.title}`);
    }
  }

  // ── Gestión del Modal de Registro ────────────────────────────────────────

  public openRegisterModal(): void {
    this.studentForm.reset({
      studentName: '',
      email: '',
      topic: 'Biología: Mitosis',
      score: 75,
      status: 'active',
    });
    this.isRegisterModalOpen.set(true);
  }

  public closeRegisterModal(): void {
    this.isRegisterModalOpen.set(false);
  }

  public onRegisterStudentSubmit(dto?: CreateStudentDto): void {
    const studentData: CreateStudentDto = dto ?? {
      studentName: this.studentForm.value.studentName?.trim() || '',
      email: this.studentForm.value.email?.trim() || '',
      topic: this.studentForm.value.topic?.trim() || '',
      score: Number(this.studentForm.value.score) || 0,
      status: this.studentForm.value.status || 'active',
    };

    if (!dto && this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.isSubmittingStudent.set(true);

    const timer = setTimeout(() => {
      this.profesorService.registerStudent(studentData);
      this.isSubmittingStudent.set(false);
      this.closeRegisterModal();
      this.showToast(`Estudiante "${studentData.studentName}" registrado con éxito.`);
    }, 400);

    this.timerIds.push(timer);
  }

  public onDeleteStudent(student: StudentProgress, event?: Event): void {
    if (event) event.stopPropagation();
    this.profesorService.deleteStudent(student.id);
    this.showToast(`Estudiante ${student.studentName} eliminado de la cohorte.`);
  }

  // ── Asistente Docente IA ─────────────────────────────────────────────────

  public selectSuggestion(suggestion: AiSuggestion): void {
    this.aiInputText.set(suggestion.prompt);
    this.submitAiMessage();
  }

  public onSendAiMessage(text: string): void {
    this.aiInputText.set(text);
    this.submitAiMessage();
  }

  public submitAiMessage(): void {
    const text = this.aiInputText().trim();
    if (!text || this.isAiThinking()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    this.chatMessages.update((msgs) => [...msgs, userMsg]);
    this.aiInputText.set('');
    this.isAiThinking.set(true);

    const timer = setTimeout(() => {
      const responseText = this.generateAiResponse(text);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date(),
      };
      this.chatMessages.update((msgs) => [...msgs, aiMsg]);
      this.isAiThinking.set(false);
    }, 600);

    this.timerIds.push(timer);
  }

  private generateAiResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    const studentsList = this.students();
    const struggling = studentsList.filter((s) => s.score < 50);

    if (lower.includes('atención') || lower.includes('dificultad') || lower.includes('notas')) {
      if (struggling.length > 0) {
        const names = struggling.map((s) => `${s.studentName} (${s.score}%)`).join(', ');
        return `He identificado que ${struggling.length} estudiante(s) requieren atención prioritaria: ${names}. Sugiero reforzar el tema de Mitosis y asignar una lectura guiada.`;
      }
      return 'Actualmente ningún estudiante presenta notas críticas (< 50%). ¡La cohorte avanza con buen rendimiento!';
    }

    if (lower.includes('calificaciones') || lower.includes('promedio')) {
      const total = studentsList.reduce((acc, s) => acc + s.score, 0);
      const avg = studentsList.length ? Math.round(total / studentsList.length) : 0;
      return `El promedio general de la cohorte es de ${avg}%. Tienes ${this.profesorService.activeStudents()} estudiantes activos actualmente.`;
    }

    return `He procesado tu consulta pedagógica: "${prompt}". Con base en el avance de tus ${studentsList.length} estudiantes, el progreso del grupo se mantiene estable en el módulo de Biología.`;
  }

  private showToast(msg: string): void {
    this.actionNotification.set(msg);
    const timer = setTimeout(() => {
      this.actionNotification.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
