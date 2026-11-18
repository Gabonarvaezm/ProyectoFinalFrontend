import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-academic-sync-status',
  templateUrl: './academic-sync-status.component.html',
  styleUrl: './academic-sync-status.component.scss',
})
export class AcademicSyncStatusComponent {
  readonly localDemo = input(false);
  readonly error = input<string | null>(null);
  readonly saving = input(false);
  readonly retry = output<void>();
  readonly discard = output<void>();
}
