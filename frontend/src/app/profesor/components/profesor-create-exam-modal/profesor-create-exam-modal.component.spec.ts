import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfesorCreateExamModalComponent } from './profesor-create-exam-modal.component';

describe('ProfesorCreateExamModalComponent', () => {
  let component: ProfesorCreateExamModalComponent;
  let fixture: ComponentFixture<ProfesorCreateExamModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesorCreateExamModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorCreateExamModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.examForm).toBeTruthy();
  });

  it('debe validar campos requeridos', () => {
    component.examForm.setValue({
      title: '',
      subject: '',
      topic: '',
      questionsCount: 0,
      difficulty: 'Media',
      durationMinutes: 5,
      instructions: '',
    });

    expect(component.examForm.invalid).toBe(true);
  });

  it('debe emitir examSubmitted con datos válidos', () => {
    let emittedDto: unknown = null;
    component.examSubmitted.subscribe((dto) => {
      emittedDto = dto;
    });

    component.examForm.setValue({
      title: 'Examen de Mitosis',
      subject: 'Ciencias',
      topic: 'Ciclo Celular',
      questionsCount: 15,
      difficulty: 'Alta',
      durationMinutes: 60,
      instructions: 'Sin apuntes',
    });

    expect(component.examForm.valid).toBe(true);
    component.onSubmit();

    expect(emittedDto).toEqual({
      title: 'Examen de Mitosis',
      subject: 'Ciencias',
      topic: 'Ciclo Celular',
      questionsCount: 15,
      difficulty: 'Alta',
      durationMinutes: 60,
      instructions: 'Sin apuntes',
    });
  });

  it('debe emitir closeModal al invocar onClose', () => {
    let closed = false;
    component.closeModal.subscribe(() => {
      closed = true;
    });

    component.onClose();
    expect(closed).toBe(true);
  });
});
