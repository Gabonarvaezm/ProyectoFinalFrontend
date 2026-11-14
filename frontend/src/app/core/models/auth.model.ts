export const STORAGE_KEYS = {
  ACTIVE_SESSION: 'disceria_active_session',
  AUTH_TOKEN: 'disceria_auth_token',
  REGISTERED_USER: 'disceria_registered_user',
  USER_EMAIL: 'disceria_user_email',
  REMEMBERED_EMAIL: 'disceria_remembered_email',
  STUDENTS: 'disceria_profesor_students',
  NOTIFICATIONS: 'disceria_profesor_notifications',
  BOOKS: 'disceria_academic_books',
  BOOKMARKS: 'disceria_academic_bookmarks',
  TAREAS: 'disceria_academic_tareas',
  FORUM_POSTS: 'disceria_academic_forum_posts',
  CHAT_SESSIONS: 'disceria_academic_chat_sessions',
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
  role?: 'student' | 'professor' | 'admin';
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
