import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/** One boundary for browser storage; failed writes never become confirmed data. */
@Injectable({ providedIn: 'root' })
export class LocalPersistenceService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly error = signal<string | null>(null);
  readText(key: string): string | null {
    if (!this.browser) return null;
    try { return localStorage.getItem(key); }
    catch (error: unknown) { throw this.failure('No se pudo leer el almacenamiento local.', error); }
  }
  writeText(key: string, value: string): void {
    if (!this.browser) throw new Error('El almacenamiento local está disponible en el navegador.');
    try { localStorage.setItem(key, value); this.error.set(null); }
    catch (error: unknown) { throw this.failure('No se pudo guardar: el almacenamiento está lleno o bloqueado.', error); }
  }

  read<T>(key: string, fallback: T): T {
    if (!this.browser) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw) as T;
    } catch (error: unknown) { throw this.failure('No se pudieron leer los datos locales. No se han reemplazado.', error); }
  }
  write<T>(key: string, value: T): void {
    if (!this.browser) throw new Error('El almacenamiento local está disponible en el navegador.');
    try { localStorage.setItem(key, JSON.stringify(value)); this.error.set(null); }
    catch (error: unknown) { throw this.failure('No se pudo guardar: el almacenamiento está lleno o bloqueado. Conserva tu trabajo y libera espacio.', error); }
  }
  remove(key: string): void {
    if (!this.browser) return;
    try { localStorage.removeItem(key); this.error.set(null); }
    catch (error: unknown) { throw this.failure('No se pudieron eliminar los datos locales.', error); }
  }
  private failure(message: string, error: unknown): Error {
    this.error.set(message);
    console.error('[DiscerIA: almacenamiento local]', message, error);
    return new Error(message);
  }
}
