import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-biblioteca-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './biblioteca-topbar.component.html',
  styleUrl: './biblioteca-topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaTopbarComponent {
  public readonly searchQuery = input<string>('');
  public readonly currentUser = input<User | null>(null);
  public readonly userInitials = input<string>('US');
  public readonly userName = input<string>('Usuario');
  public readonly isProfessor = input<boolean>(false);
  public readonly notificationsCount = input<number>(0);

  public readonly searchQueryChange = output<string>();
  public readonly aiClicked = output<void>();
  public readonly notificationsClicked = output<void>();
  public readonly configClicked = output<void>();

  public onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQueryChange.emit(value);
  }
}

