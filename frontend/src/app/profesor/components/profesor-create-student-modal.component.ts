import {
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateStudentDto, StudentStatus } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-create-student-modal',
  imports: [ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop"
        (click)="onClose()"
        (keydown.escape)="onClose()"
        role="presentation"
      >
        <div
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-register-title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <div class="modal-icon-badge">
              <i class="bi bi-person-plus-fill"></i>
            </div>
            <div class="modal-title-wrapper">
              <h2 id="modal-register-title" class="modal-title">Registrar Nuevo Estudiante</h2>
              <p class="modal-subtitle">Añade a un alumno a tu cohorte para seguimiento en el dashboard.</p>
            </div>
            <button
              type="button"
              class="btn-close-modal"
              (click)="onClose()"
              aria-label="Cerrar ventana"
            >
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>

          <form [formGroup]="studentForm" (ngSubmit)="onSubmit()" class="modal-form" novalidate>
            <div class="form-group">
              <label for="studentName" class="form-label">Nombre Completo *</label>
              <input
                type="text"
                id="studentName"
                formControlName="studentName"
                class="form-control"
                placeholder="Ej: Andrés Narváez"
                required
              />
            </div>

            <div class="form-group">
              <label for="studentEmail" class="form-label">Correo Institucional *</label>
              <input
                type="email"
                id="studentEmail"
                formControlName="email"
                class="form-control"
                placeholder="alumno@universidad.edu"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="studentTopic" class="form-label">Asignatura / Módulo *</label>
                <input
                  type="text"
                  id="studentTopic"
                  formControlName="topic"
                  class="form-control"
                  placeholder="Ej: Biología: Mitosis"
                  required
                />
              </div>

              <div class="form-group flex-1">
                <label for="studentStatus" class="form-label">Estado Inicial *</label>
                <select id="studentStatus" formControlName="status" class="form-control">
                  <option value="active">Activo</option>
                  <option value="needs-attention">Requiere Atención</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="studentScore" class="form-label">Puntaje / Progreso Inicial (%)</label>
                <span class="score-display-pill">{{ studentForm.get('score')?.value }}%</span>
              </div>
              <input
                type="range"
                id="studentScore"
                formControlName="score"
                class="form-range"
                min="0"
                max="100"
                step="5"
              />
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="onClose()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="isSubmitting()"
              >
                <i class="bi bi-check-lg" aria-hidden="true"></i>
                <span>Registrar Estudiante</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
      animation: fadeIn var(--duration-fast) var(--ease-out-expo);
    }

    .modal-dialog {
      background-color: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      max-width: 520px;
      width: 100%;
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      animation: scaleUp var(--duration-fast) var(--ease-out-expo);
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-5) var(--space-6) var(--space-4);
      border-bottom: 1px solid var(--color-border);

      .modal-icon-badge {
        width: 42px;
        height: 42px;
        background-color: var(--color-primary-50);
        color: var(--color-primary-700);
        border: 1px solid var(--color-primary-200);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .modal-title-wrapper {
        flex: 1;

        .modal-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-slate-900);
          margin: 0 0 0.15rem;
        }

        .modal-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin: 0;
        }
      }

      .btn-close-modal {
        background: transparent;
        border: none;
        color: var(--color-slate-400);
        font-size: 1.1rem;
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-sm);
        transition: var(--transition-fast);

        &:hover {
          color: var(--color-slate-900);
          background-color: var(--color-slate-100);
        }
      }
    }

    .modal-form {
      padding: var(--space-5) var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);

        &.flex-1 { flex: 1; }
      }

      .form-row {
        display: flex;
        gap: var(--space-4);

        @media (max-width: 480px) {
          flex-direction: column;
          gap: var(--space-3);
        }
      }

      .form-label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-slate-700);
      }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .score-display-pill {
        background-color: var(--color-primary-50);
        color: var(--color-primary-700);
        font-weight: var(--font-weight-bold);
        font-size: var(--font-size-xs);
        padding: 0.15rem 0.55rem;
        border-radius: var(--radius-full);
      }

      .form-control {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-slate-900);
        outline: none;
        transition: var(--transition-fast);

        &:focus {
          border-color: var(--color-primary-600);
          box-shadow: var(--focus-ring);
        }
      }

      .form-range {
        width: 100%;
        accent-color: var(--color-primary-700);
      }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border);

      .btn-cancel {
        padding: 0.625rem 1.1rem;
        border: 1px solid var(--color-border);
        background-color: var(--color-bg-surface);
        color: var(--color-slate-700);
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-sm);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: var(--transition-fast);

        &:hover {
          background-color: var(--color-slate-100);
          color: var(--color-slate-900);
        }
      }

      .btn-submit {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: 0.625rem 1.25rem;
        border: none;
        background-color: var(--color-primary-700);
        color: var(--color-white);
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-sm);
        border-radius: var(--radius-md);
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: var(--transition-fast);

        &:hover:not(:disabled) {
          background-color: var(--color-primary-800);
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
})
export class ProfesorCreateStudentModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input.required<boolean>();
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly studentSubmitted = output<CreateStudentDto>();

  public readonly studentForm: FormGroup = this.fb.group({
    studentName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['Biología: Mitosis', [Validators.required, Validators.minLength(3)]],
    score: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
    status: ['active' as StudentStatus, [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.studentForm.reset({
          studentName: '',
          email: '',
          topic: 'Biología: Mitosis',
          score: 75,
          status: 'active',
        });
      }
    });
  }

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const formValue = this.studentForm.value;
    const dto: CreateStudentDto = {
      studentName: formValue.studentName.trim(),
      email: formValue.email.trim(),
      topic: formValue.topic.trim(),
      score: Number(formValue.score),
      status: formValue.status as StudentStatus,
    };

    this.studentSubmitted.emit(dto);
  }
}
