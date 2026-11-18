import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-sidebar',
  imports: [RouterLink],
  templateUrl: './profesor-sidebar.component.html',
  styleUrl: './profesor-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorSidebarComponent {
  public readonly navItems = input.required<readonly NavItem[]>();
  public readonly activeNav = model.required<string>();

  public readonly navSelected = output<string>();
  public readonly newAnalysis = output<void>();

  public onSelectNav(id: string): void {
    this.activeNav.set(id);
    this.navSelected.emit(id);
  }
}

