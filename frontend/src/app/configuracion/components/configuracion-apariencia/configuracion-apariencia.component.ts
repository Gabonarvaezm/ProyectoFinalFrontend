import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppTheme } from '../../models/configuracion.model';

@Component({
  selector: 'app-configuracion-apariencia',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion-apariencia.component.html',
  styleUrl: './configuracion-apariencia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionAparienciaComponent {
  public readonly form = input.required<FormGroup>();
  public readonly isDarkMode = input.required<boolean>();
  public readonly themeSelected = output<AppTheme>();
  public readonly themeToggled = output<void>();

  public onSelectTheme(theme: AppTheme): void {
    this.themeSelected.emit(theme);
  }

  public onToggleTheme(): void {
    this.themeToggled.emit();
  }
}

