import { Component, input } from '@angular/core';
import { KpiMetric } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-kpi-cards',
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
      gap: var(--space-5);

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background-color: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5) var(--space-6);
      box-shadow: var(--shadow-card);
      transition: var(--transition-fast);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-card-hover);
        border-color: var(--color-slate-300);
      }

      .kpi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
      }

      .kpi-label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        letter-spacing: 0.05em;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .kpi-icon-pill {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;

        &.blue {
          background-color: var(--color-primary-50);
          color: var(--color-primary-700);
          border: 1px solid var(--color-primary-200);
        }
        &.purple {
          background: var(--color-ai-gradient-subtle);
          color: var(--color-ai-600);
          border: 1px solid var(--color-ai-300);
        }
        &.amber {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
          border: 1px solid var(--color-warning-border);
        }
      }

      .kpi-value {
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-extrabold);
        color: var(--color-slate-900);
        line-height: 1;
        letter-spacing: -0.02em;
      }
    }
  `],
})
export class ProfesorKpiCardsComponent {
  public readonly kpiMetrics = input.required<readonly KpiMetric[]>();
}
