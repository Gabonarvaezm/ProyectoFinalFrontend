import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage, QuickAction } from '../../../core/models/auth.model';

@Component({
  selector: 'app-estudiante-ai-drawer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './estudiante-ai-drawer.component.html',
  styleUrl: './estudiante-ai-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteAiDrawerComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly chatMessages = input.required<readonly ChatMessage[]>();
  public readonly quickActions = input.required<readonly QuickAction[]>();
  public readonly isAiThinking = input<boolean>(false);
  public readonly inputText = model<string>('');

  public readonly closeRequested = output<void>();
  public readonly messageSubmitted = output<string>();
  public readonly quickActionTriggered = output<QuickAction>();

  public onSubmit(): void {
    const text = this.inputText().trim();
    if (!text || this.isAiThinking()) return;
    this.messageSubmitted.emit(text);
  }

  public onActionClick(action: QuickAction): void {
    this.quickActionTriggered.emit(action);
  }
}

