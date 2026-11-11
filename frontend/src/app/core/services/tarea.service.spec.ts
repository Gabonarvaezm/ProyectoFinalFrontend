import { TestBed } from '@angular/core/testing';
import { TareaService } from './tarea.service';
import { CreateTareaDto, SubmitTareaDto, GradeTareaDto } from '../../tarea/models/tarea.model';

describe('TareaService', () => {
  let service: TareaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TareaService],
    });
    service = TestBed.inject(TareaService);
  });

  it('debe crearse correctamente e inicializar el catálogo de tareas', () => {
    expect(service).toBeTruthy();
    expect(service.tareas().length).toBeGreaterThanOrEqual(5);
  });

  it('debe crear una nueva tarea para un profesor y añadirla al inicio', () => {
    const initialCount = service.tareas().length;
    const dto: CreateTareaDto = {
      title: 'Taller de Genética Mendeliana',
      description: 'Cruces monohíbridos y dihíbridos aplicando cuadros de Punnett.',
      subject: 'Ciencias',
      dueDate: '2026-12-01',
      maxScore: 100,
      priority: 'alta',
      attachmentName: 'guia_mendel.pdf',
    };

    const created = service.createTarea(dto, 'Prof. Mendoza');
    expect(created.id).toBeTruthy();
    expect(service.tareas().length).toBe(initialCount + 1);
    expect(service.tareas()[0].title).toBe('Taller de Genética Mendeliana');
    expect(service.tareas()[0].assignedBy).toBe('Prof. Mendoza');
    expect(service.tareas()[0].status).toBe('pendiente');
  });

  it('debe registrar la entrega de una tarea por un estudiante y actualizar el estado a entregada', () => {
    const tarea = service.tareas().find((t) => t.status === 'pendiente')!;
    expect(tarea).toBeTruthy();

    const submitDto: SubmitTareaDto = {
      tareaId: tarea.id,
      content: 'Entrega detallada con las respuestas y análisis del experimento.',
      attachmentUrl: 'https://ejemplo.edu/entrega.pdf',
      comments: 'Completado sin novedades.',
    };

    const submission = service.submitTarea(submitDto, {
      id: 'student-test',
      email: 'test@estudiante.edu',
      fullName: 'Estudiante Prueba',
      role: 'student',
      institution: 'Universidad Test',
    });

    expect(submission.tareaId).toBe(tarea.id);
    const updated = service.tareas().find((t) => t.id === tarea.id)!;
    expect(updated.status).toBe('entregada');
    expect(updated.mySubmission?.content).toBe(submitDto.content);
  });

  it('debe calificar una tarea entregada asignando nota y retroalimentación', () => {
    const tareaEntregada = service.tareas().find((t) => t.status === 'entregada')!;
    expect(tareaEntregada).toBeTruthy();

    const gradeDto: GradeTareaDto = {
      tareaId: tareaEntregada.id,
      submissionId: tareaEntregada.mySubmission!.id,
      grade: 98,
      feedback: 'Trabajo excepcional con demostraciones rigurosas.',
    };

    service.gradeTarea(gradeDto);

    const calificada = service.tareas().find((t) => t.id === tareaEntregada.id)!;
    expect(calificada.status).toBe('calificada');
    expect(calificada.mySubmission?.grade).toBe(98);
    expect(calificada.mySubmission?.feedback).toContain('excepcional');
  });

  it('debe eliminar una tarea del catálogo', () => {
    const initialCount = service.tareas().length;
    const target = service.tareas()[0];

    service.deleteTarea(target.id);
    expect(service.tareas().length).toBe(initialCount - 1);
    expect(service.tareas().some((t) => t.id === target.id)).toBe(false);
  });
});

