import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KpiMetric } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-kpi-cards',
  templateUrl: './profesor-kpi-cards.component.html',
  styleUrl: './profesor-kpi-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorKpiCardsComponent {
  public readonly kpiMetrics = input.required<readonly KpiMetric[]>();
}

