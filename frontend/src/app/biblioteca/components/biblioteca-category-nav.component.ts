import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { BookCategory, CategoryFilter } from '../models/book.model';

@Component({
  selector: 'app-biblioteca-category-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="categories-nav" aria-label="Categorías del repositorio">
      <div class="categories-scroll-wrapper" role="tablist">
        @for (cat of categories(); track cat.id) {
          <button
            type="button"
            class="cat-tab-btn"
            [class.active]="selectedCategory() === cat.id"
            (click)="onSelect(cat.id)"
            role="tab"
            [attr.aria-selected]="selectedCategory() === cat.id"
          >
            <i [class]="cat.icon + ' cat-icon'" aria-hidden="true"></i>
            <span class="cat-label">{{ cat.label }}</span>
            <span class="cat-count">{{ cat.count ?? 0 }}</span>
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    .categories-nav {
      width: 100%;
      overflow: hidden;
    }

    .categories-scroll-wrapper {
      display: flex;
      gap: 0.65rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;

      &::-webkit-scrollbar {
        height: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 4px;
      }
    }

    .cat-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.15rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);

      .cat-icon {
        font-size: 1rem;
        color: #64748b;
        transition: color 0.2s ease;
      }

      .cat-count {
        background-color: #f1f5f9;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        transition: all 0.2s ease;
      }

      &:hover {
        background-color: #f8fafc;
        border-color: #cbd5e1;
        color: #0f172a;

        .cat-icon {
          color: #1d4ed8;
        }
      }

      &.active {
        background-color: #1d4ed8;
        border-color: #1d4ed8;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);

        .cat-icon {
          color: #ffffff;
        }

        .cat-count {
          background-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
      }
    }
  `],
})
export class BibliotecaCategoryNavComponent {
  public readonly categories = input.required<readonly CategoryFilter[]>();
  public readonly selectedCategory = model.required<BookCategory>();
  public readonly categorySelected = output<BookCategory>();

  public onSelect(catId: BookCategory): void {
    this.selectedCategory.set(catId);
    this.categorySelected.emit(catId);
  }
}
