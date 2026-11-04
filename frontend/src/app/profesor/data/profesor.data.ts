import { RecentActivity, StudentProgress } from '../models/profesor.model';

export const INITIAL_STUDENTS_SEED: readonly StudentProgress[] = [
  {
    id: 'std-1',
    studentName: 'María López',
    email: 'maria.lopez@universidad.edu',
    topic: 'Biología: Mitosis',
    score: 75,
    status: 'active',
    statusLabel: 'Active',
  },
  {
    id: 'std-2',
    studentName: 'Carlos Pérez',
    email: 'carlos.perez@universidad.edu',
    topic: 'Biología: Mitosis',
    score: 40,
    status: 'needs-attention',
    statusLabel: 'Needs Attention',
  },
  {
    id: 'std-3',
    studentName: 'Laura Gómez',
    email: 'laura.gomez@universidad.edu',
    topic: 'Biología: Mitosis',
    score: 100,
    status: 'completed',
    statusLabel: 'Completed',
  },
];

export const INITIAL_ACTIVITIES_SEED: readonly RecentActivity[] = [
  {
    id: 'act-1',
    description: 'Juan terminó el examen de Mitosis.',
    timeAgo: '10 mins ago',
    icon: 'bi bi-check-circle',
    iconType: 'blue',
  },
  {
    id: 'act-2',
    description: 'Duda en el foro sobre Glucólisis.',
    timeAgo: '1 hr ago',
    icon: 'bi bi-chat-square-text',
    iconType: 'purple',
  },
];

