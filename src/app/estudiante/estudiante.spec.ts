import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Estudiante } from './estudiante';

describe('Estudiante', () => {
  let component: Estudiante;
  let fixture: ComponentFixture<Estudiante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Estudiante],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Estudiante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializarse con el dashboard activo y el nombre del estudiante', () => {
    expect(component.activeNav()).toBe('dashboard');
    expect(component.studentName()).toBe('Alejandro');
    expect(component.navItems().length).toBe(6);
  });

  it('debe cambiar de navegación lateral con selectNav', () => {
    component.selectNav('biblioteca');
    expect(component.activeNav()).toBe('biblioteca');
    expect(component.toastMessage()).toContain('biblioteca');
  });

  it('debe filtrar materias de la biblioteca digital según searchQuery', () => {
    expect(component.filteredSubjects().length).toBe(4);

    component.searchQuery.set('matemáticas');
    expect(component.filteredSubjects().length).toBe(1);
    expect(component.filteredSubjects()[0].name).toBe('Matemáticas');

    component.searchQuery.set('no-existe');
    expect(component.filteredSubjects().length).toBe(0);
  });

  it('debe permitir continuar el curso activo y emitir toast', () => {
    component.onContinueCourse();
    expect(component.toastMessage()).toContain('Biología Celular');
  });

  it('debe permitir iniciar el examen de práctica', () => {
    component.onStartExam();
    expect(component.toastMessage()).toContain('Examen de Práctica');
  });

  it('debe permitir enviar mensajes al Asistente de IA y recibir respuesta simulada', async () => {
    vi.useFakeTimers();

    component.aiInputText.set('¿Qué es la mitosis?');
    component.submitAiMessage();

    expect(component.chatMessages().length).toBe(3); // 2 iniciales + 1 usuario
    expect(component.isAiThinking()).toBe(true);

    vi.advanceTimersByTime(700);

    expect(component.isAiThinking()).toBe(false);
    expect(component.chatMessages().length).toBe(4); // + 1 respuesta IA
    expect(component.chatMessages()[3].sender).toBe('ai');

    vi.useRealTimers();
  });

  it('debe ejecutar acciones rápidas del asistente IA', () => {
    vi.useFakeTimers();

    const action = component.quickActions()[0]; // 'summary'
    component.onQuickAction(action);

    expect(component.chatMessages().length).toBe(3);
    vi.advanceTimersByTime(700);
    expect(component.chatMessages()[3].text).toContain('Resumen de Mitosis');

    vi.useRealTimers();
  });

  it('debe manejar fallback de avatar si ocurre un error de carga', () => {
    expect(component.isAvatarBroken('q1')).toBe(false);
    component.onAvatarError('q1');
    expect(component.isAvatarBroken('q1')).toBe(true);
  });
});
