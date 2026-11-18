import { INITIAL_TAREAS } from './data/tarea.data';
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
    tareaService.tareas.set(structuredClone(INITIAL_TAREAS));
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

  it('conserva el formulario si el servidor rechaza el guardado', async () => {
    component.isCreateOpen.set(true);
    vi.spyOn(tareaService, 'createTarea').mockRejectedValue(new Error('No autorizado'));
    await component.handleCreateTarea({ title: 'Práctica', description: 'Resolver ejercicios', subject: 'Ciencias', dueDate: '2099-01-01', maxScore: 100, priority: 'media' });
    expect(component.isCreateOpen()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
    expect(component.toastMessage()).toBe('No autorizado');
  });
  it('espera la confirmación antes de cerrar el borrador', async () => {
    let resolve!: () => void;
    vi.spyOn(tareaService, 'saveDraft').mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
    component.isSubmitOpen.set(true);
    const pending = component.handleDraft({ tareaId: 'task', content: 'Avance' });
    expect(component.isSubmitting()).toBe(true);
    expect(component.isSubmitOpen()).toBe(true);
    resolve(); await pending;
    expect(component.isSubmitOpen()).toBe(false);
    expect(component.toastMessage()).toContain('Todavía no has entregado');
  });

  it('debe navegar al chatbot y configuración desde los botones superiores', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onAiClicked();
    expect(navigateSpy).toHaveBeenCalledWith(['/chatbot']);

    component.onConfigClicked();
    expect(navigateSpy).toHaveBeenCalledWith(['/configuracion']);
  });
  it('el detalle abierto consulta la tarea vigente en lugar de conservar una copia obsoleta', () => {
    const task = tareaService.tareas()[0];
    component.openDetailModal(task);
    expect(component.currentDetail()?.id).toBe(task.id);
    tareaService.tareas.update((tasks) => tasks.map((item) => item.id === task.id ? { ...item, description: 'Avance actualizado en otra lectura' } : item));
    expect(component.currentDetail()?.description).toBe('Avance actualizado en otra lectura');
    expect(component.activeTarea()?.description).toBe(task.description);
  });

});
