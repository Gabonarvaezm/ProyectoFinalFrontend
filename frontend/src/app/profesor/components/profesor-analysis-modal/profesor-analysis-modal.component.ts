import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CohortAnalysisSummary,
  StudentProgress,
} from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-analysis-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profesor-analysis-modal.component.html',
  styleUrls: ['./profesor-analysis-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorAnalysisModalComponent {
  public readonly isOpen = input.required<boolean>();
  public readonly summary = input.required<CohortAnalysisSummary>();
  public readonly students = input<readonly StudentProgress[]>([]);

  public readonly closeModal = output<void>();
  public readonly consultAi = output<string>();
  public readonly messageAtRisk = output<void>();

  public readonly studentsNeedingAttention = computed(() =>
    this.students().filter(
      (s) => s.status === 'needs-attention' || s.score < 50
    )
  );

  public onClose(): void {
    this.closeModal.emit();
  }

  public onConsultAi(): void {
    const s = this.summary();
    const prompt = `Analiza la cohorte actual: Promedio general ${s.averageScore}%, Aprobación ${s.passingRate}%, y ${s.atRiskCount} alumnos con dificultades en "${s.challengingTopic}". ¿Qué estrategias pedagógicas y actividades de refuerzo recomiendas para nivelar el grupo?`;
    this.consultAi.emit(prompt);
  }

  public onMessageAtRisk(): void {
    this.messageAtRisk.emit();
  }
}
