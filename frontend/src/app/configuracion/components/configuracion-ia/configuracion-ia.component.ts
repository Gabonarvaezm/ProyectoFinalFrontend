import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion-ia',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion-ia.component.html',
  styleUrl: './configuracion-ia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionIaComponent {
  public readonly form = input.required<FormGroup>();
}

