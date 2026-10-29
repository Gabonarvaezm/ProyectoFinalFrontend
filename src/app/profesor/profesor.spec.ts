import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Profesor } from './profesor';

describe('Profesor Component', () => {
  let component: Profesor;
  let fixture: ComponentFixture<Profesor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profesor],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Profesor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar las métricas y la navegación por defecto', () => {
    expect(component.activeNav()).toBe('dashboard');
    expect(component.navItems().length).toBeGreaterThan(0);
    expect(component.kpiMetrics().length).toBe(3);
    expect(component.students().length).toBeGreaterThanOrEqual(3);
  });

  it('debe permitir cambiar la pestaña de navegación activa', () => {
    component.selectNav('biblioteca');
    expect(component.activeNav()).toBe('biblioteca');
  });

  it('debe abrir, resetear y cerrar el modal de registro de estudiantes', () => {
    expect(component.isRegisterModalOpen()).toBe(false);

    component.openRegisterModal();
    expect(component.isRegisterModalOpen()).toBe(true);
    expect(component.studentForm.get('score')?.value).toBe(75);

    component.closeRegisterModal();
    expect(component.isRegisterModalOpen()).toBe(false);
  });

  it('debe validar y registrar un nuevo estudiante a través del formulario reactivo', () => {
    component.openRegisterModal();

    // Formulario inválido inicialmente
    component.studentForm.setValue({
      studentName: '',
      email: 'correo-invalido',
      topic: '',
      score: 150, // Inválido (> 100)
      status: 'active',
    });
    expect(component.studentForm.invalid).toBe(true);

    component.onRegisterStudentSubmit();
    expect(component.isRegisterModalOpen()).toBe(true); // No se cierra si es inválido

    // Completar con datos válidos
    const initialCount = component.students().length;
    component.studentForm.setValue({
      studentName: 'Gabriel Narváez',
      email: 'gabriel@universidad.edu',
      topic: 'Biología Celular',
      score: 90,
      status: 'active',
    });
    expect(component.studentForm.valid).toBe(true);

    component.onRegisterStudentSubmit();
    expect(component.isRegisterModalOpen()).toBe(false);
    expect(component.students().length).toBe(initialCount + 1);
    expect(component.students()[0].studentName).toBe('Gabriel Narváez');
  });

  it('debe filtrar los estudiantes reactivamente al buscar', () => {
    component.searchQuery.set('María');
    expect(component.filteredStudents().length).toBe(1);
    expect(component.filteredStudents()[0].studentName).toBe('María López');

    component.searchQuery.set('InexistenteXYZ');
    expect(component.filteredStudents().length).toBe(0);

    component.searchQuery.set('');
    expect(component.filteredStudents().length).toBeGreaterThanOrEqual(3);
  });

  it('debe enviar mensajes al Asistente de IA y recibir respuesta dinámica basada en los alumnos', () => {
    vi.useFakeTimers();

    component.aiInputText.set('¿Cuáles estudiantes necesitan atención prioritaria?');
    component.submitAiMessage();

    expect(component.chatMessages().length).toBe(1);
    expect(component.isAiThinking()).toBe(true);

    vi.advanceTimersByTime(700);

    expect(component.isAiThinking()).toBe(false);
    expect(component.chatMessages().length).toBe(2);
    expect(component.chatMessages()[1].sender).toBe('ai');
    // La respuesta debe identificar dinámicamente a los alumnos con score < 50
    expect(component.chatMessages()[1].text).toContain('Carlos Pérez');

    vi.useRealTimers();
  });

  it('debe permitir eliminar un estudiante de la lista', () => {
    const student = component.students()[0];
    const initialCount = component.students().length;

    const dummyEvent = new MouseEvent('click');
    component.onDeleteStudent(student, dummyEvent);

    expect(component.students().length).toBe(initialCount - 1);
    expect(component.actionNotification()).toContain('eliminado');
  });

  it('debe registrar recomendación de libro en la clase', () => {
    const mockBook = {
      id: 'bk-test',
      title: 'Biología General',
      author: 'Autor Test',
      category: 'ciencias' as const,
      categoryLabel: 'Ciencias Naturales',
      description: 'Desc',
      coverImage: 'img.jpg',
      pages: 100,
      year: 2024,
      format: 'PDF' as const,
      rating: 5,
      reviewsCount: 1,
      readsCount: 10,
      institution: 'Inst',
      tags: ['bio'],
      featured: false,
    };

    component.onBookRecommended(mockBook);
    expect(component.actionNotification()).toContain('Biología General');
  });
});
