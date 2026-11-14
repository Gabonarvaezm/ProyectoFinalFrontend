import { ActionToastComponent } from '../shared/components/action-toast/action-toast.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { TareaService } from '../core/services/tarea.service';
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
  standalone: true,
  imports: [
    ActionToastComponent,
    CommonModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tarea {
  private readonly authService = inject(AuthService);
  private readonly tareaService = inject(TareaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Inputs Públicos ───────────────────────────────────────────────────────
  public readonly userRole = input<'student' | 'professor' | null>(null);
  public readonly isEmbedded = input<boolean>(false);

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
      const matchStatus = st === 'todas' || t.status === st;
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
  public readonly isSubmitting = signal<boolean>(false);
  public readonly toastMessage = signal<string | null>(null);

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
    this.showToast('Tienes avisos sobre fechas de entrega y retroalimentación docente.');
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
      if (tarea.status === 'pendiente') {
        this.openSubmitModal(tarea);
      } else {
        this.openDetailModal(tarea);
      }
    }
  }

  // ── Procesamiento de Eventos Emitidos por los Hijos ───────────────────────

  public handleCreateTarea(dto: CreateTareaDto): void {
    this.isSubmitting.set(true);
    const timer = setTimeout(() => {
      const created = this.tareaService.createTarea(dto, this.userName());
      this.isSubmitting.set(false);
      this.closeCreateModal();
      this.showToast(`Tarea "${created.title}" publicada con éxito para los estudiantes.`);
    }, 400);
    this.timerIds.push(timer);
  }

  public handleSubmitTarea(dto: SubmitTareaDto): void {
    this.isSubmitting.set(true);
    const timer = setTimeout(() => {
      this.tareaService.submitTarea(dto, this.currentUser());
      this.isSubmitting.set(false);
      this.closeSubmitModal();
      this.showToast('¡Tu tarea ha sido entregada exitosamente al docente!');
    }, 400);
    this.timerIds.push(timer);
  }

  public handleGradeTarea(dto: GradeTareaDto): void {
    this.tareaService.gradeTarea(dto);
    this.showToast(`Calificación (${dto.grade} pts) guardada con éxito.`);
    // Refrescar modal de detalle con la nueva nota
    const updated = this.tareas().find((t) => t.id === dto.tareaId);
    if (updated) {
      this.activeTarea.set(updated);
    }
  }

  public handleDeleteTarea(tareaId: string): void {
    this.tareaService.deleteTarea(tareaId);
    this.showToast('Tarea eliminada del catálogo académico.');
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

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    const timer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
