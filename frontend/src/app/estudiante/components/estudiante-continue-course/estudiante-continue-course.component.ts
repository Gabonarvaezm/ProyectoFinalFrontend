import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActiveCourse } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-continue-course',
  standalone: true,
  templateUrl: './estudiante-continue-course.component.html',
  styleUrl: './estudiante-continue-course.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteContinueCourseComponent {
  public readonly course = input.required<ActiveCourse>();
  public readonly continueClicked = output<void>();
}

