import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChatbotMessage } from '../models/chatbot.model';

@Component({
  selector: 'app-chatbot-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div #scrollContainer class="messages-container" role="log" aria-live="polite" aria-label="Hilo de conversación del chatbot">
      <!-- Mensaje de bienvenida inicial -->
      <div class="welcome-banner">
        <div class="welcome-icon">
          <i class="bi bi-stars" aria-hidden="true"></i>
        </div>
        <h2 class="welcome-title">Asistente Inteligente DiscerIA</h2>
        <p class="welcome-desc">
          Modo actual: <strong>{{ activeModeLabel() }}</strong>. Haz preguntas académicas, solicita ejercicios de práctica,
          resúmenes o explicaciones paso a paso con respaldo bibliográfico.
        </p>
      </div>

      <!-- Hilo de mensajes -->
      <div class="chat-thread">
        @for (msg of messages(); track msg.id) {
          <article
            class="message-row"
            [class.user-row]="msg.sender === 'user'"
            [class.ai-row]="msg.sender === 'ai'"
          >
            <!-- Avatar -->
            <div class="avatar-col" aria-hidden="true">
              @if (msg.sender === 'ai') {
                <div class="ai-avatar">
                  <i class="bi bi-robot"></i>
                </div>
              } @else {
                <div class="user-avatar">
                  <i class="bi bi-person-fill"></i>
                </div>
              }
            </div>

            <!-- Contenido del Mensaje -->
            <div class="bubble-col">
              <div class="message-meta">
                <span class="sender-name">
                  {{ msg.sender === 'ai' ? 'DiscerIA Context AI' : 'Tú' }}
                </span>
                @if (msg.mode) {
                  <span class="mode-tag">{{ msg.mode.toUpperCase() }}</span>
                }
                <span class="msg-timestamp">{{ msg.timestamp | date:'shortTime' }}</span>
              </div>

              <div class="message-bubble" [class.bubble-user]="msg.sender === 'user'" [class.bubble-ai]="msg.sender === 'ai'">
                <p class="message-text">{{ msg.text }}</p>

                <!-- Bloque de Código si aplica -->
                @if (msg.codeSnippet) {
                  <div class="code-block-wrapper">
                    <pre class="code-pre"><code>{{ msg.codeSnippet }}</code></pre>
                  </div>
                }

                <!-- Citas y Fuentes Académicas -->
                @if (msg.academicSources && msg.academicSources.length > 0) {
                  <div class="academic-sources-box">
                    <div class="sources-header">
                      <i class="bi bi-journal-bookmark-fill" aria-hidden="true"></i>
                      <span>Referencias Académicas Validadas:</span>
                    </div>
                    <ul class="sources-list">
                      @for (source of msg.academicSources; track source) {
                        <li>{{ source }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>

              <!-- Barra de herramientas para mensajes de la IA -->
              @if (msg.sender === 'ai') {
                <div class="ai-actions-bar">
                  <button
                    type="button"
                    class="btn-action-tool"
                    (click)="copyText.emit(msg.text)"
                    title="Copiar respuesta al portapapeles"
                    aria-label="Copiar respuesta"
                  >
                    <i class="bi bi-clipboard" aria-hidden="true"></i>
                    <span>Copiar</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-tool"
                    (click)="retryPrompt.emit(msg.text)"
                    title="Pedir explicación complementaria"
                    aria-label="Pedir explicación complementaria"
                  >
                    <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
                    <span>Profundizar</span>
                  </button>
                </div>
              }
            </div>
          </article>
        }

        <!-- Indicador de pensamiento / redacción de la IA -->
        @if (isThinking()) {
          <article class="message-row ai-row thinking-row" aria-label="DiscerIA está procesando la respuesta">
            <div class="avatar-col" aria-hidden="true">
              <div class="ai-avatar pulse">
                <i class="bi bi-robot"></i>
              </div>
            </div>
            <div class="bubble-col">
              <div class="message-bubble bubble-ai thinking-bubble">
                <span class="thinking-text">DiscerIA está consultando el corpus académico</span>
                <div class="typing-dots" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background-color: #f8fafc;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;

      @media (max-width: 768px) {
        padding: 1rem;
      }
    }

    .welcome-banner {
      background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
      border: 1px solid #bfdbfe;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.05);

      .welcome-icon {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #6366f1);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.15rem;
      }

      .welcome-title {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      .welcome-desc {
        font-size: 0.875rem;
        color: #475569;
        max-width: 620px;
        margin: 0;
        line-height: 1.5;
      }
    }

    .chat-thread {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .message-row {
      display: flex;
      gap: 0.85rem;
      max-width: 85%;

      &.user-row {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      &.ai-row {
        align-self: flex-start;
      }

      @media (max-width: 768px) {
        max-width: 95%;
      }
    }

    .avatar-col {
      flex-shrink: 0;

      .ai-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #1d4ed8, #4f46e5);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.15rem;
        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: #0f172a;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
      }
    }

    .bubble-col {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-width: 0;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;

      .sender-name {
        font-weight: 700;
        color: #0f172a;
      }

      .mode-tag {
        background-color: #e0e7ff;
        color: #4338ca;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 700;
      }

      .msg-timestamp {
        color: #94a3b8;
      }
    }

    .message-bubble {
      padding: 1rem 1.25rem;
      border-radius: 14px;
      font-size: 0.925rem;
      line-height: 1.6;
      word-break: break-word;

      &.bubble-user {
        background-color: #1d4ed8;
        color: #ffffff;
        border-top-right-radius: 4px;
        box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2);

        .message-text {
          color: #ffffff;
          margin: 0;
        }
      }

      &.bubble-ai {
        background-color: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        border-top-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

        .message-text {
          color: #1e293b;
          margin: 0;
          white-space: pre-wrap;
        }
      }
    }

    .code-block-wrapper {
      margin-top: 0.75rem;
      background-color: #0f172a;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      overflow-x: auto;

      .code-pre {
        margin: 0;
        font-family: var(--font-family-code, monospace);
        font-size: 0.825rem;
        color: #38bdf8;
      }
    }

    .academic-sources-box {
      margin-top: 0.85rem;
      padding: 0.65rem 0.85rem;
      background-color: #f8fafc;
      border-left: 3px solid #2563eb;
      border-radius: 0 8px 8px 0;

      .sources-header {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.785rem;
        font-weight: 700;
        color: #1d4ed8;
        margin-bottom: 0.35rem;
      }

      .sources-list {
        margin: 0;
        padding-left: 1.2rem;
        font-size: 0.785rem;
        color: #475569;
        line-height: 1.45;
      }
    }

    .ai-actions-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;

      .btn-action-tool {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.45rem;
        border-radius: 4px;
        transition: all 0.15s ease;

        &:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    // Estilos de pensamiento de la IA
    .thinking-bubble {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #64748b;

      .thinking-text {
        font-size: 0.85rem;
        font-style: italic;
      }
    }

    .typing-dots {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #2563eb;
        animation: typingDot 1.4s infinite ease-in-out both;

        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }

    @keyframes typingDot {
      0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
  `],
})
export class ChatbotMessagesComponent {
  public readonly messages = input.required<readonly ChatbotMessage[]>();
  public readonly isThinking = input<boolean>(false);
  public readonly activeModeLabel = input<string>('Tutor Académico');

  public readonly copyText = output<string>();
  public readonly retryPrompt = output<string>();

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    effect(() => {
      // Auto-scroll hacia el fondo cuando llegan nuevos mensajes o cambia isThinking
      this.messages();
      this.isThinking();
      setTimeout(() => {
        const el = this.scrollContainer()?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 50);
    });
  }
}

