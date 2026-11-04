import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ForoFilterPayload } from '../models/foro.model';

@Component({
  selector: 'app-foro-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="filters-section" aria-label="Filtros de temas académicos">
      <div class="topic-search-wrap">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input
          type="text"
          class="topic-search-input"
          placeholder="Buscar por tema..."
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          aria-label="Filtrar por tema"
        />
      </div>

      <div class="subject-pills-row" role="group" aria-label="Filtro de materias académicas">
        @for (subj of subjects(); track subj) {
          <button
            type="button"
            class="subject-pill"
            [class.active]="selectedSubject() === subj"
            (click)="onSelectSubject(subj)"
            [attr.aria-pressed]="selectedSubject() === subj"
          >
            {{ subj }}
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    .filters-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .topic-search-wrap {
      position: relative;
      flex: 1;
      min-width: 220px;

      i {
        position: absolute;
        left: 0.9rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        pointer-events: none;
      }
    }

    .topic-search-input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.4rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.88rem;
      color: #0f172a;
      background-color: #ffffff;
      outline: none;
      transition: all 0.2s ease;

      &::placeholder {
        color: #94a3b8;
      }

      &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }
    }

    .subject-pills-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-pill {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 0.45rem 1rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background-color: #f8fafc;
        border-color: #cbd5e1;
        color: #0f172a;
      }

      &.active {
        background-color: #2563eb;
        border-color: #2563eb;
        color: #ffffff;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
      }
    }
  `],
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

  public onSelectSubject(subject: string): void {
    this.selectedSubject.set(subject);
    this.filterChanged.emit({ subject, query: this.searchQuery() });
  }

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.filterChanged.emit({ subject: this.selectedSubject(), query: target.value });
  }
}
