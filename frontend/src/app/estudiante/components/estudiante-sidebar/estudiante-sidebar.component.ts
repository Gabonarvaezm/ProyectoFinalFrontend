import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../../../core/models/auth.model';

@Component({
  selector: 'app-estudiante-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './estudiante-sidebar.component.html',
  styleUrl: './estudiante-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteSidebarComponent {
  public readonly navItems = input.required<readonly NavItem[]>();
  public readonly activeNav = model.required<string>();
  public readonly institution = input<string>('Institución Pública');

  public readonly navSelected = output<string>();
  public readonly logoutClicked = output<void>();

  public onSelectNav(id: string): void {
    this.activeNav.set(id);
    this.navSelected.emit(id);
  }
}

