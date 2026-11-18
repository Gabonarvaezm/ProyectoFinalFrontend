import { effect, viewChild } from '@angular/core';
import { AcademicSyncService } from '../core/services/academic-sync.service';
import { ForumService } from '../core/services/forum.service';
import { EstudiantePublicationsComponent } from './components/estudiante-publications/estudiante-publications.component';
import { ActionToastComponent } from '../shared/components/action-toast/action-toast.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatbotService } from '../core/services/chatbot.service';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import {
  ChatMessage,
  NavItem,
  QuickAction,
  STORAGE_KEYS,
} from '../core/models/auth.model';
import { Biblioteca } from '../biblioteca/biblioteca';
import { ConfiguracionComponent } from '../configuracion/configuracion';
import {
  EstudianteAiDrawerComponent,
  EstudianteContinueCourseComponent,
  EstudianteExamCardComponent,
  EstudianteForumPreviewComponent,
  EstudianteHeaderComponent,
  EstudianteNotificationsDrawerComponent,
  EstudianteSidebarComponent,
  EstudianteSubjectsGridComponent,
  EstudianteWeeklyProgressComponent,
} from './components';
import {
  AI_QUICK_ACTION_PROMPTS,
  SUBJECT_CATEGORY_MAP,
} from './constants/estudiante.constants';
import {
  ActiveCourse,
  ForumQuestion,
  LibrarySubject,
  PracticeExam,
  StudentNotification,
  WeeklyProgressItem,
} from './models/estudiante.model';

export type {
  ActiveCourse,
  ChatMessage,
  ForumQuestion,
  LibrarySubject,
  NavItem,
  PracticeExam,
  QuickAction,
  StudentNotification,
  WeeklyProgressItem,
};

@Component({
  imports: [
    EstudiantePublicationsComponent,
    ActionToastComponent,
    FormsModule,
    Biblioteca,
    ConfiguracionComponent,
    EstudianteSidebarComponent,
    EstudianteHeaderComponent,
    EstudianteContinueCourseComponent,
    EstudianteSubjectsGridComponent,
    EstudianteExamCardComponent,
    EstudianteWeeklyProgressComponent,
    EstudianteForumPreviewComponent,
    EstudianteAiDrawerComponent,
    EstudianteNotificationsDrawerComponent,
  ],
  selector: 'app-estudiante',
  styleUrls: ['./estudiante.scss'],
  templateUrl: './estudiante.html',
})
export class Estudiante {
  private readonly authService = inject(AuthService);
  private readonly academicSync = inject(AcademicSyncService);
  private readonly forumService = inject(ForumService);
  private readonly publications = viewChild(EstudiantePublicationsComponent);
  readonly publishedExams = computed(() => this.academicSync.snapshot()?.exams ?? []);
  readonly teacherMessages = computed(() => this.academicSync.snapshot()?.messages ?? []);
  private readonly chatbotService = inject(ChatbotService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  public readonly currentUser = this.authService.currentUser;

  // ── Navegación Lateral ───────────────────────────────────────────────────
  public readonly activeNav = signal<string>('dashboard');
  public readonly selectedSubjectCategory = signal<string | null>(null);

  public readonly navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill' },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text' },
  ]);

  // ── Panel Desplegable (Drawer) Asistente IA ─────────────────────────────
  public readonly isAiDrawerOpen = signal<boolean>(false);

  public toggleAiDrawer(): void {
    this.isAiDrawerOpen.update((open) => !open);
  }

  public closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }

  public openAiDrawer(): void {
    this.isAiDrawerOpen.set(true);
  }

  // ── Panel Desplegable (Drawer) Notificaciones Académicas ──────────────────
  public readonly isNotificationsDrawerOpen = signal<boolean>(false);

  public toggleNotificationsDrawer(): void {
    this.isNotificationsDrawerOpen.update((open) => !open);
  }

  public closeNotificationsDrawer(): void {
    this.isNotificationsDrawerOpen.set(false);
  }

  public openNotificationsDrawer(): void {
    this.isNotificationsDrawerOpen.set(true);
  }

  // ── Notificaciones del Estudiante (Tareas, Avisos y Foros) ────────────────
  public readonly notifications = signal<StudentNotification[]>([]);

  /** Conteo derivado de avisos y tareas no leídas */
  public readonly unreadNotificationsCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );
  public readonly notificationsCount = this.unreadNotificationsCount;

  // ── Usuario y Búsqueda ───────────────────────────────────────────────────
  public readonly studentName = signal<string>('Alejandro');
  public readonly studentEmail = signal<string>('');
  public readonly studentInstitution = signal<string>('Institución Pública');
  public readonly searchQuery = signal<string>('');

  /** Iniciales calculadas dinámicamente para el avatar fallback */
  public readonly userInitials = computed(() => {
    const name = this.studentName().trim();
    if (!name) return 'ES';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  // ── Curso Activo / Continuar Aprendiendo ─────────────────────────────────
  public readonly currentCourse = signal({
    category: 'CONTINUAR APRENDIENDO',
    title: 'Biología Celular - Mitosis y Meiosis',
    progress: 85,
    icon: 'bi bi-virus',
  });

  // ── Biblioteca Digital ───────────────────────────────────────────────────
  public readonly subjects = signal<LibrarySubject[]>([
    {
      id: 'mat',
      name: 'Matemáticas',
      topic: 'Funciones Lineales',
      icon: 'bi bi-calculator-fill',
      badgeBg: '#e6f4ea',
      iconColor: '#137333',
      weeklyProgress: 90,
    },
    {
      id: 'cie',
      name: 'Ciencias',
      topic: 'Química Orgánica',
      icon: 'bi bi-eyedropper',
      badgeBg: '#fef7e0',
      iconColor: '#b06000',
      weeklyProgress: 75,
    },
    {
      id: 'his',
      name: 'Historia',
      topic: 'Revolución Industrial',
      icon: 'bi bi-hourglass-split',
      badgeBg: '#fce8e6',
      iconColor: '#c5221f',
      weeklyProgress: 60,
    },
    {
      id: 'len',
      name: 'Lengua',
      topic: 'Análisis Sintáctico',
      icon: 'bi bi-book-half',
      badgeBg: '#e8f0fe',
      iconColor: '#1a73e8',
      weeklyProgress: 45,
    },
  ]);

  public readonly filteredSubjects = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.subjects();
    return this.subjects().filter(
      (s) => s.name.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)
    );
  });

  // ── Examen de Práctica ───────────────────────────────────────────────────
  public readonly practiceExam = computed(() => this.publishedExams()[0] ?? {
    title: 'Examen de Práctica',
    topic: 'Funciones Lineales',
    questionsCount: 10,
    difficulty: 'Media',
  });

  // ── Progreso Semanal: derivado de las materias, actualizable por selección ──
  /** ID de la materia actualmente resaltada en el gráfico (null = mostrar todas) */
  public readonly highlightedSubjectId = signal<string | null>(null);

  /** Convierte las materias en items para el gráfico de progreso */
  public readonly weeklyProgress = computed<WeeklyProgressItem[]>(() =>
    this.subjects().map((s) => ({
      subject: s.name.slice(0, 3),    // 3 letras para la etiqueta del eje
      subjectId: s.id,
      fullName: s.name,
      percentage: s.weeklyProgress,
      iconColor: s.iconColor,
      highlighted: this.highlightedSubjectId() === null
        || this.highlightedSubjectId() === s.id,
    }))
  );

  // ── Preguntas Recientes en Foros ─────────────────────────────────────────
  public readonly forumQuestions = computed<ForumQuestion[]>(() => this.forumService.posts().slice(0, 3).map((post) => ({
    id: post.id, title: post.title,
    tagText: post.isTeacherVerified ? 'Publicación docente' : `${post.repliesCount} respuestas`,
    tagClass: post.isTeacherVerified ? 'badge-teacher' : 'badge-students',
    tagIcon: post.isTeacherVerified ? 'bi bi-check-circle-fill' : 'bi bi-chat-left-dots-fill',
    timeAgo: post.createdAt, subject: post.subject, authorName: post.author.name,
    avatar: post.author.avatar ?? '', initials: post.author.initials,
    avatarFallbackBg: 'var(--color-primary-50)', avatarFallbackColor: 'var(--color-primary)',
  })));

  public readonly chatMessages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy DiscerIA. ¿En qué tema académico puedo ayudarte?',
      timestamp: new Date(),
    },
  ]);

  public readonly isAiThinking = signal<boolean>(false);
  public readonly aiErrorMessage = signal<string | null>(null);
  public readonly aiInputText = signal<string>('');

  public readonly quickActions = signal<QuickAction[]>([
    { id: 'summary', label: 'Generar Resumen', icon: 'bi bi-file-earmark-text' },
    { id: 'exam', label: 'Crear Examen de Práctica', icon: 'bi bi-patch-question' },
    { id: 'explain', label: 'Explicar concepto difícil', icon: 'bi bi-pin-map' },
  ]);

  // ── Feedback / Toast ─────────────────────────────────────────────────────
  public readonly toastMessage = signal<string | null>(null);

  // ── Control de Fallback de Avatares ─────────────────────────────────────
  public readonly avatarErrors = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const state = this.academicSync.snapshot();
      if (state || this.academicSync.enabled()) this.notifications.set(state?.notifications ?? []);
    });
    this.initializeUserData();

    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
    });
  }

  /**
   * Sincroniza la información del estudiante desde AuthService o localStorage
   */
  private initializeUserData(): void {
    // 1. Verificar si hay un usuario activo en memoria en AuthService
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      if (currentUser.fullName) {
        this.studentName.set(currentUser.fullName);
      }
      if (currentUser.email) {
        this.studentEmail.set(currentUser.email);
      }
      if (currentUser.institution) {
        this.studentInstitution.set(currentUser.institution);
      }
      return;
    }

    // 2. Recuperación persistente SSR-safe desde localStorage
    if (isPlatformBrowser(this.platformId)) {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.REGISTERED_USER);
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as {
            fullName?: string;
            email?: string;
            institution?: string;
            role?: string;
          };
          if (parsed?.fullName) {
            this.studentName.set(parsed.fullName);
          }
          if (parsed?.email) {
            this.studentEmail.set(parsed.email);
          }
          if (parsed?.institution) {
            this.studentInstitution.set(parsed.institution);
          }
        }
      } catch {
        // En caso de error de lectura, mantiene los valores predeterminados
      }
    }
  }

  // ── Métodos de Interacción ───────────────────────────────────────────────

  public selectNav(id: string): void {
    if (id === 'foros') { this.router.navigate(['/foro']); return; }
    this.activeNav.set(id);
    if (id === 'biblioteca') {
      this.selectedSubjectCategory.set(null);
    }
    if (id === 'perfil') {
      this.showToast(`Perfil de ${this.studentName()} • ${this.studentInstitution()}`);
    } else {
      this.showToast(`Navegando a: ${id}`);
    }
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

  public onContinueCourse(): void {
    this.showToast(
      `Redirigiendo al foro para completar tareas de ${this.currentCourse().title}...`
    );
    this.router.navigate(['/foro']);
  }

  public onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  public onNotificationsClick(): void {
    this.toggleNotificationsDrawer();
  }

  public onMarkNotificationAsRead(id: string): void {
    this.academicSync.receipt(id, true);
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  public onToggleNotificationRead(id: string): void {
    const notice = this.notifications().find((item) => item.id === id);
    if (notice) this.academicSync.receipt(id, !notice.read);
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  public onMarkAllNotificationsAsRead(): void {
    this.notifications().filter((notice) => !notice.read).forEach((notice) => this.academicSync.receipt(notice.id, true));
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    this.showToast('Todas las notificaciones marcadas como leídas.');
  }

  public onDeleteNotification(id: string): void {
    this.academicSync.receipt(id, true, true);
    this.notifications.update((list) => list.filter((n) => n.id !== id));
    this.showToast('Notificación eliminada de tu bandeja.');
  }

  public onNotificationSelected(item: StudentNotification): void {
    if (item.actionRoute) {
      if (item.actionRoute.startsWith('/')) {
        if (item.actionRoute === '/estudiante') this.activeNav.set('dashboard');
        this.router.navigateByUrl(item.actionRoute);
      } else {
        this.selectNav(item.actionRoute);
      }
      this.closeNotificationsDrawer();
    } else {
      this.showToast(`Notificación: ${item.title}`);
    }
  }

  public onStartExam(): void {
    const exam = this.publishedExams()[0];
    if (exam) { this.publications()?.openExam(exam.id); return; }
    this.showToast(`Iniciando ${this.practiceExam().title}: ${this.practiceExam().topic}`);
  }

  public onSelectSubject(subject: LibrarySubject): void {
    // Resalta la materia en el gráfico de progreso
    this.highlightedSubjectId.set(subject.id);
    this.showToast(`${subject.name}: ${subject.weeklyProgress}% de progreso esta semana`);
  }

  /** Recibe la barra del gráfico presionada y resalta la materia correspondiente */
  public onProgressBarSelected(item: WeeklyProgressItem): void {
    this.highlightedSubjectId.set(item.subjectId);
    this.showToast(`${item.fullName}: ${item.percentage}% de progreso esta semana`);
  }

  /** Restablece el gráfico mostrando todas las materias */
  public onClearSubjectHighlight(): void {
    this.highlightedSubjectId.set(null);
  }

  public onViewAllLibrary(): void {
    this.selectedSubjectCategory.set(null);
    this.activeNav.set('biblioteca');
    this.showToast('Abriendo catálogo completo de la Biblioteca Digital');
  }

  public onViewAllForums(): void {
    this.router.navigate(['/foro']);
  }

  public onViewThread(question: ForumQuestion): void {
    this.showToast(`Abriendo hilo en el foro: "${question.title}"`);
    this.router.navigate(['/foro']);
  }

  public onQuickAction(action: QuickAction): void {
    if (this.isAiThinking()) return;
    const prompt = AI_QUICK_ACTION_PROMPTS[action.id] ?? 'Ayúdame con ';
    const topic = this.aiInputText().trim();
    if (!topic) {
      this.aiInputText.set(prompt);
      return;
    }
    this.sendAiMessage(`${prompt}${topic}`);
  }

  public onSendAiMessage(text: string): void {
    this.sendAiMessage(text);
  }

  public submitAiMessage(): void {
    const text = this.aiInputText().trim();
    if (!text || this.isAiThinking()) return;
    this.sendAiMessage(text);
  }

  public sendAiMessage(promptText: string): void {
    const text = promptText.trim();
    if (!text || text.length > 2000 || this.isAiThinking()) return;
    const history = this.chatMessages();
    this.aiErrorMessage.set(null);
    const userMessageId = `user-${Date.now()}`;
    this.chatMessages.update((messages) => [...messages, {
      id: userMessageId, sender: 'user', text, timestamp: new Date(),
    }]);
    this.aiInputText.set('');
    this.isAiThinking.set(true);
    this.chatbotService.sendMessage(text, 'tutor', history)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          this.chatMessages.update((messages) => [...messages, {
            id: message.id, sender: 'ai', text: message.text, timestamp: message.timestamp,
          }]);
          this.isAiThinking.set(false);
        },
        error: (error: unknown) => {
          this.chatMessages.update((messages) => messages.filter((message) => message.id !== userMessageId));
          this.aiErrorMessage.set(error instanceof Error ? error.message : 'No se pudo consultar la IA. Intenta de nuevo.');
          this.aiInputText.set(text);
          this.isAiThinking.set(false);
        },
      });
  }

  public isAvatarBroken(id: string): boolean {
    return this.avatarErrors().has(id);
  }

  public onAvatarError(questionId: string): void {
    this.avatarErrors.update((set) => new Set(set).add(questionId));
  }

  public showToast(msg: string): void {
    this.toastMessage.set(msg);
    const timer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
    this.timerIds.push(timer);
  }
}
