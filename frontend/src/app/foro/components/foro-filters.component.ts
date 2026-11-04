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
          placeholder="Search by topic..."
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
      padding: 0.6rem 1rem 0.6rem 2.4rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;

      &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .subject-pills-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .subject-pill {
      padding: 0.55rem 1.1rem;
      border-radius: 10px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f1f5f9;
        border-color: #cbd5e1;
      }

      &.active {
        background-color: #1d4ed8;
        border-color: #1d4ed8;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(29, 78, 216, 0.25);
      }
    }
  `],
})
export class ForoFiltersComponent {
  public readonly selectedSubject = model.required<string>();
  public readonly searchQuery = model<string>('');
  public readonly subjects = input<string[]>([
    'All Subjects',
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

