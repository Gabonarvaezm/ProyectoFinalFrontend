import { ActionToastComponent } from '../shared/components/action-toast/action-toast.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatbotService } from '../core/services/chatbot.service';
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
  CohortAnalysisSummary,
  CreateExamDto,
  CreateStudentDto,
  KpiMetric,
  NavItem,
  QuickAction,
  RecentActivity,
  SendMessageDto,
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
  ProfesorAnalysisModalComponent,
  ProfesorCreateExamModalComponent,
  ProfesorCreateStudentModalComponent,
  ProfesorHeaderComponent,
  ProfesorKpiCardsComponent,
  ProfesorNotificationsDrawerComponent,
  ProfesorSendMessageModalComponent,
  ProfesorSidebarComponent,
  ProfesorStudentTableComponent,
} from './components';

@Component({
  imports: [
    ActionToastComponent,
    Biblioteca,
    ConfiguracionComponent,
    ProfesorSidebarComponent,
    ProfesorHeaderComponent,
    ProfesorKpiCardsComponent,
    ProfesorStudentTableComponent,
    ProfesorActivityFeedComponent,
    ProfesorAiChatComponent,
    ProfesorCreateStudentModalComponent,
    ProfesorCreateExamModalComponent,
    ProfesorSendMessageModalComponent,
    ProfesorAnalysisModalComponent,
    ProfesorNotificationsDrawerComponent,
  ],
  selector: 'app-profesor',
  styleUrls: ['./profesor.scss'],
  templateUrl: './profesor.html',
})
export class Profesor {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly chatbotService = inject(ChatbotService);
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

  // ── Modal de Crear Examen ────────────────────────────────────────────────
  public readonly isCreateExamModalOpen = signal<boolean>(false);
  public readonly isSubmittingExam = signal<boolean>(false);

  // ── Modal de Enviar Mensaje a la Clase ───────────────────────────────────
  public readonly isSendMessageModalOpen = signal<boolean>(false);
  public readonly isSubmittingMessage = signal<boolean>(false);
  public readonly messageDefaultGroup = signal<'all' | 'needs-attention' | 'active'>('all');

  // ── Modal de Análisis de Cohorte ─────────────────────────────────────────
  public readonly isAnalysisModalOpen = signal<boolean>(false);
  public readonly cohortAnalysis = computed<CohortAnalysisSummary>(() =>
    this.profesorService.getCohortAnalysis()
  );

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
  public readonly aiErrorMessage = signal<string | null>(null);
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
    } else if (action.id === 'create-exam') {
      this.openCreateExamModal();
    } else if (action.id === 'message-class') {
      this.openSendMessageModal('all');
    } else {
      this.showToast(`Acción seleccionada: ${action.label}`);
    }
  }

  // ── Gestión del Modal: Nuevo Análisis de Cohorte ─────────────────────────
  public onNewAnalysis(): void {
    this.isAnalysisModalOpen.set(true);
    this.showToast('Generando diagnóstico analítico de la cohorte con IA...');
  }

  public closeAnalysisModal(): void {
    this.isAnalysisModalOpen.set(false);
  }

  public onConsultAiFromAnalysis(prompt: string): void {
    this.closeAnalysisModal();
    this.openAiDrawer();
    this.aiInputText.set(prompt);
    this.submitAiMessage();
  }

  public onMessageAtRiskFromAnalysis(): void {
    this.closeAnalysisModal();
    this.openSendMessageModal('needs-attention');
  }

  // ── Gestión del Modal: Crear Examen ──────────────────────────────────────
  public openCreateExamModal(): void {
    this.isCreateExamModalOpen.set(true);
  }

  public closeCreateExamModal(): void {
    this.isCreateExamModalOpen.set(false);
  }

  public onCreateExamSubmit(dto: CreateExamDto): void {
    this.isSubmittingExam.set(true);
    const timer = setTimeout(() => {
      this.profesorService.createExam(dto);
      this.isSubmittingExam.set(false);
      this.closeCreateExamModal();
      this.showToast(`Examen "${dto.title}" (${dto.subject}) publicado con éxito para la clase.`);
    }, 400);
    this.timerIds.push(timer);
  }

  // ── Gestión del Modal: Enviar Mensaje a la Clase ─────────────────────────
  public openSendMessageModal(targetGroup: 'all' | 'needs-attention' | 'active' = 'all'): void {
    this.messageDefaultGroup.set(targetGroup);
    this.isSendMessageModalOpen.set(true);
  }

  public closeSendMessageModal(): void {
    this.isSendMessageModalOpen.set(false);
  }

  public onSendMessageSubmit(dto: SendMessageDto): void {
    this.isSubmittingMessage.set(true);
    const timer = setTimeout(() => {
      this.profesorService.sendMessageToClass(dto);
      this.isSubmittingMessage.set(false);
      this.closeSendMessageModal();
      const targetText =
        dto.targetGroup === 'all'
          ? 'toda la clase'
          : dto.targetGroup === 'needs-attention'
          ? 'alumnos con atención prioritaria'
          : 'alumnos activos';
      this.showToast(`Comunicado "${dto.subject}" enviado con éxito a ${targetText}.`);
    }, 400);
    this.timerIds.push(timer);
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
    if (!text || text.length > 2000 || this.isAiThinking()) return;
    const history = this.chatMessages();
    this.aiErrorMessage.set(null);
    this.chatMessages.update((messages) => [...messages, {
      id: `user-${Date.now()}`, sender: 'user', text, timestamp: new Date(),
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
          this.aiErrorMessage.set(error instanceof Error ? error.message : 'No se pudo consultar la IA. Intenta de nuevo.');
          this.aiInputText.set(text);
          this.isAiThinking.set(false);
        },
      });
  }

  private showToast(msg: string): void {
    this.actionNotification.set(msg);
    const timer = setTimeout(() => {
      this.actionNotification.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
