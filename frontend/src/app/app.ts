import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AcademicSyncService } from './core/services/academic-sync.service';
import { AcademicSyncStatusComponent } from './shared/components/academic-sync-status/academic-sync-status.component';

@Component({
  imports: [RouterOutlet, AcademicSyncStatusComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly academicSync = inject(AcademicSyncService);
  constructor() {
    inject(ThemeService);
    this.academicSync.start();
  }

  protected readonly title = signal('DiscerIA');
}
