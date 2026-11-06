import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-configuracion-cuenta',
  standalone: true,
  templateUrl: './configuracion-cuenta.component.html',
  styleUrl: './configuracion-cuenta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionCuentaComponent {
  public readonly user = input.required<User>();
  public readonly initials = input.required<string>();
  public readonly logoutClicked = output<void>();

  public onLogout(): void {
    this.logoutClicked.emit();
  }
}

