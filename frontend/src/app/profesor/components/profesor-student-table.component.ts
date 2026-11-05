import { Component, input, output } from '@angular/core';
import { StudentProgress } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-student-table',
  template: `
    <section class="card-section progress-card" aria-labelledby="heading-student-progress">
      <div class="card-header">
        <div class="card-title-group">
          <h2 id="heading-student-progress" class="card-title">Progreso de Estudiantes</h2>
          <span class="students-count-badge">{{ totalCount() }} alumnos</span>
        </div>
        <div class="card-header-actions">
          <button
            type="button"
            class="btn-add-student"
            (click)="registerStudentClick.emit()"
            title="Registrar nuevo estudiante"
          >
            <i class="bi bi-person-plus-fill" aria-hidden="true"></i>
            <span>Registrar Estudiante</span>
          </button>
          <button type="button" class="btn-link-action">Ver Todos</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="progress-table">
          <thead>
            <tr>
              <th scope="col">Estudiante</th>
              <th scope="col">Tema</th>
              <th scope="col">Puntaje</th>
              <th scope="col">Estado</th>
              <th scope="col" class="th-actions"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (student of students(); track student.id) {
              <tr>
                <td class="student-name">
                  <div class="student-name-cell">
                    <span>{{ student.studentName }}</span>
                    @if (student.email) {
                      <span class="student-email-sub">{{ student.email }}</span>
                    }
                  </div>
                </td>
                <td class="student-topic">{{ student.topic }}</td>
                <td class="student-score">
                  <div class="score-container">
                    <div
                      class="progress-bar-track"
                      role="progressbar"
                      [attr.aria-valuenow]="student.score"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        class="progress-bar-fill"
                        [class]="student.status"
                        [style.width.%]="student.score"
                      ></div>
                    </div>
                    <span class="score-label">{{ student.score }}%</span>
                  </div>
                </td>
                <td class="student-status">
                  <span class="status-badge" [class]="student.status">
                    {{ student.statusLabel }}
                  </span>
                </td>
                <td class="td-actions">
                  <button
                    type="button"
                    class="btn-delete-student"
                    (click)="onDelete(student, $event)"
                    [attr.aria-label]="'Eliminar ' + student.studentName"
                    title="Eliminar de la cohorte"
                  >
                    <i class="bi bi-trash3" aria-hidden="true"></i>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty-state">
                  <div class="empty-state-content">
                    <i class="bi bi-people" aria-hidden="true"></i>
                    <p>No hay estudiantes que coincidan con la búsqueda.</p>
                    <button
                      type="button"
                      class="btn-primary-sm"
                      (click)="registerStudentClick.emit()"
                    >
                      <i class="bi bi-person-plus-fill"></i>
                      <span>Crear / Registrar Estudiante</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .card-section {
      background-color: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5) var(--space-6);
      box-shadow: var(--shadow-card);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-5);
      flex-wrap: wrap;
      gap: var(--space-3);

      .card-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .card-title {
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-slate-900);
        margin: 0;
      }

      .students-count-badge {
        background-color: var(--color-primary-50);
        color: var(--color-primary-700);
        border: 1px solid var(--color-primary-200);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        padding: 0.2rem 0.6rem;
        border-radius: var(--radius-full);
      }

      .card-header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .btn-add-student {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        background-color: var(--color-primary-50);
        color: var(--color-primary-700);
        border: 1px solid var(--color-primary-200);
        padding: 0.45rem 0.85rem;
        border-radius: var(--radius-md);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: var(--transition-fast);

        &:hover {
          background-color: var(--color-primary-700);
          color: var(--color-white);
        }
      }

      .btn-link-action {
        color: var(--color-primary-700);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        background: transparent;
        border: none;
        padding: 0;

        &:hover {
          color: var(--color-primary-800);
          text-decoration: underline;
        }
      }
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .progress-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: var(--space-3) var(--space-2);
        font-size: var(--font-size-sm);
        border-bottom: 1px solid var(--color-border-subtle);
        vertical-align: middle;
      }

      th {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-slate-500);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: left;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      tbody tr:hover {
        background-color: var(--color-slate-50);
      }

      .student-name-cell {
        display: flex;
        flex-direction: column;
        font-weight: var(--font-weight-semibold);
        color: var(--color-slate-900);
        white-space: nowrap;

        .student-email-sub {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-regular);
          color: var(--color-slate-400);
        }
      }

      .student-topic {
        color: var(--color-slate-600);
        font-size: var(--font-size-sm);
      }

      .score-container {
        display: flex;
        align-items: center;
        gap: var(--space-3);

        .progress-bar-track {
          width: 80px;
          height: 6px;
          background-color: var(--color-slate-200);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);

          &.active,
          &.completed {
            background-color: var(--color-primary-600);
          }
          &.needs-attention {
            background-color: var(--color-warning);
          }
        }

        .score-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-slate-700);
        }
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        white-space: nowrap;

        &.active {
          background-color: var(--color-primary-50);
          color: var(--color-primary-700);
          border: 1px solid var(--color-primary-200);
        }
        &.needs-attention {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
          border: 1px solid var(--color-warning-border);
        }
        &.completed {
          background-color: var(--color-slate-100);
          color: var(--color-slate-600);
          border: 1px solid var(--color-slate-200);
        }
      }

      .th-actions, .td-actions {
        width: 38px;
        text-align: right;
      }

      .btn-delete-student {
        color: var(--color-slate-400);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
        transition: var(--transition-fast);

        &:hover {
          color: var(--color-danger);
          background-color: var(--color-danger-bg);
        }
      }

      .empty-state {
        text-align: center;
        padding: var(--space-8) var(--space-4);

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-text-muted);

          i {
            font-size: 2rem;
            color: var(--color-slate-300);
          }
          p {
            margin: 0;
            font-size: var(--font-size-sm);
          }
        }
      }
    }

    .btn-primary-sm {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background-color: var(--color-primary-700);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius-md);
      padding: 0.5rem 0.875rem;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      margin-top: var(--space-2);
      transition: var(--transition-fast);

      &:hover {
        background-color: var(--color-primary-800);
      }
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class ProfesorStudentTableComponent {
  public readonly students = input.required<readonly StudentProgress[]>();
  public readonly totalCount = input<number>(0);

  public readonly deleteStudent = output<StudentProgress>();
  public readonly registerStudentClick = output<void>();

  public onDelete(student: StudentProgress, event: Event): void {
    event.stopPropagation();
    this.deleteStudent.emit(student);
  }
}
