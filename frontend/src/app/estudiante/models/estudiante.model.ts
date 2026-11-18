export interface LibrarySubject {
  id: string;
  name: string;
  topic: string;
  icon: string;
  badgeBg: string;
  iconColor: string;
  weeklyProgress: number; // 0–100 — progreso semanal de cada materia
}

export interface ForumQuestion {
  id: string;
  title: string;
  tagText: string;
  tagClass: 'badge-teacher' | 'badge-students';
  tagIcon: string;
  timeAgo: string;
  subject: string;
  authorName: string;
  avatar: string;
  avatarFallbackBg: string;
  avatarFallbackColor: string;
  initials: string;
}

export interface PracticeExam {
  title: string;
  topic: string;
  questionsCount: number;
  difficulty: string;
}

export interface WeeklyProgressItem {
  subject: string;      // Etiqueta corta (3 letras)
  subjectId: string;    // ID para vincular con LibrarySubject
  fullName: string;     // Nombre completo de la materia
  percentage: number;   // 0–100
  iconColor: string;    // Color del ícono de la materia
  highlighted: boolean; // true si está seleccionada o no hay selección activa
}

export interface ActiveCourse {
  title: string;
  category: string;
  progress: number;
}

export type StudentNotificationFilter = 'all' | 'unread' | 'tasks' | 'forums';

export interface StudentNotification {
  id: string;
  type: 'task' | 'forum_reply' | 'teacher_announcement' | 'exam';
  title: string;
  message: string;
  authorName: string;
  authorRole: 'professor' | 'student' | 'system';
  authorInitials: string;
  authorAvatar?: string;
  timeAgo: string;
  read: boolean;
  subject?: string;
  actionRoute?: string;
}

