import { ActionToastComponent } from '../shared/components/action-toast/action-toast.component';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatbotService } from '../core/services/chatbot.service';
import { AuthService } from '../core/services/auth.service';
import {
  ChatSession,
  ChatbotAcademicMode,
  ChatbotMessage,
  ModeOption,
  QuickPrompt,
} from './models/chatbot.model';
import {
  ChatbotInputComponent,
  ChatbotMessagesComponent,
  ChatbotSidebarComponent,
} from './components';

@Component({
  imports: [
    ActionToastComponent,
    ReactiveFormsModule,
    RouterLink,
    ChatbotSidebarComponent,
    ChatbotMessagesComponent,
    ChatbotInputComponent,
  ],
  selector: 'app-chatbot',
  styleUrl: './chatbot.scss',
  templateUrl: './chatbot.html',
})
export class Chatbot {
  private readonly fb = inject(FormBuilder);
  private readonly chatbotService = inject(ChatbotService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  public readonly dashboardRoute = this.authService.dashboardRoute;
  public readonly dashboardLabel = computed(() =>
    this.authService.isProfessor() ? 'Portal Profesor' : 'Portal Estudiante'
  );

  // ── Modos Académicos Disponibles ─────────────────────────────────────────
  public readonly modes = signal<ModeOption[]>([
    {
      id: 'tutor',
      label: 'Tutor Académico',
      description: 'Consultas conceptuales y explicaciones guiadas',
      icon: 'bi bi-mortarboard-fill',
    },
    {
      id: 'step-by-step',
      label: 'Paso a Paso',
      description: 'Resolución analítica de problemas y ejercicios',
      icon: 'bi bi-diagram-3-fill',
    },
    {
      id: 'exam-generator',
      label: 'Generador de Exámenes',
      description: 'Preguntas tipo test y problemas de práctica',
      icon: 'bi bi-card-checklist',
    },
    {
      id: 'bibliography',
      label: 'Búsqueda Bibliográfica',
      description: 'Citas y referencias en libros universitarios',
      icon: 'bi bi-book-half',
    },
  ]);

  // ── Prompts Rápidos Sugeridos ────────────────────────────────────────────
  public readonly quickPrompts = signal<QuickPrompt[]>([
    {
      id: 'p-1',
      label: 'Resumir Mitosis',
      icon: 'bi bi-virus',
      promptText: 'Explica de forma resumida las fases de la mitosis celular y su importancia en los tejidos somáticos.',
      category: 'Biología',
    },
    {
      id: 'p-2',
      label: 'Regla LIATE (Integrales)',
      icon: 'bi bi-calculator-fill',
      promptText: '¿Cómo funciona la regla LIATE para resolver integrales por partes y cuándo conviene aplicarla?',
      category: 'Cálculo',
    },
    {
      id: 'p-3',
      label: 'Barroco vs Renacimiento',
      icon: 'bi bi-palette-fill',
      promptText: 'Compara las principales características arquitectónicas y teológicas entre el Renacimiento y el Barroco.',
      category: 'Historia',
    },
    {
      id: 'p-4',
      label: 'Simulacro de Examen',
      icon: 'bi bi-clipboard-check-fill',
      promptText: 'Genera un examen corto de 3 preguntas de opción múltiple con explicación sobre Cálculo Diferencial.',
      category: 'Evaluación',
    },
  ]);

  // ── Sesiones Archivadas de Consulta (Persistente con ChatbotService) ─────
  public readonly sessions = this.chatbotService.sessions;

  // ── Estado Central Gestionado por el Componente Padre (Signals) ──────────
  public readonly activeSessionId = signal<string>('session-1');
  public readonly activeMode = signal<ChatbotAcademicMode>('tutor');
  public readonly isThinking = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly toastMessage = signal<string | null>(null);

  /** Mensajes del Hilo Activo */
  public readonly messages = signal<ChatbotMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: '¡Hola! Soy DiscerIA. ¿Qué pregunta académica quieres explorar hoy?',
      timestamp: new Date(),
      mode: 'tutor',
    },
  ]);

  public readonly activeModeLabel = computed(() => {
    const current = this.modes().find((m) => m.id === this.activeMode());
    return current ? current.label : 'Tutor Académico';
  });

  // ── Formulario Reactivo con Validación Estricta ──────────────────────────
  public readonly chatForm: FormGroup = this.fb.group({
    message: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(2000),
      ],
    ],
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
    });
  }

  // ── Lógica Funcional: Envío y Recepción de Mensajes ──────────────────────

  public handleSendMessage(): void {
    if (this.chatForm.invalid || this.isThinking()) {
      this.chatForm.markAllAsTouched();
      return;
    }

    const rawMessage = this.chatForm.get('message')?.value as string;
    const text = rawMessage.trim();
    if (!text) return;

    // 1. Agregar mensaje del usuario inmutablemente
    const history = this.messages();
    this.errorMessage.set(null);
    const userMessage: ChatbotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    this.messages.update((prev) => [...prev, userMessage]);
    this.chatForm.reset({ message: '' });

    // 2. Activar estado de procesamiento / redacción de la IA
    this.isThinking.set(true);

    // 3. Envío al servicio de IA (API del servidor)
    const currentMode = this.activeMode();
    this.chatbotService
      .sendMessage(text, currentMode, history)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (aiResponse) => {
          this.messages.update((prev) => [...prev, aiResponse]);
          this.isThinking.set(false);
          this.updateActiveSessionMetadata(text);
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'No se pudo consultar la IA. Intenta de nuevo.';
          this.errorMessage.set(message);
          this.isThinking.set(false);
          this.chatForm.patchValue({ message: text });
        },
      });
  }

  public handlePromptSelected(prompt: QuickPrompt): void {
    this.chatForm.patchValue({ message: prompt.promptText });
    this.handleSendMessage();
  }

  public handleModeSelected(mode: ChatbotAcademicMode): void {
    this.activeMode.set(mode);
    const label = this.activeModeLabel();
    this.showToast(`Modo cambiado a: ${label}`);
  }

  public handleSessionSelected(sessionId: string): void {
    if (this.isThinking()) return;
    this.activeSessionId.set(sessionId);
    const session = this.sessions().find((s) => s.id === sessionId);
    if (session) {
      this.showToast(`Cargando conversación: "${session.title}"`);
    }
  }

  public handleNewChat(): void {
    if (this.isThinking()) return;
    this.errorMessage.set(null);
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nueva Consulta Académica',
      lastMessage: 'Conversación iniciada',
      updatedAt: new Date(),
      messageCount: 1,
    };

    this.sessions.update((prev) => [newSession, ...prev]);
    this.chatbotService.persistSessions(this.sessions());
    this.activeSessionId.set(newSessionId);
    this.messages.set([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: '¡Nueva sesión iniciada! Escribe tu consulta académica o selecciona uno de los prompts rápidos para comenzar.',
        timestamp: new Date(),
        mode: this.activeMode(),
      },
    ]);

    this.chatForm.reset({ message: '' });
    this.showToast('Nueva sesión de estudio creada.');
  }

  public handleClearHistory(): void {
    if (this.isThinking()) return;
    this.errorMessage.set(null);
    this.messages.set([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: 'El historial de esta sesión ha sido restablecido. ¿En qué tema deseas profundizar?',
        timestamp: new Date(),
        mode: this.activeMode(),
      },
    ]);
    this.showToast('Historial de mensajes reiniciado.');
  }

  public handleCopyText(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => this.showToast('¡Respuesta copiada al portapapeles!'),
        () => this.showToast('No se pudo copiar el texto.')
      );
    } else {
      this.showToast('Texto copiado.');
    }
  }

  public handleRetryPrompt(text: string): void {
    const excerpt = text.slice(0, 60).replace(/\n/g, ' ');
    const followUp = `Podrías profundizar más en el concepto de "${excerpt}..." aportando un ejemplo práctico adicional?`;
    this.chatForm.patchValue({ message: followUp });
  }

  // ── Motor Pedagógico Contextual de Respuestas ────────────────────────────

  private updateActiveSessionMetadata(lastUserText: string): void {
    const currentId = this.activeSessionId();
    this.sessions.update((list) =>
      list.map((sess) => {
        if (sess.id === currentId) {
          return {
            ...sess,
            lastMessage: lastUserText.slice(0, 45) + (lastUserText.length > 45 ? '...' : ''),
            updatedAt: new Date(),
            messageCount: sess.messageCount + 2,
          };
        }
        return sess;
      })
    );
    this.chatbotService.persistSessions(this.sessions());
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    const timer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
