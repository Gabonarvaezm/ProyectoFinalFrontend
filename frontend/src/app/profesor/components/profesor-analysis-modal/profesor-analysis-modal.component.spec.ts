import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfesorAnalysisModalComponent } from './profesor-analysis-modal.component';
import { CohortAnalysisSummary } from '../../models/profesor.model';

describe('ProfesorAnalysisModalComponent', () => {
  let component: ProfesorAnalysisModalComponent;
  let fixture: ComponentFixture<ProfesorAnalysisModalComponent>;

  const mockSummary: CohortAnalysisSummary = {
    totalStudents: 10,
    averageScore: 78,
    passingRate: 85,
    atRiskCount: 2,
    completedCount: 3,
    activeCount: 5,
    topPerformingTopic: 'Genética Mendeliana',
    challengingTopic: 'Biología Celular: Mitosis',
    aiPedagogicalAdvice: 'Se sugiere reforzar los conceptos de mitosis y meiosis.',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesorAnalysisModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorAnalysisModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('summary', mockSummary);
    fixture.componentRef.setInput('students', [
      { id: '1', studentName: 'Carlos Pérez', score: 45, status: 'needs-attention', topic: 'Biología Celular', statusLabel: 'Requiere Atención' },
    ]);
    fixture.detectChanges();
  });

  it('debe crearse correctamente y calcular estudiantes en riesgo', () => {
    expect(component).toBeTruthy();
    expect(component.studentsNeedingAttention().length).toBe(1);
    expect(component.studentsNeedingAttention()[0].studentName).toBe('Carlos Pérez');
  });

  it('debe emitir consultAi con prompt detallado al invocar onConsultAi', () => {
    let emittedPrompt = '';
    component.consultAi.subscribe((p) => {
      emittedPrompt = p;
    });

    component.onConsultAi();
    expect(emittedPrompt).toContain('78%');
    expect(emittedPrompt).toContain('85%');
    expect(emittedPrompt).toContain('Biología Celular: Mitosis');
  });

  it('debe emitir messageAtRisk al invocar onMessageAtRisk', () => {
    let triggered = false;
    component.messageAtRisk.subscribe(() => {
      triggered = true;
    });

    component.onMessageAtRisk();
    expect(triggered).toBe(true);
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
