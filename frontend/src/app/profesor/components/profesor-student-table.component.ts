import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StudentProgress } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-student-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;

      .card-title-group {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .card-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .students-count-badge {
        background-color: #e0f2fe;
        color: #0369a1;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 12px;
      }

      .card-header-actions {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }

      .btn-add-student {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background-color: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        padding: 0.35rem 0.7rem;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover { background-color: #1d4ed8; color: #fff; }
      }

      .btn-link-action {
        color: #1053d4;
        font-size: 0.825rem;
        font-weight: 600;
        cursor: pointer;
        background: transparent;
        border: none;
        padding: 0;
        &:hover { text-decoration: underline; }
      }
    }

    .table-responsive { width: 100%; overflow-x: auto; }

    .progress-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.85rem 0.5rem 0.85rem 0;
        font-size: 0.88rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      th {
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
        padding-top: 0;
        text-align: left;
      }

      tbody tr:last-child td { border-bottom: none; }

      .student-name-cell {
        display: flex;
        flex-direction: column;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;

        .student-email-sub {
          font-size: 0.73rem;
          font-weight: 400;
          color: #94a3b8;
        }
      }

      .student-topic { color: #475569; font-size: 0.85rem; }

      .score-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .progress-bar-track {
          width: 75px;
          height: 7px;
          background-color: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;

          &.active,
          &.completed { background-color: #1d4ed8; }
          &.needs-attention { background-color: #f59e0b; }
        }

        .score-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
        }
      }

      .status-badge {
        display: inline-block;
        padding: 0.28rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;

        &.active { background-color: #4338ca; color: #fff; }
        &.needs-attention { background-color: #fef3c7; color: #b45309; }
        &.completed { background-color: #e2e8f0; color: #475569; }
      }

      .th-actions, .td-actions { width: 38px; text-align: right; }

      .btn-delete-student {
        color: #94a3b8;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.3rem;
        border-radius: 4px;
        font-size: 0.9rem;
        transition: all 0.15s ease;

        &:hover { color: #ef4444; background-color: #fee2e2; }
      }

      .empty-state {
        text-align: center;
        padding: 2rem 1rem;

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          i { font-size: 1.8rem; color: #cbd5e1; }
          p { margin: 0; font-size: 0.88rem; }
        }
      }
    }

    .btn-primary-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background-color: #1d4ed8;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.45rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.4rem;
      transition: background-color 0.15s ease;

      &:hover { background-color: #1e40af; }
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
