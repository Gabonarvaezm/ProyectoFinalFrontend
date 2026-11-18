import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiSuggestion, ChatMessage } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-ai-chat',
  imports: [FormsModule],
  templateUrl: './profesor-ai-chat.component.html',
  styleUrl: './profesor-ai-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorAiChatComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly chatMessages = input.required<readonly ChatMessage[]>();
  public readonly aiSuggestions = input.required<readonly AiSuggestion[]>();
  public readonly errorMessage = input<string | null>(null);
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

