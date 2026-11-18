import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PracticeExam, WeeklyProgressItem } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-exam-card',
  standalone: true,
  templateUrl: './estudiante-exam-card.component.html',
  styleUrl: './estudiante-exam-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteExamCardComponent {
  readonly isPublished = input(false);
  public readonly practiceExam = input.required<PracticeExam>();
  public readonly weeklyProgress = input.required<readonly WeeklyProgressItem[]>();

  public readonly startExamClicked = output<void>();
}

