export interface ChatbotConfigurationOptions {
  startDirectory?: string;
  environment?: NodeJS.ProcessEnv;
}

export interface ChatbotConfiguration {
  apiKey: string;
  model: string;
}

export function loadChatbotConfiguration(options?: ChatbotConfigurationOptions): ChatbotConfiguration;
