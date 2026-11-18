import type { Book } from '../../biblioteca/models/book.model';
import type { ForumPost } from '../../foro/models/foro.model';
import type { CreateExamDto, SendMessageDto, StudentProgress } from '../../profesor/models/profesor.model';
import type { StudentNotification } from '../../estudiante/models/estudiante.model';
import type { Tarea } from '../../tarea/models/tarea.model';

export interface PublishedExam extends CreateExamDto { id: string; authorName: string; createdAt: string; }
export interface PublishedMessage extends SendMessageDto { id: string; authorName: string; createdAt: string; }
export interface AcademicSnapshot {
  books: Book[];
  posts: ForumPost[];
  exams: PublishedExam[];
  messages: PublishedMessage[];
  tareas: Tarea[];
  notifications: StudentNotification[];
  students: StudentProgress[];
}
export interface AcademicEvent { id: string; type: string; payload: object; }
