import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaProfesorFormComponent } from './tarea-profesor-form.component';
import { CreateTareaDto } from '../../models/tarea.model';

describe('TareaProfesorFormComponent', () => {
  let component: TareaProfesorFormComponent;
  let fixture: ComponentFixture<TareaProfesorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaProfesorFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TareaProfesorFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar el formulario con validaciones', () => {
    expect(component).toBeTruthy();
    expect(component.form).toBeDefined();
    expect(component.form.get('title')?.valid).toBe(false); // Vacío inicialmente
  });

  it('no debe emitir tareaCreated si el formulario es inválido', () => {
    let emitted = false;
    component.tareaCreated.subscribe(() => (emitted = true));

    component.onSubmit();
    expect(emitted).toBe(false);
    expect(component.form.touched).toBe(true);
  });

  it('debe validar y emitir tareaCreated al enviar datos correctos', () => {
    let result: CreateTareaDto | undefined;
    component.tareaCreated.subscribe((dto) => (result = dto));

    component.form.patchValue({
      title: 'Taller de Cálculo Multivariable',
      description: 'Resolución de integrales dobles y triples en coordenadas cilíndricas.',
      subject: 'Matemáticas',
      dueDate: '2026-12-15',
      maxScore: 100,
      priority: 'alta',
      attachmentName: 'guia_calculo.pdf',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();

    expect(result).toBeDefined();
    expect(result!.title).toBe('Taller de Cálculo Multivariable');
    expect(result!.subject).toBe('Matemáticas');
    expect(result!.maxScore).toBe(100);
  });

  it('debe emitir closeModal al presionar el botón de cerrar', () => {
    let closed = false;
    component.closeModal.subscribe(() => (closed = true));

    component.onClose();
    expect(closed).toBe(true);
  });
});
