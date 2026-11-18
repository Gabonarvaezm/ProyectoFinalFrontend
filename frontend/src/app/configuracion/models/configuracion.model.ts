export type AppTheme = 'light' | 'dark';
export type AiTone = 'detailed' | 'concise' | 'socratic';
export type FontSizePreference = 'sm' | 'base' | 'lg';
export type ConfigSectionId = 'cuenta' | 'apariencia' | 'ia' | 'notificaciones';

export interface UserPreferences {
  theme: AppTheme;
  emailNotifications: boolean;
  forumReplyNotifications: boolean;
  examAlerts: boolean;
  weeklyAiSummary: boolean;
  aiTone: AiTone;
  aiAutoSuggestions: boolean;
  fontSize: FontSizePreference;
  reduceMotion: boolean;
}

export interface ConfigSection {
  id: ConfigSectionId;
  label: string;
  icon: string;
  description: string;
}

export interface AccountProfileInfo {
  fullName: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  institution: string;
}

