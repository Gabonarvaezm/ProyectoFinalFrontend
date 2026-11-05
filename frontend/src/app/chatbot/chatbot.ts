import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  private readonly destroyRef = inject(DestroyRef);
  private timerIds: ReturnType<typeof setTimeout>[] = [];

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

  // ── Sesiones Archivadas de Consulta ──────────────────────────────────────
  public readonly sessions = signal<ChatSession[]>([
    {
      id: 'session-1',
      title: 'Dudas de Cálculo Integral',
      lastMessage: 'Excelente, ahora entiendo la sustitución trigonométrica.',
      updatedAt: new Date(Date.now() - 3600000),
      messageCount: 4,
    },
    {
      id: 'session-2',
      title: 'Biología Celular y Mitosis',
      lastMessage: 'Resumen de metafase y anafase completado.',
      updatedAt: new Date(Date.now() - 86400000),
      messageCount: 6,
    },
    {
      id: 'session-3',
      title: 'Historia del Arte Barroco',
      lastMessage: 'Referencias de Gombrich consultadas.',
      updatedAt: new Date(Date.now() - 172800000),
      messageCount: 3,
    },
  ]);

  // ── Estado Central Gestionado por el Componente Padre (Signals) ──────────
  public readonly activeSessionId = signal<string>('session-1');
  public readonly activeMode = signal<ChatbotAcademicMode>('tutor');
  public readonly isThinking = signal<boolean>(false);
  public readonly toastMessage = signal<string | null>(null);

  /** Mensajes del Hilo Activo */
  public readonly messages = signal<ChatbotMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: '¡Hola! Soy DiscerIA Context AI, tu asistente pedagógico inteligente. ¿En qué tema o ejercicio académico puedo colaborar hoy?',
      timestamp: new Date(Date.now() - 600000),
      mode: 'tutor',
      academicSources: [
        'DiscerIA Corpus Pedagógico Universitario (2026)',
        'Repositorio Digital Abierto de Educación Superior',
      ],
    },
    {
      id: 'msg-init-2',
      sender: 'user',
      text: '¿Podrías explicarme brevemente la diferencia fundamental entre mitosis y meiosis?',
      timestamp: new Date(Date.now() - 500000),
    },
    {
      id: 'msg-init-3',
      sender: 'ai',
      text: 'Con gusto. La diferencia medular radica en el objetivo biológico y el número de células resultantes:\n\n1. **Mitosis**: Ocurre en células somáticas. Una célula madre diploide (2n) genera **dos células hijas genéticamente idénticas (2n)**. Su propósito es el crecimiento, reparación y regeneración tisular.\n\n2. **Meiosis**: Proceso exclusivo de células germinales para la gametogénesis. Una célula diploide (2n) atraviesa dos divisiones consecutivas dando origen a **cuatro células haploides (n)**, con recombinación genética (crossing-over), garantizando la diversidad biológica.',
      timestamp: new Date(Date.now() - 400000),
      mode: 'tutor',
      academicSources: [
        'Alberts, B., et al. (2015). Molecular Biology of the Cell (6ta ed.). Garland Science.',
        'Campbell, N. A., & Reece, J. B. (2018). Biología General.',
      ],
    },
  ]);

  // ── Señal Computada para la etiqueta del modo activo ─────────────────────
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

    // 3. Simulación de respuesta inteligente contextual según el modo
    const currentMode = this.activeMode();
    const timer = setTimeout(() => {
      const aiResponse = this.generateAiAcademicResponse(text, currentMode);
      this.messages.update((prev) => [...prev, aiResponse]);
      this.isThinking.set(false);

      // Actualizar metadatos de la sesión activa
      this.updateActiveSessionMetadata(text);
    }, 750);

    this.timerIds.push(timer);
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
    this.activeSessionId.set(sessionId);
    const session = this.sessions().find((s) => s.id === sessionId);
    if (session) {
      this.showToast(`Cargando conversación: "${session.title}"`);
    }
  }

  public handleNewChat(): void {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nueva Consulta Académica',
      lastMessage: 'Conversación iniciada',
      updatedAt: new Date(),
      messageCount: 1,
    };

    this.sessions.update((prev) => [newSession, ...prev]);
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

  private generateAiAcademicResponse(
    query: string,
    mode: ChatbotAcademicMode
  ): ChatbotMessage {
    const lower = query.toLowerCase();

    if (mode === 'exam-generator' || lower.includes('examen') || lower.includes('preguntas')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Aquí tienes una evaluación formativa de 3 preguntas basada en tu solicitud:\n\n**Pregunta 1:** ¿Cuál es la principal característica de una función continua en un intervalo cerrado [a, b]?\na) Posee asíntotas verticales.\nb) Alcanza un valor máximo y mínimo absoluto (Teorema de Weierstrass).\nc) Su derivada siempre existe en todos los puntos.\n*Respuesta correcta: b*\n\n**Pregunta 2:** En el cálculo de integrales por partes, la fórmula fundamental se deriva de:\na) La regla de la cadena.\nb) La regla del producto para derivadas.\nc) El teorema de Taylor.\n*Respuesta correcta: b*\n\n**Pregunta 3:** ¿Qué ocurre durante la profase mitótica?\na) Los cromosomas se alinean en el ecuador.\nb) La cromatina se condensa y desaparece la envoltura nuclear.\nc) Se divide el citoplasma.\n*Respuesta correcta: b*`,
        timestamp: new Date(),
        mode: 'exam-generator',
        academicSources: [
          'Stewart, J. (2016). Cálculo Trascendentes Tempranas (8va ed.).',
          'Karp, G. (2014). Biología Celular y Molecular (7ma ed.).',
        ],
      };
    }

    if (mode === 'step-by-step' || lower.includes('paso a paso') || lower.includes('ejercicio') || lower.includes('integral')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Demostración y resolución analítica paso a paso:\n\n**Paso 1: Identificación y Regla LIATE**\nDefinimos los componentes para aplicar ∫ u dv = u·v - ∫ v du.\n• u = x  ==>  du = dx\n• dv = e^(2x) dx  ==>  v = (1/2) e^(2x)\n\n**Paso 2: Aplicación de la fórmula**\n∫ x e^(2x) dx = (1/2) x e^(2x) - ∫ (1/2) e^(2x) dx\n\n**Paso 3: Integración del término remanente**\n= (1/2) x e^(2x) - (1/4) e^(2x) + C\n\n**Resultado factorizado:**\n= (1/2) e^(2x) [ x - 1/2 ] + C`,
        timestamp: new Date(),
        mode: 'step-by-step',
        codeSnippet: `// Comprobación simbólica en TypeScript / JavaScript:
function verifyDerivative(x: number): number {
  // Derivada de F(x) = (1/2)*x*e^(2x) - (1/4)*e^(2x)
  // F'(x) = (1/2)*e^(2x) + x*e^(2x) - (1/2)*e^(2x) = x*e^(2x)
  return x * Math.exp(2 * x);
}`,
        academicSources: [
          'Larson, R., & Edwards, B. (2018). Cálculo tomo I. McGraw-Hill.',
        ],
      };
    }

    if (mode === 'bibliography' || lower.includes('libro') || lower.includes('fuente') || lower.includes('bibliografia')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Referencias bibliográficas recomendadas en el repositorio institucional de DiscerIA:\n\n1. **Cálculo de una Variable: Trascendentes Tempranas**\n   • Autor: James Stewart (8va edición)\n   • Editorial: Cengage Learning\n   • Enlace: Disponible en /biblioteca (Materia: Matemáticas)\n\n2. **Molecular Biology of the Cell**\n   • Autores: Bruce Alberts et al. (6ta edición)\n   • Editorial: Garland Science\n   • Enlace: Disponible en /biblioteca (Materia: Ciencias)`,
        timestamp: new Date(),
        mode: 'bibliography',
        academicSources: [
          'Catálogo General Biblioteca Digital Universitaria DiscerIA (2026)',
        ],
      };
    }

    // Modo Tutor Académico General
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Excelente planteamiento. Respecto a tu duda:\n\nPara abordar este problema con solidez, es fundamental distinguir las premisas teóricas del marco aplicativo. Al analizar los datos bajo una perspectiva sistemática, logramos simplificar variables complejas y validar los axiomas de partida.\n\n¿Deseas que resolvamos un ejemplo aplicado, generemos preguntas de autoevaluación o verifiquemos las fuentes bibliográficas correspondientes?`,
      timestamp: new Date(),
      mode: 'tutor',
      academicSources: [
        'DiscerIA Research Framework (2026)',
        'Guía Docente de Aprendizaje Guiado',
      ],
    };
  }

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
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    const timer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
