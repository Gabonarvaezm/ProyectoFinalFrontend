import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Testimonial } from '../../models/landing.model';

@Component({
  selector: 'app-landing-testimonials',
  standalone: true,
  templateUrl: './landing-testimonials.component.html',
  styleUrl: './landing-testimonials.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingTestimonialsComponent {
  public readonly testimonials = input.required<readonly Testimonial[]>();
  public readonly currentPage = input.required<number>();
  public readonly totalPages = input.required<number>();

  public readonly prevClicked = output<void>();
  public readonly nextClicked = output<void>();
}

