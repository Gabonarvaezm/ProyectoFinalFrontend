import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChatbotMessage } from '../../models/chatbot.model';

@Component({
  selector: 'app-chatbot-messages',
  imports: [DatePipe],
  templateUrl: './chatbot-messages.component.html',
  styleUrl: './chatbot-messages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

