import {
  ChangeDetectionStrategy,
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
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .modal-dialog {
      background-color: #fff;
      border-radius: 16px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem 1.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;

      .modal-icon-badge {
        width: 42px;
        height: 42px;
        background-color: #e0f2fe;
        color: #0284c7;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
      }

      .modal-title-wrapper {
        flex: 1;

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem;
        }

        .modal-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
      }

      .btn-close-modal {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0.4rem;
        border-radius: 6px;
        transition: all 0.15s ease;

        &:hover {
          color: #0f172a;
          background-color: #f1f5f9;
        }
      }
    }

    .modal-form {
      padding: 1.5rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        &.flex-1 { flex: 1; }
      }

      .form-row {
        display: flex;
        gap: 1rem;
      }

      .form-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
      }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .score-display-pill {
        background-color: #eff6ff;
        color: #1d4ed8;
        font-weight: 700;
        font-size: 0.8rem;
        padding: 0.15rem 0.55rem;
        border-radius: 9999px;
      }

      .form-control {
        width: 100%;
        padding: 0.65rem 0.85rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #0f172a;
        outline: none;
        transition: all 0.15s ease;

        &:focus {
          border-color: #1053d4;
          box-shadow: 0 0 0 3px rgba(16, 83, 212, 0.12);
        }
      }

      .form-range {
        width: 100%;
        accent-color: #1053d4;
      }
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;

      .btn-cancel {
        padding: 0.65rem 1.1rem;
        border: 1px solid #cbd5e1;
        background-color: #fff;
        color: #475569;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }
      }

      .btn-submit {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.65rem 1.25rem;
        border: none;
        background-color: #0d59e3;
        color: #fff;
        font-weight: 600;
        font-size: 0.875rem;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(13, 89, 227, 0.2);
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background-color: #0b49be;
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
