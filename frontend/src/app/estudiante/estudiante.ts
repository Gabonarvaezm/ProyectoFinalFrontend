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
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import {
  ChatMessage,
  NavItem,
  QuickAction,
  STORAGE_KEYS,
} from '../core/models/auth.model';
import { Biblioteca } from '../biblioteca/biblioteca';

export type { ChatMessage, NavItem, QuickAction };

export interface LibrarySubject {
  id: string;
  name: string;
  topic: string;
  icon: string;
  badgeBg: string;
  iconColor: string;
}

export interface ForumQuestion {
  id: string;
  title: string;
  tagText: string;
  tagClass: 'badge-teacher' | 'badge-students';
  tagIcon: string;
  timeAgo: string;
  subject: string;
  authorName: string;
  avatar: string;
  avatarFallbackBg: string;
  avatarFallbackColor: string;
  initials: string;
}

@Component({
  imports: [RouterLink, FormsModule, Biblioteca],
  selector: 'app-estudiante',
  styleUrl: './estudiante.scss',
  templateUrl: './estudiante.html',
})
export class Estudiante {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Navegación Lateral ───────────────────────────────────────────────────
  public readonly activeNav = signal<string>('dashboard');
  public readonly selectedSubjectCategory = signal<string | null>(null);

  public readonly navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill' },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book' },
    { id: 'asistente-ia', label: 'Asistente IA', icon: 'bi bi-robot' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text' },
    { id: 'progreso', label: 'Progreso', icon: 'bi bi-bar-chart' },
    { id: 'perfil', label: 'Perfil', icon: 'bi bi-person-circle' },
  ]);

  // ── Usuario y Búsqueda ───────────────────────────────────────────────────
  public readonly studentName = signal<string>('Alejandro');
  public readonly studentEmail = signal<string>('');
  public readonly studentInstitution = signal<string>('Institución Pública');
  public readonly searchQuery = signal<string>('');
  public readonly notificationsCount = signal<number>(2);

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
    },
    {
      id: 'cie',
      name: 'Ciencias',
      topic: 'Química Orgánica',
      icon: 'bi bi-eyedropper',
      badgeBg: '#fef7e0',
      iconColor: '#b06000',
    },
    {
      id: 'his',
      name: 'Historia',
      topic: 'Revolución Industrial',
      icon: 'bi bi-hourglass-split',
      badgeBg: '#fce8e6',
      iconColor: '#c5221f',
    },
    {
      id: 'len',
      name: 'Lengua',
      topic: 'Análisis Sintáctico',
      icon: 'bi bi-book-half',
      badgeBg: '#e8f0fe',
      iconColor: '#1a73e8',
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

  // ── Progreso Semanal ─────────────────────────────────────────────────────
  public readonly weeklyProgress = signal([
    { subject: 'Mat', percentage: 90 },
    { subject: 'Cie', percentage: 75 },
    { subject: 'His', percentage: 60 },
  ]);

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
    this.showToast(`Continuando: ${this.currentCourse().title}`);
  }

  public onStartExam(): void {
    this.showToast(`Iniciando ${this.practiceExam().title}: ${this.practiceExam().topic}`);
  }

  public onSelectSubject(subject: LibrarySubject): void {
    const catMap: Record<string, string> = {
      mat: 'matematicas',
      cie: 'ciencias',
      his: 'humanidades',
      len: 'lenguaje',
    };
    const category = catMap[subject.id] || subject.name;
    this.selectedSubjectCategory.set(category);
    this.activeNav.set('biblioteca');
    this.showToast(`Abriendo biblioteca: ${subject.name} - ${subject.topic}`);
  }

  public onViewAllLibrary(): void {
    this.selectedSubjectCategory.set(null);
    this.activeNav.set('biblioteca');
    this.showToast('Abriendo catálogo completo de la Biblioteca Digital');
  }

  public onViewAllForums(): void {
    this.activeNav.set('foros');
    this.showToast('Accediendo a todos los foros de discusión');
  }

  public onViewThread(question: ForumQuestion): void {
    this.showToast(`Abriendo hilo: "${question.title}"`);
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
      let reply = 'He analizado tu consulta con base en la biblioteca académica de DiscerIA.';
      const lower = promptText.toLowerCase();

      if (lower.includes('resumen') || lower.includes('biología') || lower.includes('mitosis')) {
        reply =
          'Resumen de Mitosis: Consta de 4 etapas clave (Profase, Metafase, Anafase y Telofase), asegurando que cada célula hija reciba una dotación cromosómica completa (2n). La Meiosis, en cambio, reduce los cromosomas a la mitad (n) para formar gametos.';
      } else if (lower.includes('examen') || lower.includes('preguntas')) {
        reply =
          'Pregunta 1: ¿En qué fase de la mitosis se alinean los cromosomas en el ecuador celular?\nA) Anafase\nB) Metafase\nC) Telofase\nResponde para validar tu respuesta.';
      } else if (lower.includes('profase') || lower.includes('diferencia')) {
        reply =
          'En la Profase la cromatina se condensa en cromosomas visibles y la membrana nuclear se desintegra. En la Metafase los cromosomas ya están alineados en la placa ecuatorial listos para separarse.';
      } else if (lower.includes('integral') || lower.includes('partes') || lower.includes('matemática')) {
        reply =
          'La fórmula de integración por partes es: ∫ u dv = u·v - ∫ v du. Elige "u" usando el método ILATE (Inversas, Logarítmicas, Algebraicas, Trigonométricas, Exponenciales).';
      }

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
