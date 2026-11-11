import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Tarea } from './tarea';
import { TareaService } from '../core/services/tarea.service';
import { CreateTareaDto, SubmitTareaDto, GradeTareaDto } from './models/tarea.model';

describe('Tarea Component (Smart Parent & Presentational Child Nodes)', () => {
  let component: Tarea;
  let fixture: ComponentFixture<Tarea>;
  let tareaService: TareaService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tarea],
      providers: [provideRouter([]), TareaService],
    }).compileComponents();

    router = TestBed.inject(Router);
    tareaService = TestBed.inject(TareaService);
    fixture = TestBed.createComponent(Tarea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente e inicializar el catálogo de tareas', () => {
    expect(component).toBeTruthy();
    expect(component.tareas().length).toBeGreaterThan(0);
    expect(component.filteredTareas().length).toBe(component.tareas().length);
    expect(component.selectedStatus()).toBe('todas');
    expect(component.selectedSubject()).toBe('Todas las Materias');
  });

  it('debe reconocer el rol de estudiante por defecto', () => {
    expect(component.currentRole()).toBe('student');
    expect(component.isProfessor()).toBe(false);
    expect(component.dashboardRoute()).toBe('/estudiante');
  });

  it('debe reconocer el rol de profesor cuando se pasa userRole="professor"', () => {
    const profFixture = TestBed.createComponent(Tarea);
    profFixture.componentRef.setInput('userRole', 'professor');
    profFixture.detectChanges();

    expect(profFixture.componentInstance.currentRole()).toBe('professor');
    expect(profFixture.componentInstance.isProfessor()).toBe(true);
    expect(profFixture.componentInstance.dashboardRoute()).toBe('/profesor');
  });

  it('debe filtrar tareas reactivamente por estado', () => {
    component.onFilterStatus('pendiente');
    expect(component.selectedStatus()).toBe('pendiente');
    expect(component.filteredTareas().every((t) => t.status === 'pendiente')).toBe(true);

    component.onFilterStatus('entregada');
    expect(component.filteredTareas().every((t) => t.status === 'entregada')).toBe(true);
  });

  it('debe filtrar tareas por materia', () => {
    component.onFilterSubject('Ciencias');
    expect(component.selectedSubject()).toBe('Ciencias');
    expect(component.filteredTareas().every((t) => t.subject === 'Ciencias')).toBe(true);
  });

  it('debe filtrar tareas por término de búsqueda en título o consigna', () => {
    component.onSearch('mitosis');
    expect(component.filteredTareas().length).toBeGreaterThan(0);
    expect(
      component.filteredTareas().some((t) => t.title.toLowerCase().includes('mitosis'))
    ).toBe(true);

    component.onSearch('InexistenteXYZ123');
    expect(component.filteredTareas().length).toBe(0);
  });

  it('debe gestionar apertura y cierre del modal de creación docente', () => {
    const profFixture = TestBed.createComponent(Tarea);
    profFixture.componentRef.setInput('userRole', 'professor');
    profFixture.detectChanges();
    const profComp = profFixture.componentInstance;

    expect(profComp.isCreateOpen()).toBe(false);
    profComp.openCreateModal();
    expect(profComp.isCreateOpen()).toBe(true);

    profComp.closeCreateModal();
    expect(profComp.isCreateOpen()).toBe(false);
  });

  it('debe bloquear la apertura del modal de creación a estudiantes', () => {
    expect(component.isProfessor()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateOpen()).toBe(false);
    expect(component.toastMessage()).toContain('Solo los docentes');
  });

  it('debe procesar la creación de una tarea desde el formulario del profesor', async () => {
    const initialCount = component.tareas().length;
    const dto: CreateTareaDto = {
      title: 'Taller de Programación Dinámica',
      description: 'Resolución de problemas de la mochila y subsecuencia común más larga.',
      subject: 'Tecnología',
      dueDate: '2026-12-10',
      maxScore: 100,
      priority: 'alta',
      attachmentName: 'guia_dinamica.pdf',
    };

    component.handleCreateTarea(dto);
    expect(component.isSubmitting()).toBe(true);

    await new Promise((r) => setTimeout(r, 450));

    expect(component.isSubmitting()).toBe(false);
    expect(component.tareas().length).toBe(initialCount + 1);
    expect(component.tareas()[0].title).toBe('Taller de Programación Dinámica');
    expect(component.toastMessage()).toContain('publicada con éxito');
  });

  it('debe procesar la entrega de una tarea desde el formulario del estudiante', async () => {
    const tareaPendiente = component.tareas().find((t) => t.status === 'pendiente')!;
    const submitDto: SubmitTareaDto = {
      tareaId: tareaPendiente.id,
      content: 'Solución completa de la práctica con gráficos y código adjunto.',
      attachmentUrl: 'https://drive.google.com/solucion.pdf',
    };

    component.handleSubmitTarea(submitDto);
    expect(component.isSubmitting()).toBe(true);

    await new Promise((r) => setTimeout(r, 450));

    expect(component.isSubmitting()).toBe(false);
    const updated = component.tareas().find((t) => t.id === tareaPendiente.id)!;
    expect(updated.status).toBe('entregada');
    expect(component.toastMessage()).toContain('entregada exitosamente');
  });

  it('debe calificar una entrega cuando el docente envía la nota', () => {
    const tareaEntregada = component.tareas().find((t) => t.status === 'entregada')!;
    const gradeDto: GradeTareaDto = {
      tareaId: tareaEntregada.id,
      submissionId: tareaEntregada.mySubmission!.id,
      grade: 99,
      feedback: 'Desarrollo impecable con comprobaciones rigurosas.',
    };

    component.handleGradeTarea(gradeDto);
    const calificada = component.tareas().find((t) => t.id === tareaEntregada.id)!;
    expect(calificada.status).toBe('calificada');
    expect(calificada.mySubmission?.grade).toBe(99);
  });

  it('debe navegar al chatbot y configuración desde los botones superiores', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onAiClicked();
    expect(navigateSpy).toHaveBeenCalledWith(['/chatbot']);

    component.onConfigClicked();
    expect(navigateSpy).toHaveBeenCalledWith(['/configuracion']);
  });
});
