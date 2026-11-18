import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-docentes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-docentes.component.html',
  styleUrl: './landing-docentes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingDocentesComponent {}

