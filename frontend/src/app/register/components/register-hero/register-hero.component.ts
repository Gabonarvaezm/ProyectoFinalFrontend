import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './register-hero.component.html',
  styleUrl: './register-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterHeroComponent {}

