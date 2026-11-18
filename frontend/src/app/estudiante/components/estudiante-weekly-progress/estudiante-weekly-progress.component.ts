import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyProgressItem } from '../../models/estudiante.model';

/**
 * Nodo Hijo Presentacional — Gráfico de Barras de Progreso Semanal.
 *
 * Responsabilidades:
 *  - Renderizar el gráfico de barras con los datos recibidos del padre.
 *  - Resaltar la barra de la materia activa (input `highlightedId`).
 *  - Emitir `barClicked` cuando el usuario presiona una barra para que
 *    el padre actualice el estado de materia seleccionada.
 *  - Emitir `clearClicked` cuando el usuario quiere ver todas las materias.
 */
@Component({
  selector: 'app-estudiante-weekly-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-weekly-progress.component.html',
  styleUrls: ['./estudiante-weekly-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteWeeklyProgressComponent {
  // ── Inputs del Padre ──────────────────────────────────────────────────────
  public readonly items = input.required<readonly WeeklyProgressItem[]>();
  public readonly highlightedId = input<string | null>(null);

  // ── Outputs hacia el Padre ────────────────────────────────────────────────
  public readonly barClicked = output<WeeklyProgressItem>();
  public readonly clearClicked = output<void>();

  // ── Métodos de Interacción ────────────────────────────────────────────────
  public onBarClick(item: WeeklyProgressItem): void {
    if (this.highlightedId() === item.subjectId) {
      // Segunda pulsación en la misma barra → resetea el filtro
      this.clearClicked.emit();
    } else {
      this.barClicked.emit(item);
    }
  }
}
