import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QuickAction, RecentActivity } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-activity-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side-column">
      <!-- Recent Activity -->
      <section class="card-section activity-card" aria-labelledby="heading-recent-activity">
        <div class="card-header">
          <h2 id="heading-recent-activity" class="card-title">Recent Activity</h2>
        </div>

        <ul class="activity-list">
          @for (act of activities(); track act.id) {
            <li class="activity-item">
              <div class="activity-icon-badge" [class]="act.iconType">
                <i [class]="act.icon" aria-hidden="true"></i>
              </div>
              <div class="activity-details">
                <p class="activity-desc">{{ act.description }}</p>
                <span class="activity-time">{{ act.timeAgo }}</span>
              </div>
            </li>
          }
        </ul>
      </section>

      <!-- Quick Actions -->
      <section class="card-section quick-actions-card" aria-label="Acciones rápidas">
        <h3 class="quick-actions-title">QUICK ACTIONS</h3>
        <div class="actions-stack">
          @for (action of quickActions(); track action.id) {
            <button
              type="button"
              class="btn-quick-action"
              [class.primary]="action.primary"
              (click)="quickActionTriggered.emit(action)"
            >
              <i [class]="action.icon" aria-hidden="true"></i>
              <span>{{ action.label }}</span>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .side-column { display: flex; flex-direction: column; gap: 1.25rem; }

    .card-section {
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;

      .card-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
    }

    .activity-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;

      .activity-item { display: flex; align-items: flex-start; gap: 0.85rem; }

      .activity-icon-badge {
        width: 30px;
        height: 30px;
        min-width: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        &.blue { background-color: #dbeafe; color: #1d4ed8; }
        &.purple { background-color: #ede9fe; color: #7c3aed; }
      }

      .activity-details {
        .activity-desc {
          font-size: 0.86rem;
          font-weight: 500;
          color: #1e293b;
          margin: 0 0 0.2rem;
          line-height: 1.35;
        }
        .activity-time { font-size: 0.75rem; color: #94a3b8; }
      }
    }

    .quick-actions-card {
      .quick-actions-title {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #64748b;
        margin: 0 0 0.85rem;
      }

      .actions-stack { display: flex; flex-direction: column; gap: 0.6rem; }

      .btn-quick-action {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        padding: 0.65rem 1rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        background-color: #e8edf5;
        color: #334155;
        border: none;
        transition: all 0.15s ease;

        &:hover { background-color: #dde4ef; color: #0f172a; }

        &.primary {
          background-color: #1d4ed8;
          color: #fff;
          &:hover { background-color: #1e40af; }
        }
      }
    }
  `],
})
export class ProfesorActivityFeedComponent {
  public readonly activities = input.required<readonly RecentActivity[]>();
  public readonly quickActions = input.required<readonly QuickAction[]>();

  public readonly quickActionTriggered = output<QuickAction>();
}

