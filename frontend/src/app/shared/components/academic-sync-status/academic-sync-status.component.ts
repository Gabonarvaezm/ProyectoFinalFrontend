import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-academic-sync-status',
  template: `
    @if (error()) {
      <div class="status error" role="alert"><span>{{ error() }}</span><button type="button" (click)="retry.emit()">Reintentar</button><button type="button" (click)="discard.emit()">Descartar envío</button></div>
    } @else if (saving()) {
      <div class="status" role="status" aria-live="polite">Compartiendo el contenido con sus destinatarios…</div>
    }
  `,
  styles: `
    .status { position: fixed; inset-block-start: var(--space-4); inset-inline-end: var(--space-4); max-width: min(32rem, calc(100vw - 2rem)); z-index: 9999; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--color-toast-border); border-radius: var(--radius-md); background: var(--color-toast-bg); color: var(--color-toast-text); box-shadow: var(--shadow-toast); }
    .error { border-color: var(--color-danger); }
    button { padding: var(--space-2); border: 1px solid currentColor; border-radius: var(--radius-sm); color: inherit; cursor: pointer; font: inherit; }
    button:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 3px; }
  `,
})
export class AcademicSyncStatusComponent {
  readonly error = input<string | null>(null);
  readonly saving = input(false);
  readonly retry = output<void>();
  readonly discard = output<void>();
}
