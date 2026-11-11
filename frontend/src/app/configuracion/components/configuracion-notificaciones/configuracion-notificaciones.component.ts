import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion-notificaciones',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion-notificaciones.component.html',
  styleUrl: './configuracion-notificaciones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionNotificacionesComponent {
  public readonly form = input.required<FormGroup>();
}

