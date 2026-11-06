import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Course } from '../../models/landing.model';

@Component({
  selector: 'app-landing-courses',
  standalone: true,
  templateUrl: './landing-courses.component.html',
  styleUrl: './landing-courses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingCoursesComponent {
  public readonly courses = input.required<readonly Course[]>();
}

