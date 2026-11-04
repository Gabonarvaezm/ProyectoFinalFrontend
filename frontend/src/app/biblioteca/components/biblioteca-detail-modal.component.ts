import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-biblioteca-detail-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (book(); as currentBook) {
      <div
        class="modal-backdrop"
        (click)="onClose()"
        (keydown.escape)="onClose()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'modal-title-' + currentBook.id"
      >
        <div class="modal-card" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="modal-header-left">
              <span class="modal-badge-format">{{ currentBook.format.toUpperCase() }}</span>
              <span class="modal-badge-category">{{ currentBook.category.toUpperCase() }}</span>
            </div>
            <button
              type="button"
              class="btn-close-modal"
              (click)="onClose()"
              aria-label="Cerrar detalles del libro"
            >
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </header>

          <div class="modal-body-scroll">
            <div class="modal-hero-cover" [class]="'cover-theme-' + (currentBook.coverTheme || 'blue')">
              <i class="bi bi-journal-bookmark-fill modal-hero-icon" aria-hidden="true"></i>
              <span class="modal-hero-subject">{{ currentBook.subject || currentBook.categoryLabel }}</span>
            </div>

            <div class="modal-main-details">
              <div class="rating-row">
                <div class="stars-group">
                  <i class="bi bi-star-fill star-gold" aria-hidden="true"></i>
                  <span class="rating-number">{{ currentBook.rating }} / 5.0</span>
                </div>
                <span class="downloads-stat">
                  <i class="bi bi-download" aria-hidden="true"></i>
                  {{ currentBook.downloadsCount || currentBook.readsCount }} descargas académicas
                </span>
              </div>

              <h2 [id]="'modal-title-' + currentBook.id" class="modal-book-title">
                {{ currentBook.title }}
              </h2>
              <p class="modal-author-text">
                Autor: <strong>{{ currentBook.author }}</strong>
              </p>

              <div class="meta-pills-row">
                <span class="meta-item-pill">
                  <i class="bi bi-bank" aria-hidden="true"></i>
                  {{ currentBook.institution }}
                </span>
                <span class="meta-item-pill">
                  <i class="bi bi-file-earmark-text" aria-hidden="true"></i>
                  {{ currentBook.pages }} páginas
                </span>
                <span class="meta-item-pill">
                  <i class="bi bi-calendar-event" aria-hidden="true"></i>
                  Año {{ currentBook.year }}
                </span>
              </div>

              <div class="synopsis-box">
                <h4 class="synopsis-title">Sinopsis y Contenido Pedagógico</h4>
                <p class="synopsis-text">{{ currentBook.description }}</p>
              </div>

              <div class="modal-tags-section">
                <h4 class="tags-section-title">Palabras Clave y Temas de Aprendizaje</h4>
                <div class="tags-row">
                  @for (tag of currentBook.tags; track tag) {
                    <span class="modal-tag">{{ tag }}</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <button
              type="button"
              class="btn-modal-bookmark"
              [class.active]="isBookmarked()"
              (click)="onBookmark($event, currentBook)"
            >
              <i [class]="isBookmarked() ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'" aria-hidden="true"></i>
              <span>{{ isBookmarked() ? 'Guardado' : 'Guardar' }}</span>
            </button>
            <button
              type="button"
              class="btn-modal-download"
              (click)="onDownload($event, currentBook)"
            >
              <i class="bi bi-cloud-arrow-down-fill" aria-hidden="true"></i>
              <span>Descargar</span>
            </button>
            <button
              type="button"
              class="btn-modal-read"
              (click)="onStartReading(currentBook)"
            >
              <i class="bi bi-book-half" aria-hidden="true"></i>
              <span>Abrir Lectura</span>
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease;
    }

    .modal-card {
      background-color: #ffffff;
      border-radius: 20px;
      max-width: 680px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header-left {
      display: flex;
      gap: 0.5rem;
    }

    .modal-badge-format {
      background-color: #1d4ed8;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
    }

    .modal-badge-category {
      background-color: #eff6ff;
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
    }

    .btn-close-modal {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.15rem;
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 8px;
      transition: all 0.15s ease;

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
    }

    .modal-body-scroll {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-hero-cover {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      gap: 0.4rem;

      &.cover-theme-blue { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
      &.cover-theme-indigo { background: linear-gradient(135deg, #312e81 0%, #6366f1 100%); }
      &.cover-theme-purple { background: linear-gradient(135deg, #581c87 0%, #a855f7 100%); }
      &.cover-theme-emerald { background: linear-gradient(135deg, #064e3b 0%, #10b981 100%); }
      &.cover-theme-amber { background: linear-gradient(135deg, #78350f 0%, #f59e0b 100%); }
      &.cover-theme-rose { background: linear-gradient(135deg, #881337 0%, #f43f5e 100%); }
      &.cover-theme-slate { background: linear-gradient(135deg, #0f172a 0%, #475569 100%); }

      .modal-hero-icon {
        font-size: 2.25rem;
      }
      .modal-hero-subject {
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .modal-main-details {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .rating-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .stars-group {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: #d97706;
        font-weight: 700;
        font-size: 0.9rem;
      }

      .downloads-stat {
        font-size: 0.825rem;
        color: #64748b;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
    }

    .modal-book-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin: 0;
    }

    .modal-author-text {
      font-size: 0.9rem;
      color: #475569;
      margin: 0;
    }

    .meta-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .meta-item-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background-color: #f1f5f9;
        color: #334155;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
      }
    }

    .synopsis-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.15rem;

      .synopsis-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.5rem;
      }

      .synopsis-text {
        font-size: 0.875rem;
        color: #334155;
        line-height: 1.6;
        margin: 0;
      }
    }

    .modal-tags-section {
      .tags-section-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.5rem;
      }

      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;

        .modal-tag {
          background-color: #eff6ff;
          color: #1d4ed8;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
        }
      }
    }

    .modal-footer {
      display: flex;
      padding: 1.25rem 1.5rem;
      gap: 0.75rem;
      border-top: 1px solid #e2e8f0;
      background-color: #f8fafc;

      button {
        padding: 0.75rem 1.25rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        transition: all 0.2s ease;
      }

      .btn-modal-bookmark {
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
        color: #334155;

        &.active {
          color: #1d4ed8;
          border-color: #bfdbfe;
          background-color: #eff6ff;
        }
      }

      .btn-modal-download {
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
        color: #334155;

        &:hover {
          background-color: #f1f5f9;
        }
      }

      .btn-modal-read {
        flex: 1;
        border: none;
        background-color: #1d4ed8;
        color: #ffffff;

        &:hover {
          background-color: #1e40af;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
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

