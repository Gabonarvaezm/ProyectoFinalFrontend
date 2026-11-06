import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-estudiante-header',
  standalone: true,
  templateUrl: './estudiante-header.component.html',
  styleUrl: './estudiante-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly studentName = input.required<string>();
  public readonly userInitials = input.required<string>();
  public readonly notificationsCount = input<number>(2);
  public readonly isAiDrawerOpen = input<boolean>(false);

  public readonly searchChanged = output<string>();
  public readonly notificationsClicked = output<void>();
  public readonly profileClicked = output<void>();
  public readonly configClicked = output<void>();
  public readonly aiToggleClicked = output<void>();

  public onSearch(val: string): void {
    this.searchQuery.set(val);
    this.searchChanged.emit(val);
  }
}

