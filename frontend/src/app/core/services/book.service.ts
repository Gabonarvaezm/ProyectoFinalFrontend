import { effect } from '@angular/core';
import { AcademicSyncService } from './academic-sync.service';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Book, BookCategory, CreateBookDto } from '../../biblioteca/models/book.model';
import { INITIAL_BOOKS } from '../../biblioteca/data/books.data';
import { STORAGE_KEYS } from '../models/auth.model';

/**
 * Servicio Centralizado de Biblioteca y Libros (BookService).
 * Gestiona el catálogo de recursos bibliográficos académicos y favoritos con persistencia en el servidor compartido y caché local.
 */
@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sync = inject(AcademicSyncService);

  public readonly books = signal<Book[]>(this.loadInitialBooks());
  public readonly bookmarkedIds = signal<Set<string>>(this.loadInitialBookmarks());

  constructor() {
    effect(() => {
      const state = this.sync.snapshot();
      if (!state) {
        if (this.sync.enabled()) this.books.set([...INITIAL_BOOKS]);
        return;
      }
      this.books.set(state.books);
    });
  }

  private loadInitialBooks(): Book[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.BOOKS);
        if (stored) {
          const parsed = JSON.parse(stored) as Book[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[BookService] Error al leer libros de localStorage:', err);
      }
    }
    return INITIAL_BOOKS;
  }

  private loadInitialBookmarks(): Set<string> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          if (Array.isArray(parsed)) {
            return new Set(parsed);
          }
        }
      } catch (err) {
        console.warn('[BookService] Error al leer marcadores de localStorage:', err);
      }
    }
    return new Set(['bk-1', 'bk-3']);
  }

  private persistBooks(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(this.books()));
      } catch (err) {
        console.warn('[BookService] Error al persistir libros en localStorage:', err);
      }
    }
  }

  private persistBookmarks(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.BOOKMARKS,
          JSON.stringify(Array.from(this.bookmarkedIds()))
        );
      } catch (err) {
        console.warn('[BookService] Error al persistir marcadores en localStorage:', err);
      }
    }
  }

  /**
   * Crea y publica un nuevo libro en el repositorio académico (Rol Profesor)
   */
  public createBook(dto: CreateBookDto, professorName?: string): Book {
    const categoryLabels: Record<BookCategory, string> = {
      all: 'Todos los Recursos',
      ciencias: 'Ciencias Naturales',
      matematicas: 'Matemáticas y Lógica',
      tecnologia: 'Tecnología e IA',
      humanidades: 'Historia y Humanidades',
      lenguaje: 'Lenguaje y Literatura',
    };

    const newBook: Book = {
      id: `bk-${crypto.randomUUID()}`,
      title: dto.title.trim(),
      author: dto.author.trim() || professorName || 'Docente Investigador',
      category: dto.category,
      categoryLabel: categoryLabels[dto.category] ?? 'Recurso Académico',
      description: dto.description.trim(),
      coverImage:
        dto.coverImage?.trim() ||
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
      pages: dto.pages || 120,
      year: dto.year || new Date().getFullYear(),
      format: dto.format || 'PDF',
      rating: 5.0,
      reviewsCount: 0,
      readsCount: 0,
      institution: dto.institution?.trim() || 'Comunidad Docente DiscerIA',
      tags: dto.tags ?? [],
      featured: false,
    };

    this.books.update((current) => [newBook, ...current]);
    this.persistBooks();
    this.sync.publish('book.publish', newBook);
    return newBook;
  }

  /**
   * Alterna el estado de marcador/favorito para un libro
   */
  public toggleBookmark(bookId: string): boolean {
    const updated = new Set(this.bookmarkedIds());
    let isNowBookmarked = false;

    if (updated.has(bookId)) {
      updated.delete(bookId);
      isNowBookmarked = false;
    } else {
      updated.add(bookId);
      isNowBookmarked = true;
    }

    this.bookmarkedIds.set(updated);
    this.persistBookmarks();
    return isNowBookmarked;
  }

  /**
   * Busca un libro por su identificador
   */
  public getBookById(id: string): Book | undefined {
    return this.books().find((b) => b.id === id);
  }

  public recommendBook(book: Book): void {
    this.sync.publish('book.recommend', { id: book.id });
  }

  /**
   * Restablece el catálogo a los datos originales
   */
  public resetToDefaults(): void {
    this.books.set(INITIAL_BOOKS);
    this.persistBooks();
  }
}
