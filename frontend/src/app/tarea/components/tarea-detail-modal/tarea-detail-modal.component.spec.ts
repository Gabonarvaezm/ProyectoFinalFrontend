import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaDetailModalComponent } from './tarea-detail-modal.component';
import { GradeTareaDto, Tarea } from '../../models/tarea.model';

describe('TareaDetailModalComponent', () => {
  let component: TareaDetailModalComponent;
  let fixture: ComponentFixture<TareaDetailModalComponent>;

  const mockTarea: Tarea = {
    id: 'tar-detail-test',
    title: 'Análisis Histórico: Segunda Guerra Mundial',
    description: 'Impacto geopolítico y creación de los organismos multilaterales.',
    subject: 'Historia',
    dueDate: '2026-11-20',
    maxScore: 100,
    priority: 'alta',
    assignedBy: 'Prof. Laura Gómez',
    assignedDate: '2026-11-05',
    status: 'entregada',
    submissionsCount: 15,
    mySubmission: {
      id: 'sub-test-1',
      tareaId: 'tar-detail-test',
      studentId: 'student-alejandro',
      studentName: 'Alejandro Silva',
      submittedAt: '2026-11-10T12:00:00Z',
      content: 'Ensayo analizando la Conferencia de Yalta y el surgimiento de la ONU.',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TareaDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('tarea', mockTarea);
    fixture.detectChanges();
  });

  it('debe crearse correctamente y mostrar los detalles de la tarea y entrega', () => {
    expect(component).toBeTruthy();
    const title = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent).toContain('Segunda Guerra Mundial');
  });

  it('debe permitir calificar una entrega si el usuario es profesor', () => {
    fixture.componentRef.setInput('isProfessor', true);
    fixture.detectChanges();

    let graded: GradeTareaDto | undefined;
    component.gradeSubmitted.subscribe((dto) => (graded = dto));

    component.gradeForm.patchValue({
      grade: 4.6,
      feedback: 'Gran trabajo histórico y pertinencia de argumentos.',
    });

    component.onSubmitGrade();

    expect(graded).toBeDefined();
    expect(graded!.grade).toBe(4.6);
    expect(graded!.tareaId).toBe(mockTarea.id);
  });

  it('rechaza notas fuera de 1.0 a 5.0 y más de un decimal', () => {
    fixture.componentRef.setInput('isProfessor', true);
    fixture.detectChanges();
    const graded = vi.fn();
    component.gradeSubmitted.subscribe(graded);
    for (const grade of [null, 0, 0.9, 5.1, 4.55]) {
      component.gradeForm.setValue({ grade, feedback: 'Comentarios sobre la entrega.' });
      component.onSubmitGrade();
    }
    expect(graded).not.toHaveBeenCalled();
    for (const grade of [1, 4.5, 5]) {
      component.gradeForm.setValue({ grade, feedback: 'Comentarios sobre la entrega.' });
      component.onSubmitGrade();
    }
    expect(graded).toHaveBeenCalledTimes(3);
  });

  it('muestra al estudiante la nota decimal y los comentarios sin ofrecer edición', () => {
    fixture.componentRef.setInput('tarea', { ...mockTarea, status: 'calificada',
      mySubmission: { ...mockTarea.mySubmission!, grade: 4, gradeScale: 5, feedback: 'Buen análisis de las fuentes.' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.score-number').textContent).toContain('4.0');
    expect(fixture.nativeElement.querySelector('.score-max').textContent).toContain('/ 5');
    expect(fixture.nativeElement.querySelector('.feedback-body').textContent).toContain('Buen análisis');
    expect(fixture.nativeElement.querySelector('.grade-form')).toBeNull();
  });

  it('debe emitir deliverClicked si el estudiante pulsa realizar entrega ahora', () => {
    const tareaPendiente: Tarea = { ...mockTarea, status: 'pendiente', mySubmission: undefined };
    fixture.componentRef.setInput('tarea', tareaPendiente);
    fixture.componentRef.setInput('isProfessor', false);
    fixture.detectChanges();

    let deliveredTarea: Tarea | null = null;
    component.deliverClicked.subscribe((t) => (deliveredTarea = t));

    const btn = fixture.nativeElement.querySelector('.btn-deliver-now');
    expect(btn).toBeTruthy();
    btn.click();

    expect(deliveredTarea).toBe(tareaPendiente);
  });

  it('debe emitir closeModal al presionar el botón de cerrar', () => {
    let closed = false;
    component.closeModal.subscribe(() => (closed = true));

    component.onClose();
    expect(closed).toBe(true);
  });
  it('abre automáticamente el borrador del alumno elegido y no ofrece calificarlo', () => {
    const draft = { id: 'draft', tareaId: mockTarea.id, studentId: 'other', studentName: 'Otra alumna', content: 'Avance real sin enviar', status: 'en_progreso' as const, revision: 1, updatedAt: '2026-11-18T12:00:00Z' };
    fixture.componentRef.setInput('isProfessor', true);
    fixture.componentRef.setInput('studentId', 'other');
    fixture.componentRef.setInput('tarea', { ...mockTarea, submissions: [mockTarea.mySubmission!, draft] });
    fixture.detectChanges();
    expect(component.selectedSubmission()?.id).toBe('draft');
    expect(fixture.nativeElement.textContent).toContain('Avance real sin enviar');
    expect(fixture.nativeElement.querySelector('.grade-form')).toBeNull();
    const spy = vi.fn(); component.gradeSubmitted.subscribe(spy);
    component.gradeForm.setValue({ grade: 4.0, feedback: 'No puede calificar borradores.' });
    component.onSubmitGrade(); expect(spy).not.toHaveBeenCalled();
  });

  it('seleccionar un alumno sin avances nunca muestra la entrega de otro y conserva la selección al refrescar', () => {
    const task = { ...mockTarea, submissions: [mockTarea.mySubmission!], recipients: [{ studentId: 'empty', studentName: 'Sin avance', email: 'empty@test.edu', status: 'pendiente' as const }] };
    fixture.componentRef.setInput('isProfessor', true);
    fixture.componentRef.setInput('tarea', task); fixture.detectChanges();
    component.selectStudent('empty'); fixture.detectChanges();
    expect(component.selectedSubmission()).toBeUndefined();
    fixture.componentRef.setInput('tarea', structuredClone(task)); fixture.detectChanges();
    expect(component.selectedSubmission()).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('todavía no tiene avances');
    expect(fixture.nativeElement.textContent).not.toContain(mockTarea.mySubmission!.content);
  });

  it('no borra una nota en edición por un refresco idéntico del repositorio', () => {
    fixture.componentRef.setInput('isProfessor', true); fixture.detectChanges();
    component.gradeForm.patchValue({ grade: 3.5, feedback: 'Comentario que estoy redactando.' });
    fixture.componentRef.setInput('tarea', structuredClone(mockTarea)); fixture.detectChanges();
    expect(component.gradeForm.value.grade).toBe(3.5);
    expect(component.gradeForm.value.feedback).toBe('Comentario que estoy redactando.');
  });

});
