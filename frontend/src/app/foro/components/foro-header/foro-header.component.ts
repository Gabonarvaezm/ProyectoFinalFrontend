import { Component, input, model, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ForumAuthor } from '../../models/foro.model';

@Component({
  selector: 'app-foro-header',
  imports: [RouterLink],
  templateUrl: './foro-header.component.html',
  styleUrl: './foro-header.component.scss',
})
export class ForoHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly currentUser = input.required<ForumAuthor>();
  public readonly notificationsCount = input<number>(2);
  public readonly isAiPanelOpen = input<boolean>(true);

  public readonly aiToggleClicked = output<void>();
  public readonly notificationsClicked = output<void>();

  public readonly avatarLoadError = signal<boolean>(false);

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      this.searchQuery.set(target.value);
    }
  }

  public clearSearch(): void {
    this.searchQuery.set('');
  }

  public onAvatarError(): void {
    this.avatarLoadError.set(true);
  }

}
