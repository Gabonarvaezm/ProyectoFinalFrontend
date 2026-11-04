import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-biblioteca-book-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="book-card"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      tabindex="0"
      [attr.aria-label]="'Detalles de ' + book().title"
    >
      <!-- Portada Visual Simulada con Gradiente Temático -->
      <div class="card-cover-wrapper" [class]="'cover-theme-' + (book().coverTheme || 'blue')">
        @if (book().featured) {
          <span class="badge-featured" title="Recurso destacado por el comité docente">
            <i class="bi bi-star-fill" aria-hidden="true"></i>
            <span>Destacado</span>
          </span>
        }

        <button
          type="button"
          class="btn-bookmark"
          [class.bookmarked]="isBookmarked()"
          (click)="onBookmark($event)"
          [attr.aria-label]="isBookmarked() ? 'Quitar de marcadores' : 'Guardar en marcadores'"
        >
          <i [class]="isBookmarked() ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'" aria-hidden="true"></i>
        </button>

        <div class="cover-content">
          <i class="bi bi-journal-richtext cover-icon" aria-hidden="true"></i>
          <span class="cover-topic">{{ book().subject || book().categoryLabel }}</span>
        </div>

        <span class="format-tag">
          {{ book().format.toUpperCase() }}
        </span>
      </div>

      <!-- Metadatos y Detalles del Libro -->
      <div class="card-body">
        <div class="card-header-meta">
          <span class="category-name">{{ book().category.toUpperCase() }}</span>
          <div class="rating-box" [attr.aria-label]="'Calificación: ' + book().rating + ' de 5'">
            <i class="bi bi-star-fill star-icon" aria-hidden="true"></i>
            <span class="rating-val">{{ book().rating }}</span>
          </div>
        </div>

        <h3 class="book-title">{{ book().title }}</h3>
        <p class="book-author">Por <strong>{{ book().author }}</strong></p>
        <p class="book-description">{{ book().description }}</p>

        <!-- Etiquetas Temáticas -->
        <div class="book-tags" aria-label="Temas clave">
          @for (tag of book().tags; track tag) {
            <span class="tag-pill">{{ tag }}</span>
          }
        </div>

        <!-- Pie de Tarjeta con Métricas e Institución -->
        <div class="card-footer-meta">
          <div class="institution-meta" [title]="book().institution">
            <i class="bi bi-bank" aria-hidden="true"></i>
            <span class="inst-text">{{ book().institution }}</span>
          </div>
          <span class="pages-meta">{{ book().pages }} págs.</span>
        </div>
      </div>

      <!-- Barra de Acciones de la Tarjeta -->
      <div class="card-action-bar">
        @if (userRole() === 'professor') {
          <button
            type="button"
            class="btn-card-action btn-recommend"
            (click)="onRecommend($event)"
            title="Recomendar esta lectura a los alumnos"
          >
            <i class="bi bi-share-fill" aria-hidden="true"></i>
            <span>Recomendar</span>
          </button>
        }
        <button
          type="button"
          class="btn-card-action btn-download"
          (click)="onDownload($event)"
          title="Descargar libro gratuito"
        >
          <i class="bi bi-cloud-arrow-down" aria-hidden="true"></i>
          <span>Descargar</span>
        </button>
        <button
          type="button"
          class="btn-card-action btn-read-primary"
          (click)="onCardClick()"
        >
          <i class="bi bi-book-half" aria-hidden="true"></i>
          <span>Consultar</span>
        </button>
      </div>
    </article>
  `,
  styles: [`
    .book-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.1);
        border-color: #cbd5e1;
      }
    }

    .card-cover-wrapper {
      height: 150px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;

      &.cover-theme-blue { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
      &.cover-theme-indigo { background: linear-gradient(135deg, #312e81 0%, #6366f1 100%); }
      &.cover-theme-purple { background: linear-gradient(135deg, #581c87 0%, #a855f7 100%); }
      &.cover-theme-emerald { background: linear-gradient(135deg, #064e3b 0%, #10b981 100%); }
      &.cover-theme-amber { background: linear-gradient(135deg, #78350f 0%, #f59e0b 100%); }
      &.cover-theme-rose { background: linear-gradient(135deg, #881337 0%, #f43f5e 100%); }
      &.cover-theme-slate { background: linear-gradient(135deg, #0f172a 0%, #475569 100%); }
    }

    .badge-featured {
      position: absolute;
      top: 0.85rem;
      left: 0.85rem;
      background-color: #fef08a;
      color: #854d0e;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .btn-bookmark {
      position: absolute;
      top: 0.85rem;
      right: 0.85rem;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background-color: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(15, 23, 42, 0.65);
      }

      &.bookmarked {
        background-color: #ffffff;
        color: #1d4ed8;
      }
    }

    .cover-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;

      .cover-icon {
        font-size: 2.25rem;
        opacity: 0.9;
      }

      .cover-topic {
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.95;
      }
    }

    .format-tag {
      position: absolute;
      bottom: 0.75rem;
      right: 0.85rem;
      background-color: rgba(0, 0, 0, 0.5);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .card-body {
      padding: 1.25rem 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.5rem;
    }

    .card-header-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .category-name {
        font-size: 0.725rem;
        font-weight: 700;
        color: #1d4ed8;
        letter-spacing: 0.04em;
      }

      .rating-box {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #d97706;

        .star-icon {
          font-size: 0.85rem;
        }
      }
    }

    .book-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.35;
      margin: 0;
    }

    .book-author {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    .book-description {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.45;
      margin: 0.25rem 0 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .book-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: auto;
      padding-top: 0.5rem;
    }

    .tag-pill {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      background-color: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .card-footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;

      .institution-meta {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        max-width: 170px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .card-action-bar {
      display: flex;
      padding: 0.75rem 1.25rem 1.25rem;
      gap: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-card-action {
      flex: 1;
      padding: 0.55rem 0.75rem;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      color: #334155;

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }

      &.btn-recommend {
        color: #7c3aed;
        background-color: #f5f3ff;
        border-color: #ddd6fe;

        &:hover {
          background-color: #ede9fe;
        }
      }

      &.btn-read-primary {
        background-color: #1d4ed8;
        color: #ffffff;
        border-color: #1d4ed8;

        &:hover {
          background-color: #1e40af;
        }
      }
    }
  `],
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

