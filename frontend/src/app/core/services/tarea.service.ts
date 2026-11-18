import { effect } from '@angular/core';
import { AcademicSyncService } from './academic-sync.service';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CreateTareaDto, GradeTareaDto, SubmitTareaDto, Tarea, TareaSubmission } from '../../tarea/models/tarea.model';
import { INITIAL_TAREAS } from '../../tarea/data/tarea.data';
import { User } from '../models/auth.model';

const STORAGE_KEY_TAREAS = 'disceria_academic_tareas';

@Injectable({
  providedIn: 'root',
})
export class TareaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sync = inject(AcademicSyncService);

  public readonly tareas = signal<Tarea[]>(this.loadInitialTareas());

  constructor() {
    effect(() => {
      const state = this.sync.snapshot();
      if (!state) {
        if (this.sync.enabled()) this.tareas.set([...INITIAL_TAREAS]);
        return;
      }
      this.tareas.set(state.tareas);
    });
  }

  private loadInitialTareas(): Tarea[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_TAREAS);
        if (stored) {
          const parsed = JSON.parse(stored) as Tarea[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback a INITIAL_TAREAS si hay error de lectura
      }
    }
    return INITIAL_TAREAS;
  }

  private persist(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEY_TAREAS, JSON.stringify(this.tareas()));
      } catch {
        // Ignorar si el almacenamiento local está restringido
      }
    }
  }

  public createTarea(dto: CreateTareaDto, professorName: string): Tarea {
    const newTarea: Tarea = {
      id: `tar-${crypto.randomUUID()}`,
      title: dto.title.trim(),
      description: dto.description.trim(),
      subject: dto.subject,
      dueDate: dto.dueDate,
      maxScore: Number(dto.maxScore) || 100,
      priority: dto.priority || 'media',
      assignedBy: professorName || 'Prof. Docente Titular',
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'pendiente',
      attachmentName: dto.attachmentName?.trim() || undefined,
      submissionsCount: 0,
    };

    this.tareas.update((list) => [newTarea, ...list]);
    this.persist();
    this.sync.publish('tarea.publish', newTarea);
    return newTarea;
  }

  public submitTarea(dto: SubmitTareaDto, student?: User | null): TareaSubmission {
    const submission: TareaSubmission = {
      id: `sub-${crypto.randomUUID()}`,
      tareaId: dto.tareaId,
      studentId: student?.id || 'student-local',
      studentName: student?.fullName || 'Alejandro Silva',
      submittedAt: new Date().toISOString(),
      content: dto.content.trim(),
      attachmentUrl: dto.attachmentUrl?.trim() || undefined,
      comments: dto.comments?.trim() || undefined,
    };

    this.tareas.update((list) =>
      list.map((t) => {
        if (t.id === dto.tareaId) {
          return {
            ...t,
            status: 'entregada',
            submissionsCount: t.submissionsCount + 1,
            mySubmission: submission,
          };
        }
        return t;
      })
    );
    this.persist();
    this.sync.publish('tarea.submit', submission);
    return submission;
  }

  public gradeTarea(dto: GradeTareaDto): void {
    this.sync.publish('tarea.grade', dto);
    this.tareas.update((list) =>
      list.map((t) => {
        if (t.id === dto.tareaId && t.mySubmission) {
          return {
            ...t,
            status: 'calificada',
            mySubmission: {
              ...t.mySubmission,
              grade: Number(dto.grade),
              feedback: dto.feedback.trim(),
              gradedAt: new Date().toISOString().split('T')[0],
            },
          };
        }
        return t;
      })
    );
    this.persist();
  }

  public deleteTarea(tareaId: string): void {
    this.sync.publish('tarea.delete', { id: tareaId });
    this.tareas.update((list) => list.filter((t) => t.id !== tareaId));
    this.persist();
  }
}

