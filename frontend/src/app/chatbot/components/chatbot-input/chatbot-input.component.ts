import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChatbotAcademicMode, QuickPrompt } from '../../models/chatbot.model';

@Component({
  selector: 'app-chatbot-input',
  imports: [ReactiveFormsModule],
  templateUrl: './chatbot-input.component.html',
  styleUrl: './chatbot-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

