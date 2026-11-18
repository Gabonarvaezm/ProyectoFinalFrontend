import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ForoFilterPayload } from '../../models/foro.model';

@Component({
  selector: 'app-foro-filters',
  templateUrl: './foro-filters.component.html',
  styleUrl: './foro-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForoFiltersComponent {
  public readonly selectedSubject = model.required<string>();
  public readonly searchQuery = model<string>('');
  public readonly subjects = input<string[]>([
    'Todas las Materias',
    'Matemáticas',
    'Ciencias',
    'Historia',
    'Lenguaje',
    'Tecnología',
  ]);

  public readonly filterChanged = output<ForoFilterPayload>();

  public getSubjectIcon(subject: string): string {
    switch (subject) {
      case 'Matemáticas':
        return 'bi bi-calculator-fill';
      case 'Ciencias':
        return 'bi bi-flask-fill';
      case 'Historia':
        return 'bi bi-hourglass-split';
      case 'Lenguaje':
        return 'bi bi-translate';
      case 'Tecnología':
        return 'bi bi-laptop-fill';
      default:
        return 'bi bi-collection-fill';
    }
  }

  public onSelectSubject(subject: string): void {
    this.selectedSubject.set(subject);
    this.filterChanged.emit({ subject, query: this.searchQuery() });
  }

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.searchQuery.set(value);
    this.filterChanged.emit({ subject: this.selectedSubject(), query: value });
  }
}
