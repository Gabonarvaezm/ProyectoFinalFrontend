export type ChatbotSender = 'user' | 'ai' | 'system';

export type ChatbotAcademicMode = 'tutor' | 'exam-generator' | 'step-by-step' | 'bibliography';

export interface ChatbotMessage {
  readonly id: string;
  readonly sender: ChatbotSender;
  readonly text: string;
  readonly timestamp: Date;
  readonly mode?: ChatbotAcademicMode;
  readonly academicSources?: readonly string[];
  readonly codeSnippet?: string;
}

export interface ChatSession {
  readonly id: string;
  readonly title: string;
  readonly lastMessage: string;
  readonly updatedAt: Date;
  readonly messageCount: number;
}

export interface QuickPrompt {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly promptText: string;
  readonly category: string;
}

export interface ModeOption {
  readonly id: ChatbotAcademicMode;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export interface SendMessagePayload {
  readonly text: string;
  readonly mode: ChatbotAcademicMode;
}

