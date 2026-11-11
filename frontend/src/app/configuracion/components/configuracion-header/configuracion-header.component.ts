import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-configuracion-header',
  standalone: true,
  templateUrl: './configuracion-header.component.html',
  styleUrl: './configuracion-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionHeaderComponent {
  public readonly user = input.required<User>();
}

