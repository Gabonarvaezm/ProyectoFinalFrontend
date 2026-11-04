import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book, BookCategory, CategoryFilter } from './models/book.model';
import { CATEGORIES, INITIAL_BOOKS } from './data/books.data';

@Component({
  imports: [FormsModule],
  selector: 'app-biblioteca',
  styleUrl: './biblioteca.scss',
  templateUrl: './biblioteca.html',
})
export class Biblioteca implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Inputs Modernos con Signals ──────────────────────────────────────────
  public readonly userRole = input<'student' | 'professor' | 'general'>('student');
  public readonly initialCategory = input<string | null>(null);

  // ── Outputs Modernos con output() ─────────────────────────────────────────
  public readonly bookSelected = output<Book>();
  public readonly bookRecommended = output<Book>();

  // ── Estado Reactivo de la Biblioteca (Signals) ───────────────────────────
  public readonly searchQuery = signal<string>('');
  public readonly selectedCategory = signal<BookCategory>('all');
  public readonly selectedFormat = signal<string>('all');
  public readonly books = signal<Book[]>(INITIAL_BOOKS);
  public readonly categories = signal<CategoryFilter[]>(CATEGORIES);

  /** Libro seleccionado para modal de lectura / detalle */
  public readonly selectedBook = signal<Book | null>(null);

  /** IDs de libros guardados en marcadores por el usuario */
  public readonly bookmarkedIds = signal<Set<string>>(new Set(['bk-1', 'bk-3']));

  /** Notificación flotante de feedback */
  public readonly toastFeedback = signal<string | null>(null);

  // ── Señales Computadas (Computed Signals) ─────────────────────────────────
  public readonly filteredBooks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const fmt = this.selectedFormat();

    return this.books().filter((book) => {
      // Filtro por categoría
      const matchesCategory = cat === 'all' || book.category === cat;

      // Filtro por formato
      const matchesFormat = fmt === 'all' || book.format.toLowerCase() === fmt.toLowerCase();

      // Filtro por texto (título, autor, etiquetas, institución)
      const matchesQuery =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query) ||
        book.institution.toLowerCase().includes(query) ||
        book.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesFormat && matchesQuery;
    });
  });

  public readonly totalCount = computed(() => this.filteredBooks().length);

  public readonly featuredBooks = computed(() =>
    this.books().filter((b) => b.featured)
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
    });
  }

  public ngOnInit(): void {
    const initCat = this.initialCategory();
    if (initCat) {
      const match = this.categories().find(
        (c) => c.id.toLowerCase() === initCat.toLowerCase() || c.label.toLowerCase().includes(initCat.toLowerCase())
      );
      if (match) {
        this.selectedCategory.set(match.id);
      }
    }
  }

  // ── Acciones de Filtrado y Búsqueda ──────────────────────────────────────

  public setCategory(catId: BookCategory): void {
    this.selectedCategory.set(catId);
  }

  public setFormat(format: string): void {
    this.selectedFormat.set(format);
  }

  public clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.selectedFormat.set('all');
  }

  // ── Interacciones con Libros ─────────────────────────────────────────────

  public openBookModal(book: Book): void {
    this.selectedBook.set(book);
    this.bookSelected.emit(book);
  }

  public closeBookModal(): void {
    this.selectedBook.set(null);
  }

  public toggleBookmark(book: Book, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.bookmarkedIds());
    const isSaved = current.has(book.id);

    if (isSaved) {
      current.delete(book.id);
      this.showToast(`"${book.title}" eliminado de tus marcadores.`);
    } else {
      current.add(book.id);
      this.showToast(`"${book.title}" guardado en tus marcadores de estudio.`);
    }

    this.bookmarkedIds.set(current);
  }

  public onRecommend(book: Book, event: Event): void {
    event.stopPropagation();
    this.bookRecommended.emit(book);
    this.showToast(`"${book.title}" recomendado a los alumnos de tu cohorte.`);
  }

  public onDownload(book: Book, event: Event): void {
    event.stopPropagation();
    this.showToast(`Iniciando descarga en formato ${book.format}: ${book.title}`);
  }

  public onStartReading(book: Book): void {
    this.showToast(`Abriendo lector digital: ${book.title}`);
  }

  public isBookmarked(bookId: string): boolean {
    return this.bookmarkedIds().has(bookId);
  }

  private showToast(msg: string): void {
    this.toastFeedback.set(msg);
    const timer = setTimeout(() => {
      this.toastFeedback.set(null);
    }, 3200);
    this.timerIds.push(timer);
  }
}
