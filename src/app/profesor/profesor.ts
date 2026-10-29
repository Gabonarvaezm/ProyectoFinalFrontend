import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfesorService } from '../core/services/profesor.service';
import {
  AiSuggestion,
  ChatMessage,
  CreateStudentDto,
  NavItem,
  QuickAction,
  StudentProgress,
  StudentStatus,
} from './models/profesor.model';
import { Biblioteca } from '../biblioteca/biblioteca';
import { Book } from '../biblioteca/models/book.model';

@Component({
  imports: [RouterLink, FormsModule, ReactiveFormsModule, Biblioteca],
  selector: 'app-profesor',
  styleUrl: './profesor.scss',
  templateUrl: './profesor.html',
})
export class Profesor {
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
  public readonly filteredStudents = computed(() => {
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
    { id: 'message-class', label: 'Message Class', icon: 'bi bi-chat-square-text' },
    { id: 'create-exam', label: 'Create Exam', icon: 'bi bi-file-earmark-plus' },
  ]);

  // ── Modal de Registro y Creación de Estudiante ───────────────────────────
  public readonly isRegisterModalOpen = signal<boolean>(false);
  public readonly isSubmittingStudent = signal<boolean>(false);

  public readonly studentForm: FormGroup = this.fb.group({
    studentName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['Biología: Mitosis', [Validators.required, Validators.minLength(3)]],
    score: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    status: ['active' as StudentStatus, [Validators.required]],
  });

  // ── Asistente de IA (Chat & Sugerencias Dinámicas) ────────────────────────
  public readonly aiSuggestions = signal<AiSuggestion[]>([
    {
      id: 'grading',
      label: 'Help with grading',
      icon: 'bi bi-text-left',
      prompt: '¿Cuál es el promedio general y cómo evaluar la cohorte actual?',
    },
    {
      id: 'struggling',
      label: 'Identify struggling students',
      icon: 'bi bi-search',
      prompt: '¿Cuáles estudiantes necesitan atención prioritaria según sus notas?',
    },
    {
      id: 'moderation',
      label: 'Forum moderation',
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
    this.activeNav.set(navId);
  }

  public onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
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

  public onRegisterStudentSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      this.showToast('Por favor completa todos los campos del estudiante.');
      return;
    }

    this.isSubmittingStudent.set(true);
    const formValue = this.studentForm.value;

    const dto: CreateStudentDto = {
      studentName: formValue.studentName,
      email: formValue.email,
      topic: formValue.topic,
      score: Number(formValue.score),
      status: formValue.status,
    };

    const newStudent = this.profesorService.registerStudent(dto);
    this.isSubmittingStudent.set(false);
    this.closeRegisterModal();
    this.showToast(`¡Estudiante ${newStudent.studentName} registrado exitosamente!`);
  }

  public onDeleteStudent(student: StudentProgress, event: Event): void {
    event.stopPropagation();
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
      let replyText =
        'He analizado los datos actuales del aula y puedo asistirte con las evaluaciones y seguimiento.';

      const lower = promptText.toLowerCase();

      if (lower.includes('promedio') || lower.includes('grading')) {
        const avg = this.kpiMetrics().find((m) => m.id === 'avg-score')?.value ?? '78.5%';
        replyText = `El promedio general de tu clase es ${avg}. El desempeño general muestra una tendencia positiva (+4.1%).`;
      } else if (lower.includes('atención') || lower.includes('struggling') || lower.includes('prioritaria')) {
        const struggling = this.students().filter((s) => s.score < 70);
        if (struggling.length > 0) {
          const names = struggling.map((s) => `${s.studentName} (${s.score}%)`).join(', ');
          replyText = `Los estudiantes que requieren seguimiento prioritario son: ${names}.`;
        } else {
          replyText = 'Actualmente todos los estudiantes tienen un rendimiento igual o superior a 70%.';
        }
      } else if (lower.includes('foro') || lower.includes('moderation')) {
        replyText =
          'Hay 2 preguntas sin resolver en el foro de Biología relacionadas con "Mitosis y Meiosis" y una consulta sobre "Integrales por partes".';
      }

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

  private showToast(msg: string): void {
    this.actionNotification.set(msg);
    const toastTimer = setTimeout(() => {
      this.actionNotification.set(null);
    }, 3200);
    this.timerIds.push(toastTimer);
  }
}
