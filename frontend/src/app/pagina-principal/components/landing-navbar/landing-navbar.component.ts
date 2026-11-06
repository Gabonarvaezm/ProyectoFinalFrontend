import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-navbar.component.html',
  styleUrl: './landing-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingNavbarComponent {
  public readonly mobileMenuOpen = input<boolean>(false);
  public readonly toggleMobileMenu = output<void>();
  public readonly closeMobileMenu = output<void>();
}

