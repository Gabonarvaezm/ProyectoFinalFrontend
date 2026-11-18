import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaEstudianteFormComponent } from './tarea-estudiante-form.component';
import { SubmitTareaDto, Tarea } from '../../models/tarea.model';

describe('TareaEstudianteFormComponent', () => {
  let component: TareaEstudianteFormComponent;
  let fixture: ComponentFixture<TareaEstudianteFormComponent>;

  const mockTarea: Tarea = {
    id: 'tar-est-test',
    title: 'Informe de Laboratorio: Enzimas',
    description: 'Cinética enzimática y factores de desnaturalización térmica.',
    subject: 'Ciencias',
    dueDate: '2026-11-20',
    maxScore: 100,
    priority: 'alta',
    assignedBy: 'Prof. Carlos Mendoza',
    assignedDate: '2026-11-08',
    status: 'pendiente',
    submissionsCount: 10,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaEstudianteFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TareaEstudianteFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('tarea', mockTarea);
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar el formulario', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('content')?.valid).toBe(false);
  });

  it('no debe emitir tareaSubmitted si la respuesta es menor a 20 caracteres', () => {
    let emitted = false;
    component.tareaSubmitted.subscribe(() => (emitted = true));

    component.form.patchValue({ content: 'Respuesta muy corta' });
    component.onSubmit();

    expect(emitted).toBe(false);
    expect(component.form.invalid).toBe(true);
  });

  it('debe validar y emitir tareaSubmitted con el payload correcto', () => {
    let result: SubmitTareaDto | undefined;
    component.tareaSubmitted.subscribe((dto) => (result = dto));

    component.form.patchValue({
      content: 'Este es el informe completo con el análisis de la curva de Michaelis-Menten y constantes cinéticas.',
      attachmentUrl: 'https://drive.google.com/enzimas.pdf',
      comments: 'Excelente práctica de laboratorio.',
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();

    expect(result).toBeDefined();
    expect(result!.tareaId).toBe(mockTarea.id);
    expect(result!.content).toContain('Michaelis-Menten');
    expect(result!.attachmentUrl).toContain('enzimas.pdf');
  });

  it('debe emitir closeModal al presionar cancelar o cerrar', () => {
    let closed = false;
    component.closeModal.subscribe(() => (closed = true));

    component.onClose();
    expect(closed).toBe(true);
  });
});
