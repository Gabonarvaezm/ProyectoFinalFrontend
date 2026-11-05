import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChatbotAcademicMode, QuickPrompt } from '../models/chatbot.model';

@Component({
  selector: 'app-chatbot-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <footer class="chatbot-input-footer" aria-label="Área de redacción de consulta">
      <!-- Píldoras de Prompts Rápidos Sugeridos -->
      <div class="quick-prompts-bar" role="group" aria-label="Sugerencias rápidas de consulta">
        <span class="prompts-kicker">
          <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
          <span>Sugerencias:</span>
        </span>
        <div class="prompts-scroll">
          @for (prompt of quickPrompts(); track prompt.id) {
            <button
              type="button"
              class="prompt-pill-btn"
              (click)="promptSelected.emit(prompt)"
              [title]="prompt.promptText"
            >
              <i [class]="prompt.icon" aria-hidden="true"></i>
              <span>{{ prompt.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Formulario Reactivo de Entrada -->
      <form [formGroup]="form()" (ngSubmit)="onSubmit()" class="input-form" novalidate>
        <div class="input-box-wrapper" [class.is-invalid]="isFieldInvalid()">
          <textarea
            #chatArea
            formControlName="message"
            class="chat-textarea"
            rows="2"
            placeholder="Pregúntale a DiscerIA sobre conceptos académicos, resolución de ejercicios o resúmenes... (Enter para enviar, Shift+Enter para salto de línea)"
            (keydown)="onKeydown($event)"
            [attr.aria-invalid]="isFieldInvalid() ? 'true' : null"
            [attr.aria-describedby]="isFieldInvalid() ? 'chat-input-error' : null"
            aria-label="Escribe tu consulta académica"
          ></textarea>

          <div class="input-actions-row">
            <div class="input-left-tools">
              <span class="char-counter" [class.warn]="currentLength() > 1800">
                {{ currentLength() }} / 2000
              </span>
            </div>

            <button
              type="submit"
              class="btn-send-message"
              [disabled]="form().invalid || isThinking()"
              aria-label="Enviar mensaje a la IA"
            >
              @if (isThinking()) {
                <span class="spinner-sm" aria-hidden="true"></span>
              } @else {
                <i class="bi bi-send-fill" aria-hidden="true"></i>
              }
            </button>
          </div>
        </div>

        @if (isFieldInvalid()) {
          <p id="chat-input-error" class="input-error-msg" role="alert">
            <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
            Por favor ingresa una consulta académica de al menos 2 caracteres (máximo 2000).
          </p>
        }
      </form>
    </footer>
  `,
  styles: [`
    .chatbot-input-footer {
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      padding: 1rem 2rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      position: sticky;
      bottom: 0;
      z-index: 20;

      @media (max-width: 768px) {
        padding: 0.75rem 1rem 1rem;
      }
    }

    .quick-prompts-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;

      .prompts-kicker {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }

      .prompts-scroll {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow-x: auto;
        scrollbar-width: none;
        &::-webkit-scrollbar { display: none; }
      }
    }

    .prompt-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      font-size: 0.785rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        background-color: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }
    }

    .input-form {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .input-box-wrapper {
      background-color: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s ease;

      &:focus-within {
        background-color: #ffffff;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      &.is-invalid {
        border-color: #ef4444;
        background-color: #fef2f2;
      }
    }

    .chat-textarea {
      width: 100%;
      border: none;
      background: transparent;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: 0.925rem;
      color: #0f172a;
      line-height: 1.5;
      min-height: 48px;
      max-height: 140px;

      &::placeholder {
        color: #94a3b8;
      }
    }

    .input-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .char-counter {
      font-size: 0.725rem;
      color: #94a3b8;
      font-weight: 500;

      &.warn {
        color: #d97706;
        font-weight: 700;
      }
    }

    .btn-send-message {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(29, 78, 216, 0.25);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(29, 78, 216, 0.35);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .input-error-msg {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.785rem;
      color: #dc2626;
      margin: 0;
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ChatbotInputComponent {
  public readonly form = input.required<FormGroup>();
  public readonly isThinking = input<boolean>(false);
  public readonly quickPrompts = input.required<readonly QuickPrompt[]>();
  public readonly activeMode = input.required<ChatbotAcademicMode>();

  public readonly submitMessage = output<void>();
  public readonly promptSelected = output<QuickPrompt>();

  public currentLength(): number {
    const val = this.form().get('message')?.value;
    return typeof val === 'string' ? val.length : 0;
  }

  public isFieldInvalid(): boolean {
    const ctrl = this.form().get('message');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  public onKeydown(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.key === 'Enter' && !kbEvent.shiftKey) {
      kbEvent.preventDefault();
      this.onSubmit();
    }
  }

  public onSubmit(): void {
    if (this.form().invalid || this.isThinking()) {
      this.form().markAllAsTouched();
      return;
    }
    this.submitMessage.emit();
  }
}

