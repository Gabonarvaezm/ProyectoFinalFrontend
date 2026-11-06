import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QuickAction, RecentActivity } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-activity-feed',
  templateUrl: './profesor-activity-feed.component.html',
  styleUrl: './profesor-activity-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorActivityFeedComponent {
  public readonly activities = input.required<readonly RecentActivity[]>();
  public readonly quickActions = input.required<readonly QuickAction[]>();

  public readonly quickActionTriggered = output<QuickAction>();
}

