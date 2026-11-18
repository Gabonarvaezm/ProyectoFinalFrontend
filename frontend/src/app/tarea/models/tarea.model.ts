// ─────────────────────────────────────────────────────────────────────────────
// DiscerIA — Modelos del Módulo de Tareas Académicas
// ─────────────────────────────────────────────────────────────────────────────

export type TareaStatus = 'pendiente' | 'en_progreso' | 'entregada' | 'en_revision' | 'calificada' | 'requiere_correccion' | 'vencida';
export type TareaPriority = 'alta' | 'media' | 'baja';

export interface TareaSubmission {
  history?: { content: string; grade?: number; feedback?: string; submittedAt?: string; updatedAt?: string }[];
  attachment?: AcademicFile;
  status?: TareaStatus;
  revision?: number;
  updatedAt?: string;
  id: string;
  tareaId: string;
  studentId: string;
  studentName: string;
  submittedAt?: string;
  content: string;
  attachmentUrl?: string;
  comments?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
}

export interface Tarea {
  material?: AcademicFile;
  instructions?: string;
  criteria?: string;
  recipientEmails?: string[];
  submissions?: TareaSubmission[];
  recipients?: { studentId: string; studentName: string; email: string; status: TareaStatus; submission?: TareaSubmission }[];
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
  material?: AcademicFile;
  instructions?: string;
  criteria?: string;
  recipientEmails?: string[];
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  maxScore: number;
  priority: TareaPriority;
  attachmentName?: string;
}

export interface SubmitTareaDto {
  attachment?: AcademicFile;
  revision?: number;
  tareaId: string;
  content: string;
  attachmentUrl?: string;
  comments?: string;
}

export interface GradeTareaDto {
  revision?: number;
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


export interface AcademicFile { name: string; mime: string; base64: string; }
