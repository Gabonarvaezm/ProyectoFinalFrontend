import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LibroComponent } from './libro.component';
import { CreateBookDto } from '../biblioteca/models/book.model';

describe('LibroComponent', () => {
  let component: LibroComponent;
  let fixture: ComponentFixture<LibroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LibroComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el formulario reactivo con controles requeridos', () => {
    expect(component.bookForm).toBeDefined();
    expect(component.bookForm.get('title')).toBeTruthy();
    expect(component.bookForm.get('author')).toBeTruthy();
    expect(component.bookForm.get('category')).toBeTruthy();
    expect(component.bookForm.get('format')).toBeTruthy();
    expect(component.bookForm.get('description')).toBeTruthy();
    expect(component.bookForm.get('pages')).toBeTruthy();
    expect(component.bookForm.get('year')).toBeTruthy();
    expect(component.bookForm.get('tags')).toBeTruthy();
    expect(component.bookForm.get('coverImage')).toBeTruthy();
  });

  it('debe invalidar el formulario si los campos obligatorios están vacíos', () => {
    component.bookForm.patchValue({
      title: '',
      author: '',
      description: '',
      pages: '',
      tags: '',
    });

    expect(component.bookForm.invalid).toBe(true);
  });

  it('no debe emitir bookCreated si el formulario es inválido al enviar', () => {
    let emitted = false;
    component.bookCreated.subscribe(() => {
      emitted = true;
    });

    component.bookForm.patchValue({
      title: '',
    });

    component.onSubmit();

    expect(emitted).toBe(false);
    expect(component.bookForm.get('title')?.touched).toBe(true);
  });

  it('debe validar la longitud mínima y máxima del título', () => {
    const titleCtrl = component.bookForm.get('title');
    titleCtrl?.setValue('AB');
    expect(titleCtrl?.invalid).toBe(true);

    titleCtrl?.setValue('Cálculo Vectorial Avanzado');
    expect(titleCtrl?.valid).toBe(true);
  });

  it('debe validar el rango numérico de páginas y año', () => {
    const pagesCtrl = component.bookForm.get('pages');
    pagesCtrl?.setValue(0);
    expect(pagesCtrl?.invalid).toBe(true);

    pagesCtrl?.setValue(350);
    expect(pagesCtrl?.valid).toBe(true);

    const yearCtrl = component.bookForm.get('year');
    yearCtrl?.setValue(1850);
    expect(yearCtrl?.invalid).toBe(true);

    yearCtrl?.setValue(2024);
    expect(yearCtrl?.valid).toBe(true);
  });

  it('debe emitir bookCreated con el DTO correcto cuando el formulario es válido', () => {
    let emittedDto: CreateBookDto | undefined;
    component.bookCreated.subscribe((dto) => {
      emittedDto = dto;
    });

    component.bookForm.patchValue({
      title: 'Estructuras de Datos y Algoritmos',
      author: 'Dra. Alan Turing',
      category: 'tecnologia',
      format: 'PDF',
      description: 'Texto introductorio sobre grafos, árboles y complejidad temporal con Python.',
      pages: 320,
      year: 2024,
      tags: 'Algoritmos, Estructuras, Grafos',
      coverImage: 'https://ejemplo.com/portada.png',
    });

    component.onSubmit();

    expect(emittedDto).toBeDefined();
    const result = emittedDto as unknown as CreateBookDto;
    expect(result.title).toBe('Estructuras de Datos y Algoritmos');
    expect(result.author).toBe('Dra. Alan Turing');
    expect(result.category).toBe('tecnologia');
    expect(result.format).toBe('PDF');
    expect(result.pages).toBe(320);
    expect(result.year).toBe(2024);
    expect(result.tags).toEqual(['Algoritmos', 'Estructuras', 'Grafos']);
    expect(result.coverImage).toBe('https://ejemplo.com/portada.png');
  });

  it('debe emitir closeModal al invocar onClose()', () => {
    let closed = false;
    component.closeModal.subscribe(() => {
      closed = true;
    });

    component.onClose();
    expect(closed).toBe(true);
  });

  it('debe calcular la longitud de la descripción con getDescriptionLength()', () => {
    const text = 'Descripción de prueba para el libro académico.';
    component.bookForm.patchValue({ description: text });
    expect(component.getDescriptionLength()).toBe(text.length);
  });

  it('debe detectar campos inválidos tocados con isFieldInvalid()', () => {
    const titleCtrl = component.bookForm.get('title');
    titleCtrl?.setValue('');
    titleCtrl?.markAsTouched();

    expect(component.isFieldInvalid('title')).toBe(true);

    titleCtrl?.setValue('Título Válido');
    expect(component.isFieldInvalid('title')).toBe(false);
  });
});

