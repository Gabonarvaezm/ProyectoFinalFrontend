import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KpiMetric } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-kpi-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="kpi-section" aria-label="Métricas generales calculadas">
      @for (kpi of kpiMetrics(); track kpi.id) {
        <div class="kpi-card" [class]="'variant-' + kpi.variant">
          <div class="kpi-header">
            <span class="kpi-label">{{ kpi.label }}</span>
            <div class="kpi-icon-pill" [class]="kpi.variant">
              <i [class]="kpi.icon" aria-hidden="true"></i>
            </div>
          </div>
          <div class="kpi-value">{{ kpi.value }}</div>
        </div>
      }
    </section>
  `,
  styles: [`
    .kpi-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);

      .kpi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.6rem;
      }

      .kpi-label {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #64748b;
        text-transform: uppercase;
      }

      .kpi-icon-pill {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.blue { background-color: #dbeafe; color: #1d4ed8; }
        &.purple { background-color: #ede9fe; color: #7c3aed; }
        &.amber { background-color: #fef3c7; color: #d97706; }
      }

      .kpi-value {
        font-size: 1.95rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1;
      }
    }
  `],
})
export class ProfesorKpiCardsComponent {
  public readonly kpiMetrics = input.required<readonly KpiMetric[]>();
}

