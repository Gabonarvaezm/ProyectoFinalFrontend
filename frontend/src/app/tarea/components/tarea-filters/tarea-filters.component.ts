import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tarea-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarea-filters.component.html',
  styleUrl: './tarea-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareaFiltersComponent {
  public readonly selectedStatus = input<string>('todas');
  public readonly selectedSubject = input<string>('Todas las Materias');
  public readonly searchQuery = input<string>('');
  public readonly statuses = input<{ id: string; label: string }[]>([]);
  public readonly subjects = input<string[]>([]);
  public readonly isProfessor = input<boolean>(false);
  public readonly totalCount = input<number>(0);

  public readonly statusChanged = output<string>();
  public readonly subjectChanged = output<string>();
  public readonly searchChanged = output<string>();
  public readonly createClicked = output<void>();

  public onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchChanged.emit(val);
  }

  public onStatusSelect(statusId: string): void {
    this.statusChanged.emit(statusId);
  }

  public onSubjectSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.subjectChanged.emit(val);
  }
}

