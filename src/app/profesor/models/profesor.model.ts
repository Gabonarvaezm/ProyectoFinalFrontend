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

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  primary?: boolean;
}

export interface AiSuggestion {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
}
