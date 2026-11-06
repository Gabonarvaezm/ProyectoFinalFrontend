import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login-hero.component.html',
  styleUrl: './login-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginHeroComponent {}

