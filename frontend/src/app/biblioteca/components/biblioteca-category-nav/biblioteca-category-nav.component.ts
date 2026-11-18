import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { BookCategory, CategoryFilter } from '../../models/book.model';

@Component({
  selector: 'app-biblioteca-category-nav',
  templateUrl: './biblioteca-category-nav.component.html',
  styleUrl: './biblioteca-category-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

