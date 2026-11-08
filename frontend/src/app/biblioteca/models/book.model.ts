export type BookFormat = 'PDF' | 'EPUB' | 'Interactivo';

export const BOOK_FORMATS: readonly BookFormat[] = ['PDF', 'EPUB', 'Interactivo'] as const;

export type BookCategory =
  | 'all'
  | 'ciencias'
  | 'matematicas'
  | 'tecnologia'
  | 'humanidades'
  | 'lenguaje';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  categoryLabel: string;
  description: string;
  coverImage: string;
  pages: number;
  year: number;
  format: BookFormat;
  rating: number;
  reviewsCount: number;
  readsCount: number;
  institution: string;
  tags: string[];
  featured?: boolean;
  coverTheme?: string;
  subject?: string;
  downloadsCount?: number;
}

/**
 * DTO para la creación de un nuevo libro académico.
 * Usado exclusivamente en el flujo del componente Libro (Reactive Form → Padre).
 */
export interface CreateBookDto {
  title: string;
  author: string;
  category: BookCategory;
  format: BookFormat;
  description: string;
  pages: number;
  year: number;
  tags: string[];
  coverImage?: string;
  institution?: string;
}

export interface CategoryFilter {
  id: BookCategory;
  label: string;
  icon: string;
  count?: number;
}
