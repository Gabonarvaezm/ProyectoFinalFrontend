import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
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
} from './models/profesor.model';
import { Biblioteca } from '../biblioteca/biblioteca';
import { Book } from '../biblioteca/models/book.model';
import {
  ProfesorActivityFeedComponent,
  ProfesorAiChatComponent,
  ProfesorCreateStudentModalComponent,
  ProfesorHeaderComponent,
  ProfesorKpiCardsComponent,
  ProfesorSidebarComponent,
  ProfesorStudentTableComponent,
} from './components';

@Component({
  imports: [
    Biblioteca,
    ProfesorSidebarComponent,
    ProfesorHeaderComponent,
    ProfesorKpiCardsComponent,
    ProfesorStudentTableComponent,
    ProfesorActivityFeedComponent,
    ProfesorAiChatComponent,
    ProfesorCreateStudentModalComponent,
  ],
  selector: 'app-profesor',
  styleUrl: './profesor.scss',
  templateUrl: './profesor.html',
})
export class Profesor {
  private readonly router = inject(Router);
  private readonly profesorService = inject(ProfesorService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Navegación Lateral ───────────────────────────────────────────────────
  public readonly activeNav = signal<string>('dashboard');

  public readonly navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill' },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book' },
    { id: 'asistente-ia', label: 'Asistente IA', icon: 'bi bi-robot' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text' },
    { id: 'progreso', label: 'Progreso', icon: 'bi bi-bar-chart' },
    { id: 'perfil', label: 'Perfil', icon: 'bi bi-person-circle' },
  ]);

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
    this.activeNav.set(navId);
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
    this.showToast('Tienes 1 notificación académica pendiente.');
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
    let payload: CreateStudentDto;

    if (dto) {
      payload = dto;
    } else {
      if (this.studentForm.invalid) {
        this.studentForm.markAllAsTouched();
        this.showToast('Por favor completa todos los campos del estudiante.');
        return;
      }
      const formValue = this.studentForm.value;
      payload = {
        studentName: formValue.studentName,
        email: formValue.email,
        topic: formValue.topic,
        score: Number(formValue.score),
        status: formValue.status,
      };
    }

    this.isSubmittingStudent.set(true);
    const newStudent = this.profesorService.registerStudent(payload);
    this.isSubmittingStudent.set(false);
    this.closeRegisterModal();
    this.showToast(`¡Estudiante ${newStudent.studentName} registrado exitosamente!`);
  }

  public onDeleteStudent(student: StudentProgress, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.profesorService.deleteStudent(student.id);
    this.showToast(`Estudiante ${student.studentName} eliminado.`);
  }

  // ── Lógica del Asistente de IA (Conectada al Estado Real) ────────────────

  public selectSuggestion(suggestion: AiSuggestion): void {
    this.sendAiMessage(suggestion.prompt);
  }

  public submitAiMessage(): void {
    const text = this.aiInputText().trim();
    if (!text || this.isAiThinking()) return;
    this.sendAiMessage(text);
  }

  public onSendAiMessage(text: string): void {
    this.sendAiMessage(text);
  }

  private sendAiMessage(promptText: string): void {
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
      const replyText = this.generateAiReply(promptText);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date(),
      };

      this.chatMessages.update((prev) => [...prev, aiMsg]);
      this.isAiThinking.set(false);
    }, 600);

    this.timerIds.push(timer);
  }

  private generateAiReply(promptText: string): string {
    const lower = promptText.toLowerCase();

    if (lower.includes('promedio') || lower.includes('grading')) {
      return this.buildGradeAverageReply();
    }
    if (lower.includes('atención') || lower.includes('struggling') || lower.includes('prioritaria')) {
      return this.buildStrugglingStudentsReply();
    }
    if (lower.includes('foro') || lower.includes('moderation')) {
      return 'Hay 2 preguntas sin resolver en el foro de Biología relacionadas con "Mitosis y Meiosis" y una consulta sobre "Integrales por partes".';
    }
    return 'He analizado los datos actuales del aula y puedo asistirte con las evaluaciones y seguimiento.';
  }

  private buildGradeAverageReply(): string {
    const avg = this.kpiMetrics().find((m) => m.id === 'avg-score')?.value ?? '78.5%';
    return `El promedio general de tu clase es ${avg}. El desempeño general muestra una tendencia positiva (+4.1%).`;
  }

  private buildStrugglingStudentsReply(): string {
    const struggling = this.students().filter((s) => s.score < 70);
    if (struggling.length === 0) {
      return 'Actualmente todos los estudiantes tienen un rendimiento igual o superior a 70%.';
    }
    const names = struggling.map((s) => `${s.studentName} (${s.score}%)`).join(', ');
    return `Los estudiantes que requieren seguimiento prioritario son: ${names}.`;
  }

  private showToast(msg: string): void {
    this.actionNotification.set(msg);
    const toastTimer = setTimeout(() => {
      this.actionNotification.set(null);
    }, 3200);
    this.timerIds.push(toastTimer);
  }
}
