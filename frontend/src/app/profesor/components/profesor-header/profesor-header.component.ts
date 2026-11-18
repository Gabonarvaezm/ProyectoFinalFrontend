import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-profesor-header',
  templateUrl: './profesor-header.component.html',
  styleUrl: './profesor-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly notificationsCount = input<number>(0);
  public readonly teacherName = input<string>('Prof. García');
  public readonly teacherInitials = input<string>('PG');
  public readonly isAiDrawerOpen = input<boolean>(false);
  public readonly isNotificationsDrawerOpen = input<boolean>(false);

  public readonly notificationsClicked = output<void>();
  public readonly configClicked = output<void>();
  public readonly aiToggleClicked = output<void>();

  public onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }
}
