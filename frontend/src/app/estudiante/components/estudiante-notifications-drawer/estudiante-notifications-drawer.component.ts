import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { StudentNotification, StudentNotificationFilter } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-notifications-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-notifications-drawer.component.html',
  styleUrls: ['./estudiante-notifications-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteNotificationsDrawerComponent {
  // ── Inputs del Padre ─────────────────────────────────────────────────────
  public readonly isOpen = input.required<boolean>();
  public readonly notifications = input.required<readonly StudentNotification[]>();

  // ── Outputs hacia el Padre ────────────────────────────────────────────────
  public readonly closeRequested = output<void>();
  public readonly markAsRead = output<string>();
  public readonly toggleRead = output<string>();
  public readonly markAllAsRead = output<void>();
  public readonly deleteNotification = output<string>();
  public readonly notificationSelected = output<StudentNotification>();

  // ── Filtro Activo Local (Signal) ─────────────────────────────────────────
  public readonly activeFilter = signal<StudentNotificationFilter>('all');

  // ── Métricas y Notificaciones Filtradas (Computed Signals) ────────────────
  public readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);
  public readonly tasksCount = computed(() => this.notifications().filter((n) => n.type === 'task').length);
  public readonly forumsCount = computed(() => this.notifications().filter((n) => n.type === 'forum_reply').length);

  public readonly filteredNotifications = computed<StudentNotification[]>(() => {
    const list = this.notifications();
    const filter = this.activeFilter();
    switch (filter) {
      case 'unread':
        return list.filter((n) => !n.read);
      case 'tasks':
        return list.filter((n) => n.type === 'task');
      case 'forums':
        return list.filter((n) => n.type === 'forum_reply');
      case 'all':
      default:
        return [...list];
    }
  });

  // ── Métodos de Interacción ───────────────────────────────────────────────
  public setFilter(filter: StudentNotificationFilter): void {
    this.activeFilter.set(filter);
  }

  public onClose(): void {
    this.closeRequested.emit();
  }

  public onMarkAllAsRead(): void {
    if (this.unreadCount() === 0) return;
    this.markAllAsRead.emit();
  }

  public onToggleRead(item: StudentNotification, event: Event): void {
    event.stopPropagation();
    this.toggleRead.emit(item.id);
  }

  public onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteNotification.emit(id);
  }

  public onNotificationItemClick(item: StudentNotification): void {
    if (!item.read) {
      this.markAsRead.emit(item.id);
    }
    this.notificationSelected.emit(item);
  }
}
