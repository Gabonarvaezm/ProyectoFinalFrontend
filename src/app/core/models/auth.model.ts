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
