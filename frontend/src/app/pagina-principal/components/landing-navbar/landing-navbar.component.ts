import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-navbar',
  imports: [RouterLink],
  templateUrl: './landing-navbar.component.html',
  styleUrl: './landing-navbar.component.scss',
})
export class LandingNavbarComponent {
  public readonly mobileMenuOpen = input<boolean>(false);
  public readonly toggleMobileMenu = output<void>();
  public readonly closeMobileMenu = output<void>();
}

