export type BookFormat = 'PDF' | 'EPUB' | 'Interactivo';

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
}

export interface CategoryFilter {
  id: BookCategory;
  label: string;
  icon: string;
}

