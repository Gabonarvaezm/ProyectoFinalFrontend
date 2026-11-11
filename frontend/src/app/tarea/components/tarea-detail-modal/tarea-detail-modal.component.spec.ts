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
      grade: 96,
      feedback: 'Gran trabajo histórico y pertinencia de argumentos.',
    });

    component.onSubmitGrade();

    expect(graded).toBeDefined();
    expect(graded!.grade).toBe(96);
    expect(graded!.tareaId).toBe(mockTarea.id);
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
});
