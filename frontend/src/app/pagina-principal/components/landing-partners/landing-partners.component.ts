import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-partners',
  standalone: true,
  templateUrl: './landing-partners.component.html',
  styleUrl: './landing-partners.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPartnersComponent {}

