import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-configuracion-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './configuracion-header.component.html',
  styleUrl: './configuracion-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionHeaderComponent {
  public readonly user = input.required<User>();
  public readonly isEmbedded = input<boolean>(false);
  public readonly dashboardRoute = input<string>('/estudiante');
}
