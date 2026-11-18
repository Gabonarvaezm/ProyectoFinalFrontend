import { effect, inject, Injectable, signal } from '@angular/core';
import { AcademicSyncService } from './academic-sync.service';
import { CreateTareaDto, GradeTareaDto, SubmitTareaDto, Tarea, TareaSubmission } from '../../tarea/models/tarea.model';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TareaService {
  private readonly sync = inject(AcademicSyncService);
  readonly tareas = signal<Tarea[]>([]);
  constructor() { effect(() => this.tareas.set(this.sync.snapshot()?.tareas ?? [])); }
  private async commit(type: string, payload: object): Promise<void> {
    const state = await this.sync.commit(type, payload);
    this.tareas.set(state.tareas);
  }
  async createTarea(dto: CreateTareaDto, professorName: string): Promise<Tarea> {
    const tarea = { ...dto, id: `tar-${crypto.randomUUID()}`, assignedBy: professorName,
      assignedDate: new Date().toISOString().slice(0, 10), status: 'pendiente' as const, submissionsCount: 0 };
    await this.commit('tarea.publish', tarea);
    return this.tareas().find((item) => item.id === tarea.id)!;
  }
  async submitTarea(dto: SubmitTareaDto, _student?: User | null): Promise<TareaSubmission> {
    await this.commit('tarea.submit', dto);
    return this.tareas().find((item) => item.id === dto.tareaId)!.mySubmission!;
  }
  async saveDraft(dto: SubmitTareaDto): Promise<void> { await this.commit('tarea.draft', dto); }
  async gradeTarea(dto: GradeTareaDto): Promise<void> { await this.commit('tarea.grade', dto); }
  async review(submissionId: string): Promise<void> { await this.commit('tarea.review', { submissionId }); }
  async requestCorrection(submissionId: string, feedback: string): Promise<void> {
    await this.commit('tarea.correction', { submissionId, feedback });
  }
  async deleteTarea(id: string): Promise<void> { await this.commit('tarea.delete', { id }); }
}
