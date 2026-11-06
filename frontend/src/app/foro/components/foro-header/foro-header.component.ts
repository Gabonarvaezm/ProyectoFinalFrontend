import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ForumAuthor, UserRole } from '../../models/foro.model';

@Component({
  selector: 'app-foro-header',
  templateUrl: './foro-header.component.html',
  styleUrl: './foro-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForoHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly currentUser = input.required<ForumAuthor>();
  public readonly currentRole = input.required<UserRole>();
  public readonly notificationsCount = input<number>(2);
  public readonly isAiPanelOpen = input<boolean>(true);

  public readonly roleToggled = output<void>();
  public readonly aiToggleClicked = output<void>();

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}

