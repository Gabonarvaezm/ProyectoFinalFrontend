import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ConfigSection, ConfigSectionId } from '../../models/configuracion.model';

@Component({
  selector: 'app-configuracion-tabs',
  standalone: true,
  templateUrl: './configuracion-tabs.component.html',
  styleUrl: './configuracion-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionTabsComponent {
  public readonly sections = input.required<ConfigSection[]>();
  public readonly activeSection = input.required<ConfigSectionId>();
  public readonly sectionSelected = output<ConfigSectionId>();

  public onSelectSection(id: ConfigSectionId): void {
    this.sectionSelected.emit(id);
  }
}

