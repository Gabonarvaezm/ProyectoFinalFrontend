import { AcademicProgressComponent } from './components/academic-progress.component';
import { ActionToastComponent } from '../shared/components/action-toast/action-toast.component';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TareaService } from '../core/services/tarea.service';
import { AcademicSyncService } from '../core/services/academic-sync.service';
import {
  CreateTareaDto,
  GradeTareaDto,
  SubmitTareaDto,
  Tarea as TareaModel,
} from './models/tarea.model';
import { STATUS_LIST, SUBJECTS_LIST } from './data/tarea.data';
import {
  TareaCardComponent,
  TareaDetailModalComponent,
  TareaEstudianteFormComponent,
  TareaFiltersComponent,
  TareaProfesorFormComponent,
} from './components';

@Component({
  selector: 'app-tarea',
  imports: [
    AcademicProgressComponent,
    ActionToastComponent,
    RouterLink,
    NgTemplateOutlet,
    TareaFiltersComponent,
    TareaCardComponent,
    TareaProfesorFormComponent,
    TareaEstudianteFormComponent,
    TareaDetailModalComponent,
  ],
  templateUrl: './tarea.html',
  styleUrl: './tarea.scss',
})
export class Tarea {
  private readonly authService = inject(AuthService);
  private readonly tareaService = inject(TareaService);
  private readonly sync = inject(AcademicSyncService);
  readonly noticesOpen = signal(false);
  readonly taskNotices = computed(() => this.sync.snapshot()?.notifications.filter((notice) => notice.type === 'task') ?? []);
  readonly unreadNotices = computed(() => this.taskNotices().some((notice) => !notice.read));
  markNoticeRead(id: string): void { this.sync.receipt(id, true); }
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Inputs Públicos ───────────────────────────────────────────────────────
  public readonly userRole = input<'student' | 'professor' | null>(null);
  public readonly isEmbedded = input<boolean>(false);
  readonly studentId = input('');
  readonly selectedStudent = linkedSignal(() => this.studentId());
  readonly detailStudentId = signal('');
  openStudentActivity(value: { tarea: TareaModel; studentId: string }): void {
    this.openDetailModal(value.tarea);
    this.detailStudentId.set(value.studentId);
  }

  // ── Usuario y Rol Autenticado ─────────────────────────────────────────────
  public readonly currentUser = this.authService.currentUser;

  public readonly currentRole = computed<'student' | 'professor'>(() => {
    const roleInput = this.userRole();
    if (roleInput) return roleInput;
    const authUserRole = this.currentUser()?.role;
    return authUserRole === 'professor' ? 'professor' : 'student';
  });

  public readonly isProfessor = computed<boolean>(() => this.currentRole() === 'professor');

  public readonly dashboardRoute = computed<string>(() =>
    this.isProfessor() ? '/profesor' : '/estudiante'
  );

  public readonly userName = computed<string>(() => {
    const user = this.currentUser();
    if (user?.fullName) return user.fullName;
    return this.isProfessor() ? 'Prof. Carlos Mendoza' : 'Alejandro Silva';
  });

  public readonly userInitials = computed<string>(() => {
    const name = this.userName().trim();
    if (!name) return 'US';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  public readonly userInstitution = computed<string>(
    () => this.currentUser()?.institution || 'Universidad Tecnológica Pública'
  );

  // ── Catálogo de Tareas y Filtros ──────────────────────────────────────────
  public readonly tareas = this.tareaService.tareas;
  public readonly statuses = STATUS_LIST;
  public readonly subjects = SUBJECTS_LIST;

  public readonly selectedStatus = signal<string>('todas');
  public readonly selectedSubject = signal<string>('Todas las Materias');
  public readonly searchQuery = signal<string>('');

  public readonly filteredTareas = computed<TareaModel[]>(() => {
    const all = this.tareas();
    const st = this.selectedStatus();
    const sub = this.selectedSubject();
    const q = this.searchQuery().trim().toLowerCase();

    return all.filter((t) => {
      const matchStatus = st === 'todas' || (this.isProfessor() && t.recipients ? t.recipients.some((recipient) => recipient.status === st) : t.status === st);
      const matchSubject = sub === 'Todas las Materias' || t.subject === sub;
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.assignedBy.toLowerCase().includes(q);

      return matchStatus && matchSubject && matchQuery;
    });
  });

  // ── Estado de Modales y Retroalimentación ─────────────────────────────────
  public readonly isCreateOpen = signal<boolean>(false);
  public readonly isSubmitOpen = signal<boolean>(false);
  public readonly isDetailOpen = signal<boolean>(false);
  public readonly activeTarea = signal<TareaModel | null>(null);
  readonly currentDetail = computed(() => this.tareas().find((task) => task.id === this.activeTarea()?.id) ?? null);
  public readonly isSubmitting = signal<boolean>(false);
  public readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<'success' | 'error'>('success');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((t) => clearTimeout(t));
    });
  }

  // ── Navegación y Acciones del Topbar ───────────────────────────────────────

  public onAiClicked(): void {
    this.router.navigate(['/chatbot']);
  }

  public onNotificationsClicked(): void {
    this.noticesOpen.update((open) => !open);
  }

  public onConfigClicked(): void {
    this.router.navigate(['/configuracion']);
  }

  // ── Gestión de Modales ────────────────────────────────────────────────────

  public openCreateModal(): void {
    if (!this.isProfessor()) {
      this.showToast('Solo los docentes pueden crear y asignar nuevas tareas.');
      return;
    }
    this.isCreateOpen.set(true);
  }

  public closeCreateModal(): void {
    this.isCreateOpen.set(false);
  }

  public openSubmitModal(tarea: TareaModel): void {
    this.activeTarea.set(tarea);
    this.isSubmitOpen.set(true);
  }

  public closeSubmitModal(): void {
    this.isSubmitOpen.set(false);
    this.activeTarea.set(null);
  }

  public openDetailModal(tarea: TareaModel): void {
    this.detailStudentId.set('');
    this.activeTarea.set(tarea);
    this.isDetailOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailOpen.set(false);
    this.activeTarea.set(null);
  }

  public onCardAction(tarea: TareaModel): void {
    if (this.isProfessor()) {
      this.openDetailModal(tarea);
    } else {
      if (['pendiente', 'en_progreso', 'requiere_correccion'].includes(tarea.status)) {
        this.openSubmitModal(tarea);
      } else {
        this.openDetailModal(tarea);
      }
    }
  }

  // ── Procesamiento de Eventos Emitidos por los Hijos ───────────────────────

  public async handleCreateTarea(dto: CreateTareaDto): Promise<void> {
    await this.perform(async () => { await this.tareaService.createTarea(dto, this.userName()); this.closeCreateModal(); }, 'Tarea guardada y asignada.');
  }
  public async handleSubmitTarea(dto: SubmitTareaDto): Promise<void> {
    await this.perform(async () => { await this.tareaService.submitTarea(dto, this.currentUser()); this.closeSubmitModal(); }, 'Entrega definitiva confirmada.');
  }
  public async handleDraft(dto: SubmitTareaDto): Promise<void> {
    await this.perform(async () => { await this.tareaService.saveDraft(dto); this.closeSubmitModal(); }, 'Borrador guardado. Todavía no has entregado la tarea.');
  }
  public async handleGradeTarea(dto: GradeTareaDto): Promise<void> {
    await this.perform(() => this.tareaService.gradeTarea(dto), 'Calificación guardada.');
  }
  public async handleReview(id: string): Promise<void> {
    await this.perform(() => this.tareaService.review(id), 'Entrega en revisión.');
  }
  public async handleCorrection(value: { submissionId: string; feedback: string }): Promise<void> {
    await this.perform(() => this.tareaService.requestCorrection(value.submissionId, value.feedback), 'Nueva entrega autorizada.');
  }
  public async handleDeleteTarea(id: string): Promise<void> {
    await this.perform(() => this.tareaService.deleteTarea(id), 'Tarea eliminada.');
  }
  private async perform(action: () => Promise<unknown>, message: string): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      await action();
      const active = this.activeTarea();
      if (active) this.activeTarea.set(this.tareas().find((t) => t.id === active.id) ?? null);
      this.showToast(message);
    } catch (error: unknown) { this.showToast(error instanceof Error ? error.message : 'No se pudo guardar.', 'error'); }
    finally { this.isSubmitting.set(false); }
  }

  public onFilterStatus(status: string): void {
    this.selectedStatus.set(status);
  }

  public onFilterSubject(subject: string): void {
    this.selectedSubject.set(subject);
  }

  public onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  private showToast(msg: string, tone: 'success' | 'error' = 'success'): void {
    this.toastTone.set(tone);
    this.toastMessage.set(msg);
    const timer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
