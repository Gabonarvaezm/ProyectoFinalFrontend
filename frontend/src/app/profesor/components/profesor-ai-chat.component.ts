import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiSuggestion, ChatMessage } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-ai-chat',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="ai-assistant-panel" aria-label="Asistente de Inteligencia Artificial">
      <div class="ai-header">
        <div class="ai-icon-box">
          <i class="bi bi-robot" aria-hidden="true"></i>
        </div>
        <div class="ai-title-wrapper">
          <h2 class="ai-title">Asistente del Profesor</h2>
          <span class="ai-subtitle">Soporte con IA</span>
        </div>
      </div>

      <div class="ai-body">
        <!-- Tarjeta de Sugerencias Rápidas -->
        <div class="suggestions-card">
          <h3 class="suggestions-prompt">¿En qué puedo ayudarte hoy?</h3>

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
            placeholder="Pregunta a la IA..."
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
      width: 320px;
      min-width: 320px;
      background-color: #fff;
      border-left: 1px solid #e5eaf2;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1.25rem 1.25rem;
      height: 100vh;
      position: sticky;
      top: 0;

      @media (max-width: 1200px) {
        width: 100%;
        min-width: 100%;
        height: auto;
        position: static;
        border-left: none;
        border-top: 1px solid #e5eaf2;
      }
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #f1f5f9;

      .ai-icon-box {
        width: 36px;
        height: 36px;
        background-color: #0d59e3;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 1.1rem;
      }

      .ai-title {
        font-size: 0.98rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .ai-subtitle { font-size: 0.75rem; color: #64748b; }
    }

    .ai-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.25rem 0;
      overflow-y: auto;
    }

    .suggestions-card {
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;

      .suggestions-prompt {
        font-size: 0.85rem;
        font-weight: 500;
        color: #475569;
        margin: 0 0 0.85rem;
      }

      .suggestions-list { display: flex; flex-direction: column; gap: 0.65rem; }

      .btn-suggestion {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        color: #1053d4;
        font-size: 0.825rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0.2rem 0;
        background: transparent;
        border: none;
        text-align: left;

        &:hover:not(:disabled) { color: #0b3fa8; text-decoration: underline; }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }
    }

    .chat-thread {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.84rem;

      .chat-bubble {
        padding: 0.65rem 0.85rem;
        border-radius: 8px;
        max-width: 90%;
        line-height: 1.4;

        .bubble-sender-name {
          font-size: 0.7rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }

        .bubble-text { margin: 0; }

        &.user {
          align-self: flex-end;
          background-color: #1d4ed8;
          color: #fff;
          .bubble-sender-name { color: #bfdbfe; }
        }

        &.ai {
          align-self: flex-start;
          background-color: #f1f5f9;
          color: #1e293b;
          .bubble-sender-name { color: #64748b; }
        }

        &.thinking {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.75rem 1rem;

          .dot {
            width: 6px;
            height: 6px;
            background-color: #64748b;
            border-radius: 50%;
            animation: pulse 1s infinite alternate;

            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }
        }
      }
    }

    @keyframes pulse {
      0% { opacity: 0.3; transform: translateY(0); }
      100% { opacity: 1; transform: translateY(-2px); }
    }

    .ai-footer {
      padding-top: 0.75rem;

      .ai-input-form { position: relative; display: flex; align-items: center; }

      .ai-input {
        width: 100%;
        padding: 0.7rem 2.5rem 0.7rem 0.9rem;
        background-color: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.85rem;
        color: #0f172a;
        outline: none;

        &::placeholder { color: #94a3b8; }
        &:focus {
          border-color: #1053d4;
          box-shadow: 0 0 0 2px rgba(16, 83, 212, 0.15);
        }
      }

      .btn-ai-send {
        position: absolute;
        right: 0.5rem;
        background: transparent;
        border: none;
        color: #1053d4;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.3rem;
        display: flex;
        align-items: center;
        justify-content: center;

        &:disabled { color: #cbd5e1; cursor: not-allowed; }
      }
    }
  `],
})
export class ProfesorAiChatComponent {
  public readonly chatMessages = input.required<readonly ChatMessage[]>();
  public readonly aiSuggestions = input.required<readonly AiSuggestion[]>();
  public readonly isAiThinking = input.required<boolean>();

  public readonly inputText = model<string>('');

  public readonly suggestionSelected = output<AiSuggestion>();
  public readonly messageSubmitted = output<string>();

  public onSubmit(): void {
    const text = this.inputText().trim();
    if (!text || this.isAiThinking()) return;
    this.messageSubmitted.emit(text);
    this.inputText.set('');
  }
}
