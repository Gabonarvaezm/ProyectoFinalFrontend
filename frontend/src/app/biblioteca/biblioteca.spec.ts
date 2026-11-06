import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Biblioteca } from './biblioteca';
import { Book, CreateBookDto } from './models/book.model';

describe('Biblioteca Component', () => {
  let component: Biblioteca;
  let fixture: ComponentFixture<Biblioteca>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Biblioteca],
    }).compileComponents();

    fixture = TestBed.createComponent(Biblioteca);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el catálogo de libros y categorías', () => {
    expect(component.books().length).toBeGreaterThanOrEqual(8);
    expect(component.categories().length).toBeGreaterThanOrEqual(5);
    expect(component.selectedCategory()).toBe('all');
    expect(component.selectedFormat()).toBe('all');
    expect(component.totalCount()).toBe(component.books().length);
    expect(component.featuredBooks().length).toBeGreaterThan(0);
  });

  it('debe filtrar libros reactivamente por categoría', () => {
    component.setCategory('ciencias');
    expect(component.selectedCategory()).toBe('ciencias');
    expect(component.filteredBooks().every((b) => b.category === 'ciencias')).toBe(true);
    expect(component.totalCount()).toBeGreaterThan(0);

    component.setCategory('matematicas');
    expect(component.filteredBooks().every((b) => b.category === 'matematicas')).toBe(true);
  });

  it('debe filtrar libros por formato (PDF, EPUB, Interactivo)', () => {
    component.setFormat('pdf');
    expect(component.selectedFormat()).toBe('pdf');
    expect(component.filteredBooks().every((b) => b.format.toLowerCase() === 'pdf')).toBe(true);

    component.setFormat('epub');
    expect(component.filteredBooks().every((b) => b.format.toLowerCase() === 'epub')).toBe(true);

    component.setFormat('interactivo');
    expect(component.filteredBooks().every((b) => b.format.toLowerCase() === 'interactivo')).toBe(true);
  });

  it('debe filtrar libros por texto de búsqueda en título, autor, o tags', () => {
    component.searchQuery.set('cálculo');
    expect(component.filteredBooks().length).toBeGreaterThan(0);
    expect(
      component.filteredBooks().some((b) => b.title.toLowerCase().includes('cálculo'))
    ).toBe(true);

    component.searchQuery.set('Sotomayor');
    expect(component.filteredBooks().length).toBe(1);
    expect(component.filteredBooks()[0].author).toContain('Sotomayor');

    component.searchQuery.set('TerminoInexistenteXYZ');
    expect(component.filteredBooks().length).toBe(0);
    expect(component.totalCount()).toBe(0);
  });

  it('debe limpiar los filtros con clearFilters', () => {
    component.searchQuery.set('biología');
    component.setCategory('ciencias');
    component.setFormat('pdf');

    component.clearFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.selectedCategory()).toBe('all');
    expect(component.selectedFormat()).toBe('all');
    expect(component.totalCount()).toBe(component.books().length);
  });

  it('debe alternar el estado de marcadores con toggleBookmark', () => {
    const book = component.books()[0];
    const initialBookmarkStatus = component.isBookmarked(book.id);
    const dummyEvent = new MouseEvent('click');

    component.toggleBookmark(book, dummyEvent);
    expect(component.isBookmarked(book.id)).toBe(!initialBookmarkStatus);
    expect(component.toastFeedback()).toBeTruthy();

    // Revertir
    component.toggleBookmark(book, dummyEvent);
    expect(component.isBookmarked(book.id)).toBe(initialBookmarkStatus);
  });

  it('debe abrir y cerrar el modal de detalle del libro y emitir bookSelected', () => {
    const book = component.books()[0];
    let emittedBook: Book | null = null;
    component.bookSelected.subscribe((b) => {
      emittedBook = b;
    });

    component.openBookModal(book);
    expect(component.selectedBook()).toBe(book);
    expect(emittedBook).toBe(book);

    component.closeBookModal();
    expect(component.selectedBook()).toBeNull();
  });

  it('debe emitir bookRecommended cuando un docente recomienda un libro', () => {
    const book = component.books()[1];
    let recommended: Book | null = null;
    component.bookRecommended.subscribe((b) => {
      recommended = b;
    });

    const dummyEvent = new MouseEvent('click');
    component.onRecommend(book, dummyEvent);

    expect(recommended).toBe(book);
    expect(component.toastFeedback()).toContain('recomendado a los alumnos');
  });

  it('debe inicializar con categoría inicial si se provee initialCategory', () => {
    const fixtureWithInput = TestBed.createComponent(Biblioteca);
    fixtureWithInput.componentRef.setInput('initialCategory', 'ciencias');
    fixtureWithInput.detectChanges();

    expect(fixtureWithInput.componentInstance.selectedCategory()).toBe('ciencias');
  });

  it('debe notificar al iniciar la lectura digital o descarga', () => {
    const book = component.books()[0];
    const dummyEvent = new MouseEvent('click');

    component.onStartReading(book);
    expect(component.toastFeedback()).toContain('Abriendo lector digital');

    component.onDownload(book, dummyEvent);
    expect(component.toastFeedback()).toContain('Iniciando descarga');
  });

  // ── Pruebas de Integración de LibroComponent y Seguridad por Roles ───────

  it('debe verificar que isProfessor es false por defecto para estudiantes', () => {
    expect(component.isProfessor()).toBe(false);
  });

  it('debe reconocer permisos de profesor cuando userRole es "professor"', () => {
    const profFixture = TestBed.createComponent(Biblioteca);
    profFixture.componentRef.setInput('userRole', 'professor');
    profFixture.detectChanges();

    expect(profFixture.componentInstance.isProfessor()).toBe(true);
  });

  it('debe bloquear la apertura del modal de creación a usuarios que no sean profesores', () => {
    expect(component.isProfessor()).toBe(false);
    component.openCreateBookModal();

    expect(component.isCreateBookOpen()).toBe(false);
    expect(component.toastFeedback()).toContain('Acceso restringido');
  });

  it('debe permitir abrir y cerrar el modal de creación si el usuario es profesor', () => {
    const profFixture = TestBed.createComponent(Biblioteca);
    profFixture.componentRef.setInput('userRole', 'professor');
    profFixture.detectChanges();

    const profComp = profFixture.componentInstance;
    profComp.openCreateBookModal();
    expect(profComp.isCreateBookOpen()).toBe(true);

    profComp.closeCreateBookModal();
    expect(profComp.isCreateBookOpen()).toBe(false);
  });

  it('debe agregar el nuevo libro al catálogo cuando handleBookCreated es invocado', () => {
    const initialCount = component.books().length;
    const dto: CreateBookDto = {
      title: 'Neurociencia Cognitiva y Aprendizaje',
      author: 'Dr. Santiago Ramón',
      category: 'ciencias',
      format: 'PDF',
      description: 'Estudio de los mecanismos neuronales involucrados en la adquisición de conocimiento.',
      pages: 350,
      year: 2024,
      tags: ['Cerebro', 'Neurociencia', 'Aprendizaje'],
      coverImage: 'https://ejemplo.com/neuro.jpg',
      institution: 'Universidad Central',
    };

    component.handleBookCreated(dto);

    expect(component.books().length).toBe(initialCount + 1);
    const addedBook = component.books()[0];
    expect(addedBook.title).toBe(dto.title);
    expect(addedBook.author).toBe(dto.author);
    expect(addedBook.category).toBe(dto.category);
    expect(addedBook.pages).toBe(350);
    expect(component.isCreateBookOpen()).toBe(false);
    expect(component.toastFeedback()).toContain('publicado con éxito');
  });
});
