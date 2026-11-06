import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatSession, ChatbotAcademicMode, ModeOption } from '../../models/chatbot.model';

@Component({
  selector: 'app-chatbot-sidebar',
  imports: [RouterLink],
  templateUrl: './chatbot-sidebar.component.html',
  styleUrl: './chatbot-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotSidebarComponent {
  public readonly sessions = input.required<readonly ChatSession[]>();
  public readonly activeSessionId = input.required<string>();
  public readonly activeMode = input.required<ChatbotAcademicMode>();
  public readonly modes = input.required<readonly ModeOption[]>();

  public readonly sessionSelected = output<string>();
  public readonly modeSelected = output<ChatbotAcademicMode>();
  public readonly newChatRequested = output<void>();
  public readonly clearHistoryRequested = output<void>();
}

