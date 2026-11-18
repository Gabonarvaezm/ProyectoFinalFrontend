import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BookService } from './book.service';
import { STORAGE_KEYS } from '../models/auth.model';
import { CreateBookDto } from '../../biblioteca/models/book.model';

describe('BookService', () => {
  let service: BookService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);

    TestBed.configureTestingModule({
      providers: [BookService],
    });
    service = TestBed.inject(BookService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
  });

  it('debe crearse correctamente e inicializar el catálogo de libros y marcadores', () => {
    expect(service).toBeTruthy();
    expect(service.books().length).toBeGreaterThan(0);
    expect(service.bookmarkedIds().size).toBeGreaterThan(0);
  });

  it('debe crear un nuevo libro y persistirlo en localStorage', () => {
    const initialCount = service.books().length;
    const dto: CreateBookDto = {
      title: 'Física Universitaria Cuántica',
      author: 'Dra. María Curie',
      category: 'ciencias',
      pages: 320,
      year: 2026,
      format: 'PDF',
      description: 'Compendio avanzado de mecánica cuántica experimental.',
      tags: ['Física', 'Cuántica'],
      institution: 'Facultad de Ciencias Físicas',
    };

    const newBook = service.createBook(dto, 'Dra. María Curie');

    expect(newBook.id).toBeTruthy();
    expect(newBook.title).toBe('Física Universitaria Cuántica');
    expect(service.books().length).toBe(initialCount + 1);

    // Verificar en localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKS);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed[0].title).toBe('Física Universitaria Cuántica');
  });

  it('debe alternar el estado de marcador para un libro y persistirlo', () => {
    const bookId = 'test-book-99';
    expect(service.bookmarkedIds().has(bookId)).toBe(false);

    // Agregar a marcadores
    const added = service.toggleBookmark(bookId);
    expect(added).toBe(true);
    expect(service.bookmarkedIds().has(bookId)).toBe(true);

    const storedAfterAdd = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS)!);
    expect(storedAfterAdd).toContain(bookId);

    // Remover de marcadores
    const removed = service.toggleBookmark(bookId);
    expect(removed).toBe(false);
    expect(service.bookmarkedIds().has(bookId)).toBe(false);
  });
});
