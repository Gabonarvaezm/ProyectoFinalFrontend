export const STORAGE_KEYS = {
  REGISTERED_USER: 'disceria_registered_user',
  USER_EMAIL: 'disceria_user_email',
  REMEMBERED_EMAIL: 'disceria_remembered_email',
  STUDENTS: 'disceria_profesor_students',
} as const;

export interface RegisteredUserData {
  fullName: string;
  email: string;
  institution: string;
  role: 'student' | 'professor' | 'admin';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'student' | 'professor' | 'admin';
  institution?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  primary?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}
