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

@Component({
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
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
      const currentStudents = this.students();
      let responseText = 'He procesado tu consulta. Puedo preparar una rúbrica o resumen pedagógico.';

      const lowerPrompt = promptText.toLowerCase();

      if (lowerPrompt.includes('struggling') || lowerPrompt.includes('atención') || lowerPrompt.includes('prioritaria')) {
        const struggling = currentStudents.filter((s) => s.score < 50 || s.status === 'needs-attention');
        if (struggling.length > 0) {
          const names = struggling.map((s) => `${s.studentName} (${s.score}%)`).join(', ');
          responseText = `Identifiqué ${struggling.length} estudiante(s) con necesidad de apoyo: ${names}. Sugiero asignarles lecturas de refuerzo.`;
        } else {
          responseText = `¡Excelente noticia! Ningún estudiante registrado se encuentra actualmente en estado crítico de rendimiento.`;
        }
      } else if (lowerPrompt.includes('grading') || lowerPrompt.includes('promedio') || lowerPrompt.includes('evaluar')) {
        if (currentStudents.length > 0) {
          const avg = Math.round(
            currentStudents.reduce((acc, s) => acc + s.score, 0) / currentStudents.length
          );
          responseText = `La cohorte cuenta con ${currentStudents.length} estudiantes registrados con un puntaje promedio del ${avg}%. La distribución de notas es consistente.`;
        } else {
          responseText = 'Aún no hay estudiantes registrados para calcular métricas de evaluación.';
        }
      } else if (lowerPrompt.includes('moderation') || lowerPrompt.includes('foro')) {
        responseText =
          'Hay 2 dudas abiertas en el foro de "Glucólisis". He redactado un borrador de explicación biológica paso a paso para tu validación.';
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
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
