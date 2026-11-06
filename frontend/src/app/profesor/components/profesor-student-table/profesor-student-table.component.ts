import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StudentProgress } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-student-table',
  templateUrl: './profesor-student-table.component.html',
  styleUrl: './profesor-student-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

