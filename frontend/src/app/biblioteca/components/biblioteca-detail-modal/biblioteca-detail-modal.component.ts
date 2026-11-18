import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-biblioteca-detail-modal',
  templateUrl: './biblioteca-detail-modal.component.html',
  styleUrl: './biblioteca-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaDetailModalComponent {
  public readonly book = input<Book | null>(null);
  public readonly isBookmarked = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly bookmarkToggled = output<Book>();
  public readonly startReading = output<Book>();
  public readonly downloaded = output<Book>();

  public onClose(): void {
    this.closeModal.emit();
  }

  public onBookmark(event: Event, book: Book): void {
    event.stopPropagation();
    this.bookmarkToggled.emit(book);
  }

  public onStartReading(book: Book): void {
    this.startReading.emit(book);
  }

  public onDownload(event: Event, book: Book): void {
    event.stopPropagation();
    this.downloaded.emit(book);
  }
}

