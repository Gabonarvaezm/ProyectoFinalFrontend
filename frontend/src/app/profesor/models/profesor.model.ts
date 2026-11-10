import type {
  ChatMessage,
  NavItem,
  QuickAction,
} from '../../core/models/auth.model';

export type { ChatMessage, NavItem, QuickAction };

export type StudentStatus = 'active' | 'needs-attention' | 'completed';

export interface StudentProgress {
  id: string;
  studentName: string;
  email?: string;
  topic: string;
  score: number; // 0 to 100
  status: StudentStatus;
  statusLabel: string;
  registeredAt?: Date | string;
}

export interface CreateStudentDto {
  studentName: string;
  email: string;
  topic: string;
  score: number;
  status: StudentStatus;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number | string;
  icon: string;
  variant: 'blue' | 'purple' | 'amber';
}

export interface RecentActivity {
  id: string;
  description: string;
  studentOrContext?: string;
  timeAgo: string;
  icon: string;
  iconType: 'blue' | 'purple';
}

export interface AiSuggestion {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

// ── Tipos y Modelos del Sistema de Notificaciones Docente ────────────────────

export type NotificationType =
  | 'student_reply'      // Estudiante respondió a foros, tareas o dudas
  | 'teacher_post'       // Docente colega publicó material o recursos
  | 'academic_alert'     // Alerta de progreso académico o evaluación
  | 'institutional';     // Comunicados de la institución educativa

export type NotificationRole = 'student' | 'professor' | 'system';

export type NotificationFilter = 'all' | 'unread' | 'students' | 'teachers';

export interface TeacherNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  read: boolean;
  authorName: string;
  authorRole: NotificationRole;
  authorInitials: string;
  category: string;
  actionLabel?: string;
  actionRoute?: string;
}
