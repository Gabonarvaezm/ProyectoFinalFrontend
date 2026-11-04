import { RecentActivity, StudentProgress } from '../models/profesor.model';

export const INITIAL_STUDENTS_SEED: readonly StudentProgress[] = [
  {
    id: 'std-1',
    studentName: 'María López',
    email: 'maria.lopez@universidad.edu',
    topic: 'Biología: Mitosis',
    score: 75,
    status: 'active',
    statusLabel: 'Activo',
  },
  {
    id: 'std-2',
    studentName: 'Carlos Pérez',
    email: 'carlos.perez@universidad.edu',
    topic: 'Biología: Mitosis',
    score: 40,
    status: 'needs-attention',
    statusLabel: 'Requiere Atención',
  },
  {
    id: 'std-3',
    studentName: 'Laura Gómez',
    email: 'laura.gomez@universidad.edu',
    topic: 'Biología: Mitosis',
    score: 100,
    status: 'completed',
    statusLabel: 'Completado',
  },
];

export const INITIAL_ACTIVITIES_SEED: readonly RecentActivity[] = [
  {
    id: 'act-1',
    description: 'Juan terminó el examen de Mitosis.',
    timeAgo: 'Hace 10 min',
    icon: 'bi bi-check-circle',
    iconType: 'blue',
  },
  {
    id: 'act-2',
    description: 'Duda en el foro sobre Glucólisis.',
    timeAgo: 'Hace 1 hora',
    icon: 'bi bi-chat-square-text',
    iconType: 'purple',
  },
];
