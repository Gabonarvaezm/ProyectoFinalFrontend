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
  AI_DEFAULT_FALLBACK_REPLY,
  AI_KNOWLEDGE_BASE,
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
  public readonly notifications = signal<StudentNotification[]>([
    {
      id: 'notif-1',
      type: 'task',
      title: 'Nueva Tarea Asignada: Biología Celular',
      message: 'El Prof. García asignó la actividad "Reporte de Mitosis y Meiosis" para completar en el foro.',
      authorName: 'Prof. García',
      authorRole: 'professor',
      authorInitials: 'PG',
      timeAgo: 'Hace 30 min',
      read: false,
      subject: 'Ciencias',
      actionRoute: '/foro',
    },
    {
      id: 'notif-2',
      type: 'forum_reply',
      title: 'Respuesta Docente en Foro',
      message: 'El Prof. Martínez respondió tu consulta sobre la regla LIATE en integración por partes.',
      authorName: 'Prof. Martínez',
      authorRole: 'professor',
      authorInitials: 'PM',
      timeAgo: 'Hace 2 horas',
      read: false,
      subject: 'Matemáticas',
      actionRoute: '/foro',
    },
    {
      id: 'notif-3',
      type: 'teacher_announcement',
      title: 'Nuevo Material en Biblioteca',
      message: 'La docente publicó un compendio de ejercicios clave para el próximo examen de Ciencias.',
      authorName: 'Prof. Laura Gómez',
      authorRole: 'professor',
      authorInitials: 'LG',
      timeAgo: 'Ayer',
      read: true,
      subject: 'Ciencias',
      actionRoute: '/biblioteca',
    },
    {
      id: 'notif-4',
      type: 'forum_reply',
      title: 'Intervención de compañero en Historia',
      message: 'Mateo Gómez aportó una síntesis sobre el impacto de la Revolución Industrial.',
      authorName: 'Mateo Gómez',
      authorRole: 'student',
      authorInitials: 'MG',
      timeAgo: 'Hace 5 horas',
      read: true,
      subject: 'Historia',
      actionRoute: '/foro',
    },
  ]);

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
  public readonly practiceExam = signal({
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
  public readonly forumQuestions = signal<ForumQuestion[]>([
    {
      id: 'q1',
      title: '¿Cómo resuelvo integrales por partes?',
      tagText: 'Respondido por Prof. Martínez',
      tagClass: 'badge-teacher',
      tagIcon: 'bi bi-check-circle-fill',
      timeAgo: 'Hace 2 horas',
      subject: 'Matemáticas',
      authorName: 'Camila Torres',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      avatarFallbackBg: '#eff6ff',
      avatarFallbackColor: '#1d4ed8',
      initials: 'CT',
    },
    {
      id: 'q2',
      title: 'Duda sobre las características del Barroco',
      tagText: '2 respuestas de estudiantes',
      tagClass: 'badge-students',
      tagIcon: 'bi bi-chat-left-dots-fill',
      timeAgo: 'Hace 5 horas',
      subject: 'Historia',
      authorName: 'Mateo Gómez',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      avatarFallbackBg: '#fef3c7',
      avatarFallbackColor: '#b45309',
      initials: 'MG',
    },
  ]);

  // ── Panel Lateral Derecho: Asistente de Aprendizaje IA ────────────────────
  public readonly chatMessages = signal<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      text: '¿Qué es la Mitosis?',
      timestamp: new Date(),
    },
    {
      id: 'm2',
      sender: 'ai',
      text: 'La mitosis es el proceso de división celular mediante el cual una célula madre se divide para producir dos células hijas genéticamente idénticas. Es fundamental para el crecimiento y la reparación de tejidos.',
      timestamp: new Date(),
    },
  ]);

  public readonly isAiThinking = signal<boolean>(false);
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
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  public onToggleNotificationRead(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  public onMarkAllNotificationsAsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    this.showToast('Todas las notificaciones marcadas como leídas.');
  }

  public onDeleteNotification(id: string): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
    this.showToast('Notificación eliminada de tu bandeja.');
  }

  public onNotificationSelected(item: StudentNotification): void {
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

  public onStartExam(): void {
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
    if (action.id === 'summary') {
      this.sendAiMessage('Por favor genera un resumen clave del tema Biología Celular: Mitosis y Meiosis.');
    } else if (action.id === 'exam') {
      this.sendAiMessage('Crea un breve examen de práctica de 3 preguntas sobre Mitosis.');
    } else if (action.id === 'explain') {
      this.sendAiMessage('Explica de manera sencilla la diferencia entre Profase y Metafase.');
    } else {
      this.sendAiMessage(`Ayuda con: ${action.label}`);
    }
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
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date(),
    };

    this.chatMessages.update((prev) => [...prev, userMsg]);
    this.aiInputText.set('');
    this.isAiThinking.set(true);

    const timer = setTimeout(() => {
      const lower = promptText.toLowerCase();
      const matched = AI_KNOWLEDGE_BASE.find((rule) =>
        rule.keywords.some((kw) => lower.includes(kw))
      );
      const reply = matched?.response ?? AI_DEFAULT_FALLBACK_REPLY;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date(),
      };

      this.chatMessages.update((prev) => [...prev, aiMsg]);
      this.isAiThinking.set(false);
    }, 600);

    this.timerIds.push(timer);
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
