import { SupabaseFilesRepository } from '../../core/services/supabase-files.repository';
import { Component, inject, input, output, signal } from '@angular/core';
import { AcademicFile } from '../models/tarea.model';

@Component({
  selector: 'app-task-file',
  template: `
    @if (editable()) {
      <label>Adjuntar PDF, imagen PNG/JPEG o texto (máximo 180 KB)
        <input type="file" accept="application/pdf,image/png,image/jpeg,text/plain" (change)="select($event)" />
      </label>
    }
    @if (file(); as attachment) {
      <button type="button" (click)="download()">Descargar {{ attachment.name }}</button>
      @if (editable()) { <button type="button" (click)="changed.emit(undefined)">Quitar archivo</button> }
    }
    @if (error()) { <p role="alert">{{ error() }}</p> }
  `,
  styles: [`:host { display:block; margin-block:1rem; color:var(--color-text-main); } label { display:grid; gap:.5rem; } button { margin:.4rem; padding:.5rem; color:var(--color-primary); background:var(--color-bg-surface); border:1px solid var(--color-border); border-radius:.5rem; }`],
})
export class TaskFileComponent {
  private readonly remoteFiles = inject(SupabaseFilesRepository);
  readonly editable = input(false);
  readonly file = input<AcademicFile>();
  readonly changed = output<AcademicFile | undefined>();
  readonly error = signal('');
  async select(event: Event): Promise<void> {
    this.error.set('');
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 180 * 1024 || !['application/pdf', 'image/png', 'image/jpeg', 'text/plain'].includes(file.type)) {
      this.error.set('Formato no admitido o archivo mayor de 180 KB.'); return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
    this.changed.emit({ name: file.name, mime: file.type, base64: btoa(binary) });
  }
  async download(): Promise<void> {
    this.error.set('');
    try {
    const file = this.file(); if (!file) return;
    const blob = file.storagePath ? await this.remoteFiles.download(file.storagePath)
      : new Blob([Uint8Array.from(atob(file.base64), (char) => char.charCodeAt(0))], { type: file.mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'No se pudo descargar el archivo.'); }
  }
}
