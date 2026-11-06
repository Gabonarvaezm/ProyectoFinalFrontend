import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';

@Component({
  selector: 'app-biblioteca-header',
  templateUrl: './biblioteca-header.component.html',
  styleUrl: './biblioteca-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly selectedFormat = model<string>('all');
  public readonly formatChanged = output<string>();

  public onSearchInput(val: string): void {
    this.searchQuery.set(val);
  }

  public onClearSearch(): void {
    this.searchQuery.set('');
  }

  public onSetFormat(format: string): void {
    this.selectedFormat.set(format);
    this.formatChanged.emit(format);
  }
}

