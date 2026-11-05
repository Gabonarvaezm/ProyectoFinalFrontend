import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiSuggestion, ChatMessage } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-ai-chat',
  imports: [FormsModule],
  template: `
    <aside
      class="ai-assistant-panel"
      [class.drawer-open]="isOpen()"
      role="region"
      aria-label="Asistente de Inteligencia Artificial"
    >
      <div class="ai-header">
        <div class="ai-header-titles-wrap">
          <div class="ai-icon-box">
            <i class="bi bi-robot" aria-hidden="true"></i>
          </div>
          <div class="ai-title-wrapper">
            <h2 class="ai-title">Asistente Docente IA</h2>
            <span class="ai-subtitle">Copiloto Inteligente DiscerIA</span>
          </div>
        </div>
        <button
          type="button"
          class="btn-close-drawer"
          (click)="closeRequested.emit()"
          aria-label="Cerrar panel de Asistente IA"
          title="Cerrar Asistente"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="ai-body">
        <!-- Tarjeta de Sugerencias Rápidas -->
        <div class="suggestions-card">
          <h3 class="suggestions-prompt">¿En qué puedo asistirte hoy?</h3>

          <div class="suggestions-list">
            @for (sug of aiSuggestions(); track sug.id) {
              <button
                type="button"
                class="btn-suggestion"
                (click)="suggestionSelected.emit(sug)"
                [disabled]="isAiThinking()"
              >
                <i [class]="sug.icon" aria-hidden="true"></i>
                <span>{{ sug.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Historial de Conversación con el Asistente -->
        <div class="chat-thread" aria-live="polite">
          @for (msg of chatMessages(); track msg.id) {
            <div class="chat-bubble" [class]="msg.sender">
              <div class="bubble-sender-name">
                {{ msg.sender === 'user' ? 'Tú' : 'Asistente IA' }}
              </div>
              <p class="bubble-text">{{ msg.text }}</p>
            </div>
          }

          @if (isAiThinking()) {
            <div class="chat-bubble ai thinking" aria-label="El asistente está redactando una respuesta">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          }
        </div>
      </div>

      <!-- Barra de Entrada del Chat con IA -->
      <div class="ai-footer">
        <form class="ai-input-form" (ngSubmit)="onSubmit()">
          <input
            #chatInput
            type="text"
            class="ai-input"
            placeholder="Pregunta a la IA sobre tus alumnos..."
            [value]="inputText()"
            (input)="inputText.set(chatInput.value)"
            name="chatText"
            [disabled]="isAiThinking()"
            aria-label="Pregunta al Asistente del Profesor"
            autocomplete="off"
          />
          <button
            type="submit"
            class="btn-ai-send"
            [disabled]="!inputText().trim() || isAiThinking()"
            aria-label="Enviar mensaje a la IA"
            title="Enviar"
          >
            <i class="bi bi-send" aria-hidden="true"></i>
          </button>
        </form>
      </div>
    </aside>
  `,
  styles: [`
    .ai-assistant-panel {
      width: 0;
      min-width: 0;
      background-color: var(--color-bg-surface);
      border-left: none;
      display: flex;
      flex-direction: column;
      padding: 0;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 100;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: width var(--duration-normal) cubic-bezier(0.16, 1, 0.3, 1),
                  opacity var(--duration-fast) var(--ease-out-expo),
                  padding var(--duration-fast) var(--ease-out-expo),
                  border-left var(--duration-fast) var(--ease-out-expo);

      &.drawer-open {
        width: 380px;
        min-width: 380px;
        padding: var(--space-5) var(--space-4) var(--space-4);
        opacity: 1;
        pointer-events: auto;
        border-left: 1px solid var(--color-border);
        box-shadow: -6px 0 24px rgba(15, 23, 42, 0.06);
      }

      @media (max-width: 1200px) {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: 100%;
        max-width: 380px;
        transform: translateX(100%);
        opacity: 0;
        box-shadow: -8px 0 32px rgba(15, 23, 42, 0.15);

        &.drawer-open {
          transform: translateX(0);
          opacity: 1;
          width: 100%;
          min-width: 0;
          padding: var(--space-4);
        }
      }
    }

    .ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);

      .ai-header-titles-wrap {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .btn-close-drawer {
        background: transparent;
        border: none;
        color: var(--color-slate-400);
        width: 32px;
        height: 32px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1rem;
        transition: var(--transition-fast);

        &:hover {
          background-color: var(--color-slate-100);
          color: var(--color-slate-700);
        }
      }

      .ai-icon-box {
        width: 38px;
        height: 38px;
        background: var(--color-ai-gradient);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-white);
        font-size: 1.15rem;
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.28);
      }

      .ai-title {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-slate-900);
        margin: 0;
      }

      .ai-subtitle {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }
    }

    .ai-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4) 0;
      overflow-y: auto;
    }

    .suggestions-card {
      background-color: var(--color-ai-50);
      border: 1px solid var(--color-ai-300);
      border-radius: var(--radius-lg);
      padding: var(--space-4);

      .suggestions-prompt {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-ai-700);
        margin: 0 0 var(--space-3);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .btn-suggestion {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-primary-700);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        padding: 0.4rem 0.6rem;
        border-radius: var(--radius-sm);
        background: var(--color-white);
        border: 1px solid var(--color-border);
        text-align: left;
        transition: var(--transition-fast);

        &:hover:not(:disabled) {
          border-color: var(--color-primary-500);
          color: var(--color-primary-800);
          transform: translateX(2px);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .chat-thread {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);

      .chat-bubble {
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg);
        max-width: 90%;
        line-height: var(--line-height-base);
        font-size: var(--font-size-sm);

        .bubble-sender-name {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--space-1);
        }

        .bubble-text {
          margin: 0;
        }

        &.user {
          align-self: flex-end;
          background-color: var(--color-primary-700);
          color: var(--color-white);
          border-bottom-right-radius: var(--radius-xs);

          .bubble-sender-name {
            color: var(--color-primary-200);
          }
        }

        &.ai {
          align-self: flex-start;
          background-color: var(--color-slate-100);
          color: var(--color-slate-900);
          border-bottom-left-radius: var(--radius-xs);

          .bubble-sender-name {
            color: var(--color-ai-600);
          }
        }

        &.thinking {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.75rem 1rem;

          .dot {
            width: 6px;
            height: 6px;
            background-color: var(--color-ai-500);
            border-radius: 50%;
            animation: pulse 1s infinite alternate;

            &:nth-child(2) {
              animation-delay: 0.2s;
            }
            &:nth-child(3) {
              animation-delay: 0.4s;
            }
          }
        }
      }
    }

    @keyframes pulse {
      0% {
        opacity: 0.3;
        transform: translateY(0);
      }
      100% {
        opacity: 1;
        transform: translateY(-2px);
      }
    }

    .ai-footer {
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);

      .ai-input-form {
        position: relative;
        display: flex;
        align-items: center;
      }

      .ai-input {
        width: 100%;
        padding: 0.65rem 2.6rem 0.65rem 0.875rem;
        background-color: var(--color-slate-50);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-slate-900);
        outline: none;
        transition: var(--transition-fast);

        &::placeholder {
          color: var(--color-slate-400);
        }

        &:focus {
          background-color: var(--color-bg-surface);
          border-color: var(--color-primary-600);
          box-shadow: var(--focus-ring);
        }
      }

      .btn-ai-send {
        position: absolute;
        right: 0.5rem;
        background: transparent;
        border: none;
        color: var(--color-primary-600);
        cursor: pointer;
        font-size: 1.05rem;
        padding: 0.35rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition-fast);

        &:hover:not(:disabled) {
          color: var(--color-primary-800);
          transform: scale(1.1);
        }

        &:disabled {
          color: var(--color-slate-300);
          cursor: not-allowed;
        }
      }
    }
  `],
})
export class ProfesorAiChatComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly chatMessages = input.required<readonly ChatMessage[]>();
  public readonly aiSuggestions = input.required<readonly AiSuggestion[]>();
  public readonly isAiThinking = input.required<boolean>();

  public readonly inputText = model<string>('');

  public readonly suggestionSelected = output<AiSuggestion>();
  public readonly messageSubmitted = output<string>();
  public readonly closeRequested = output<void>();

  public onSubmit(): void {
    const text = this.inputText().trim();
    if (!text || this.isAiThinking()) return;
    this.messageSubmitted.emit(text);
    this.inputText.set('');
  }
}
