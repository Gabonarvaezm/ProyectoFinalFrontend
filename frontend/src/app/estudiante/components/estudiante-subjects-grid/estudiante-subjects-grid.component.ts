import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LibrarySubject } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-subjects-grid',
  standalone: true,
  templateUrl: './estudiante-subjects-grid.component.html',
  styleUrl: './estudiante-subjects-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteSubjectsGridComponent {
  public readonly subjects = input.required<readonly LibrarySubject[]>();
  /** Emite la materia presionada para actualizar el gráfico en el padre */
  public readonly subjectSelected = output<LibrarySubject>();
  /** Emite cuando el usuario quiere ver toda la biblioteca */
  public readonly viewAllRequested = output<void>();
}

