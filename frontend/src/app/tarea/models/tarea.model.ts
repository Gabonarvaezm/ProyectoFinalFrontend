// ─────────────────────────────────────────────────────────────────────────────
// DiscerIA — Modelos del Módulo de Tareas Académicas
// ─────────────────────────────────────────────────────────────────────────────

export type TareaStatus = 'pendiente' | 'entregada' | 'calificada' | 'vencida';
export type TareaPriority = 'alta' | 'media' | 'baja';

export interface TareaSubmission {
  id: string;
  tareaId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  attachmentUrl?: string;
  comments?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
}

export interface Tarea {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  maxScore: number;
  priority: TareaPriority;
  assignedBy: string;
  assignedDate: string;
  status: TareaStatus;
  attachmentName?: string;
  submissionsCount: number;
  mySubmission?: TareaSubmission;
}

export interface CreateTareaDto {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  maxScore: number;
  priority: TareaPriority;
  attachmentName?: string;
}

export interface SubmitTareaDto {
  tareaId: string;
  content: string;
  attachmentUrl?: string;
  comments?: string;
}

export interface GradeTareaDto {
  tareaId: string;
  submissionId: string;
  grade: number;
  feedback: string;
}

export interface TareaFilterPayload {
  status: string;
  subject: string;
  searchQuery: string;
}

