import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BibliotecaNavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-biblioteca-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './biblioteca-sidebar.component.html',
  styleUrl: './biblioteca-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaSidebarComponent {
  public readonly activeNav = input<string>('biblioteca');
  public readonly isProfessor = input<boolean>(false);
  public readonly institution = input<string>('Institución Pública');
  public readonly dashboardRoute = input<string>('/estudiante');

  public readonly publishBookClicked = output<void>();

  public readonly navItems = computed<BibliotecaNavItem[]>(() => [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill', route: this.dashboardRoute() },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book-half', route: '/biblioteca' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text-fill', route: '/foro' },
    { id: 'progreso', label: 'Progreso', icon: 'bi bi-bar-chart', route: this.dashboardRoute() },
    { id: 'perfil', label: 'Perfil', icon: 'bi bi-person-circle', route: '/configuracion' },
  ]);
}

