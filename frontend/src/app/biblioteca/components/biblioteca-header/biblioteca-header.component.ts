import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';

@Component({
  selector: 'app-biblioteca-header',
  templateUrl: './biblioteca-header.component.html',
  styleUrl: './biblioteca-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaHeaderComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────
  /** Muestra el botón "Publicar Libro" solo cuando el usuario es profesor */
  public readonly isProfessor = input<boolean>(false);

  // ── Models (Two-way binding con el padre) ─────────────────────────────────
  public readonly searchQuery = model<string>('');
  public readonly selectedFormat = model<string>('all');

  // ── Outputs ───────────────────────────────────────────────────────────────
  public readonly formatChanged = output<string>();
  /** Notifica al padre que el profesor desea abrir el modal de creación */
  public readonly createBookClicked = output<void>();

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
