import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  NotificationFilter,
  TeacherNotification,
} from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-notifications-drawer',
  imports: [],
  templateUrl: './profesor-notifications-drawer.component.html',
  styleUrl: './profesor-notifications-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorNotificationsDrawerComponent {
  // ── Inputs del Padre ─────────────────────────────────────────────────────
  public readonly isOpen = input.required<boolean>();
  public readonly notifications = input.required<readonly TeacherNotification[]>();

  // ── Outputs hacia el Padre ────────────────────────────────────────────────
  public readonly closeRequested = output<void>();
  public readonly markAsRead = output<string>();
  public readonly toggleRead = output<string>();
  public readonly markAllAsRead = output<void>();
  public readonly deleteNotification = output<string>();
  public readonly notificationSelected = output<TeacherNotification>();

  // ── Filtro Activo Local (Signal) ─────────────────────────────────────────
  public readonly activeFilter = signal<NotificationFilter>('all');

  // ── Métricas y Notificaciones Filtradas (Computed Signals) ────────────────
  public readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  public readonly studentsCount = computed(
    () => this.notifications().filter((n) => n.authorRole === 'student').length
  );

  public readonly teachersCount = computed(
    () => this.notifications().filter((n) => n.authorRole === 'professor').length
  );

  public readonly filteredNotifications = computed<TeacherNotification[]>(() => {
    const list = this.notifications();
    const filter = this.activeFilter();

    switch (filter) {
      case 'unread':
        return list.filter((n) => !n.read);
      case 'students':
        return list.filter((n) => n.authorRole === 'student');
      case 'teachers':
        return list.filter((n) => n.authorRole === 'professor');
      case 'all':
      default:
        return [...list];
    }
  });

  // ── Métodos de Interacción ───────────────────────────────────────────────

  public setFilter(filter: NotificationFilter): void {
    this.activeFilter.set(filter);
  }

  public onClose(): void {
    this.closeRequested.emit();
  }

  public onMarkAllAsRead(): void {
    if (this.unreadCount() === 0) return;
    this.markAllAsRead.emit();
  }

  public onToggleRead(item: TeacherNotification, event: Event): void {
    event.stopPropagation();
    this.toggleRead.emit(item.id);
  }

  public onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteNotification.emit(id);
  }

  public onNotificationItemClick(item: TeacherNotification): void {
    if (!item.read) {
      this.markAsRead.emit(item.id);
    }
    this.notificationSelected.emit(item);
  }
}

