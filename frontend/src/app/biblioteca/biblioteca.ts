import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { Book, BookCategory, CategoryFilter, CreateBookDto } from './models/book.model';
import { CATEGORIES, INITIAL_BOOKS } from './data/books.data';
import {
  BibliotecaBookCardComponent,
  BibliotecaCategoryNavComponent,
  BibliotecaDetailModalComponent,
  BibliotecaHeaderComponent,
  BibliotecaSidebarComponent,
  BibliotecaTopbarComponent,
} from './components';
import { LibroComponent } from '../libro/libro.component';
import { AuthService } from '../core/services/auth.service';

@Component({
  imports: [
    CommonModule,
    NgTemplateOutlet,
    BibliotecaHeaderComponent,
    BibliotecaCategoryNavComponent,
    BibliotecaBookCardComponent,
    BibliotecaDetailModalComponent,
    BibliotecaSidebarComponent,
    BibliotecaTopbarComponent,
    LibroComponent,
  ],
  selector: 'app-biblioteca',
  styleUrl: './biblioteca.scss',
  templateUrl: './biblioteca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Biblioteca implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  // ── Inputs y Outputs Públicos del Módulo ──────────────────────────────────
  public readonly userRole = input<'student' | 'professor' | 'general'>('student');
  public readonly initialCategory = input<string | null>(null);
  public readonly isEmbedded = input<boolean>(false);

  public readonly bookSelected = output<Book>();
  public readonly bookRecommended = output<Book>();

  // ── Usuario y Rutas Institucionales ───────────────────────────────────────
  public readonly currentUser = this.authService.currentUser;

  public readonly dashboardRoute = computed<string>(() =>
    this.isProfessor() ? '/profesor' : '/estudiante'
  );

  public readonly userName = computed<string>(() => {
    const user = this.currentUser();
    if (user?.fullName) return user.fullName;
    return this.isProfessor() ? 'Prof. Carlos Mendoza' : 'Alejandro Silva';
  });

  public readonly userInitials = computed<string>(() => {
    const name = this.userName().trim();
    if (!name) return 'US';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  // ── Estado Reactivo Central ───────────────────────────────────────────────
  public readonly searchQuery = signal<string>('');
  public readonly selectedCategory = signal<BookCategory>('all');
  public readonly selectedFormat = signal<string>('all');
  public readonly books = signal<Book[]>(INITIAL_BOOKS);

  public readonly categories = computed<CategoryFilter[]>(() => {
    const all = this.books();
    return CATEGORIES.map((cat) => ({
      ...cat,
      count: cat.id === 'all' ? all.length : all.filter((b) => b.category === cat.id).length,
    }));
  });

  // ── Computed: Privilegios del docente ─────────────────────────────────────
  public readonly isProfessor = computed(
    () =>
      this.userRole() === 'professor' ||
      this.authService.currentUser()?.role === 'professor'
  );

  // ── Computed: Institución del usuario autenticado ─────────────────────────
  public readonly userInstitution = computed(
    () => this.authService.currentUser()?.institution ?? 'Universidad Tecnológica Pública'
  );

  // ── Estado del Modal de Creación (gestionado por el Padre) ───────────────
  public readonly isCreateBookOpen = signal<boolean>(false);
  public readonly isSavingBook = signal<boolean>(false);

  // ── Estado del Modal de Detalle ───────────────────────────────────────────
  public readonly selectedBook = signal<Book | null>(null);

  /** IDs de libros en marcadores del usuario */
  public readonly bookmarkedIds = signal<Set<string>>(new Set(['bk-1', 'bk-3']));

  /** Toast de feedback flotante */
  public readonly toastFeedback = signal<string | null>(null);

  // ── Computed: Libros filtrados ────────────────────────────────────────────
  public readonly filteredBooks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const fmt = this.selectedFormat();

    return this.books().filter((book) => {
      const matchesCategory = cat === 'all' || book.category === cat;
      const matchesFormat = fmt === 'all' || book.format.toLowerCase() === fmt.toLowerCase();
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
        (c) =>
          c.id.toLowerCase() === initCat.toLowerCase() ||
          c.label.toLowerCase().includes(initCat.toLowerCase())
      );
      if (match) this.selectedCategory.set(match.id);
    }
  }

  // ── Navegación y Acciones del Topbar y Sidebar ─────────────────────────────

  public onTopbarSearch(query: string): void {
    this.searchQuery.set(query);
  }

  public onAiClicked(): void {
    this.router.navigate(['/chatbot']);
  }

  public onNotificationsClicked(): void {
    this.showToast('Tienes 2 avisos académicos y recomendaciones nuevas.');
  }

  public onConfigClicked(): void {
    this.router.navigate(['/configuracion']);
  }

  // ── Gestión del Modal de Creación (delegada al hijo LibroComponent) ───────

  public openCreateBookModal(): void {
    if (!this.isProfessor()) {
      this.showToast('Acceso restringido: Solo los docentes pueden publicar libros.');
      return;
    }
    this.isCreateBookOpen.set(true);
  }

  public closeCreateBookModal(): void {
    this.isCreateBookOpen.set(false);
  }

  /**
   * El padre recibe el DTO emitido por LibroComponent y lo persiste localmente.
   * Esta es la única responsabilidad del padre en cuanto a la creación del libro.
   */
  public handleBookCreated(dto: CreateBookDto): void {
    this.isSavingBook.set(true);

    // Construcción del libro completo (el padre determina id, rating, etc.)
    const categoryData = this.categories().find((c) => c.id === dto.category);
    const newBook: Book = {
      id: `bk-${Date.now()}`,
      title: dto.title,
      author: dto.author,
      category: dto.category,
      categoryLabel: categoryData?.label ?? 'Recurso Académico',
      description: dto.description,
      coverImage:
        dto.coverImage?.trim() ||
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
      pages: dto.pages,
      year: dto.year,
      format: dto.format,
      rating: 5.0,
      reviewsCount: 0,
      readsCount: 0,
      institution: dto.institution ?? 'Comunidad Docente DiscerIA',
      tags: dto.tags,
      featured: false,
    };

    this.books.update((current) => [newBook, ...current]);
    this.isCreateBookOpen.set(false);
    this.isSavingBook.set(false);
    this.showToast(`"${newBook.title}" publicado con éxito en el repositorio.`);
  }

  // ── Coordinación de Eventos entre Nodos Hijos ─────────────────────────────

  public setCategory(catId: BookCategory): void {
    this.selectedCategory.set(catId);
  }

  public setFormat(format: string): void {
    this.selectedFormat.set(format);
  }

  public onCategorySelected(catId: BookCategory): void {
    this.setCategory(catId);
  }

  public onFormatChanged(format: string): void {
    this.setFormat(format);
  }

  public clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.selectedFormat.set('all');
  }

  public openBookModal(book: Book): void {
    this.selectedBook.set(book);
    this.bookSelected.emit(book);
  }

  public closeBookModal(): void {
    this.selectedBook.set(null);
  }

  public toggleBookmark(book: Book, event?: Event): void {
    event?.stopPropagation();
    const current = new Set(this.bookmarkedIds());
    if (current.has(book.id)) {
      current.delete(book.id);
      this.showToast(`"${book.title}" eliminado de tus marcadores.`);
    } else {
      current.add(book.id);
      this.showToast(`"${book.title}" guardado en tus marcadores de estudio.`);
    }
    this.bookmarkedIds.set(current);
  }

  public onRecommend(book: Book, event?: Event): void {
    event?.stopPropagation();
    this.bookRecommended.emit(book);
    this.showToast(`"${book.title}" recomendado a los alumnos de tu cohorte.`);
  }

  public onDownload(book: Book, event?: Event): void {
    event?.stopPropagation();
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
    const timer = setTimeout(() => this.toastFeedback.set(null), 3200);
    this.timerIds.push(timer);
  }
}
