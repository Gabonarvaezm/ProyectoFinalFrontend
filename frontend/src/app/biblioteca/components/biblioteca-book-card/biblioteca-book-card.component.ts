import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-biblioteca-book-card',
  templateUrl: './biblioteca-book-card.component.html',
  styleUrl: './biblioteca-book-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaBookCardComponent {
  public readonly book = input.required<Book>();
  public readonly isBookmarked = input<boolean>(false);
  public readonly userRole = input<'student' | 'professor' | 'general'>('student');

  public readonly cardClicked = output<Book>();
  public readonly bookmarkToggled = output<Book>();
  public readonly recommended = output<Book>();
  public readonly downloaded = output<Book>();

  public onCardClick(): void {
    this.cardClicked.emit(this.book());
  }

  public onBookmark(event: Event): void {
    event.stopPropagation();
    this.bookmarkToggled.emit(this.book());
  }

  public onRecommend(event: Event): void {
    event.stopPropagation();
    this.recommended.emit(this.book());
  }

  public onDownload(event: Event): void {
    event.stopPropagation();
    this.downloaded.emit(this.book());
  }
}

