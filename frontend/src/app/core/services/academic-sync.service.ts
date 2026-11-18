import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DestroyRef, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { AcademicEvent, AcademicSnapshot } from '../models/academic.model';
import { STORAGE_KEYS } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AcademicSyncService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private running = false;
  private generation = 0;
  private queue: AcademicEvent[] = [];
  private failedQueue: AcademicEvent[] = [];
  private intervalId?: ReturnType<typeof setInterval>;
  private migrated = false;
  readonly enabled = signal(false);
  readonly snapshot = signal<AcademicSnapshot | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  start(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    this.started = true;
    this.enabled.set(true);
    effect(() => {
      const user = this.auth.currentUser();
      const token = this.auth.sessionToken();
      this.generation++;
      this.snapshot.set(null);
      this.error.set(null);
      this.queue = [];
      this.failedQueue = [];
      this.saving.set(false);
      this.migrated = false;
      if (this.intervalId) clearInterval(this.intervalId);
      if (!user) return;
      if (!token) {
        this.auth.logout();
        void this.router.navigate(['/login']);
        return;
      }
      try { this.queue = JSON.parse(localStorage.getItem(this.outboxKey()) || '[]') as AcademicEvent[]; }
      catch { this.queue = []; }
      try { this.failedQueue = JSON.parse(localStorage.getItem(`${this.outboxKey()}:failed`) || '[]') as AcademicEvent[]; }
      catch { this.failedQueue = []; }
      if (!Array.isArray(this.queue)) this.queue = [];
      if (!Array.isArray(this.failedQueue)) this.failedQueue = [];
      if (this.failedQueue.length) this.error.set('Hay publicaciones que no pudieron enviarse. Reintenta o descarta el envío para corregirlo.');
      void this.refresh();
      this.intervalId = setInterval(() => void this.refresh(), 4000);
    });
    this.destroyRef.onDestroy(() => { if (this.intervalId) clearInterval(this.intervalId); });
  }

  publish(type: string, payload: object): void {
    if (!this.started) return;
    if (!this.auth.sessionToken()) {
      this.error.set('Inicia sesión de nuevo para publicar y recibir contenidos.');
      return;
    }
    this.queue.push({ id: crypto.randomUUID(), type, payload });
    this.saving.set(true);
    this.persistQueue();
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const token = this.auth.sessionToken();
    if (!token || this.running) return;
    const generation = this.generation;
    this.running = true;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let writing = false;
    try {
      while (this.queue.length && generation === this.generation) {
        this.saving.set(true);
        const event = this.queue[0];
        writing = true;
        const result = await firstValueFrom(this.http.post<AcademicSnapshot>('/api/academic/events', event, { headers }).pipe(timeout(15000)));
        if (generation !== this.generation) return;
        this.queue.shift();
        writing = false;
        this.persistQueue();
        this.snapshot.set(result);
      }
      const result = await firstValueFrom(this.http.get<AcademicSnapshot>('/api/academic/state', { headers }).pipe(timeout(15000)));
      if (generation === this.generation) {
        this.snapshot.set(result);
        if (!this.failedQueue.length) this.error.set(null);
        this.importLegacyContent(result);
      }
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      const detail: unknown = error instanceof HttpErrorResponse ? error.error : null;
      this.error.set(typeof detail === 'object' && detail !== null && 'error' in detail && typeof detail.error === 'string'
        ? detail.error : 'No se pudo compartir el contenido. Conservamos el envío para reintentarlo.');
      if (writing && error instanceof HttpErrorResponse && [400, 403, 404, 409].includes(error.status)) {
        const failed = this.queue.shift();
        if (failed) this.failedQueue.push(failed);
        this.persistQueue();
      }
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.auth.logout();
        void this.router.navigate(['/login']);
      }
    } finally {
      this.running = false;
      this.saving.set(this.queue.length > 0 && !this.error());
      if (this.queue.length && !this.error() && generation === this.generation) void this.refresh();
    }
  }

  receipt(id: string, read: boolean, deleted = false): void {
    this.snapshot.update((state) => state ? { ...state, notifications: deleted
      ? state.notifications.filter((notice) => notice.id !== id)
      : state.notifications.map((notice) => notice.id === id ? { ...notice, read } : notice) } : null);
    this.publish('notice.receipt', { id, read, deleted });
  }

  retry(): void {
    this.queue.unshift(...this.failedQueue);
    this.failedQueue = [];
    this.persistQueue();
    this.error.set(null);
    void this.refresh();
  }

  discardFailed(): void {
    this.failedQueue = [];
    this.persistQueue();
    this.error.set(null);
    void this.refresh();
  }

  private outboxKey(): string { return `disceria_outbox:${this.auth.currentUser()?.email}`; }
  private importLegacyContent(state: AcademicSnapshot): void {
    if (this.migrated || !this.auth.isProfessor()) return;
    this.migrated = true;
    const migrationKey = `disceria_shared_migration:${this.auth.currentUser()?.email}`;
    if (localStorage.getItem(migrationKey)) return;
    const collections = [
      { key: STORAGE_KEYS.BOOKS, existing: state.books, type: 'book.publish' },
      { key: STORAGE_KEYS.FORUM_POSTS, existing: state.posts, type: 'post.publish' },
      { key: STORAGE_KEYS.TAREAS, existing: state.tareas, type: 'tarea.publish' },
    ];
    for (const collection of collections) {
      try {
        const items: unknown = JSON.parse(localStorage.getItem(collection.key) || '[]');
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (typeof item === 'object' && item !== null && 'id' in item &&
            !collection.existing.some((saved) => saved.id === item.id)) {
            this.queue.push({ id: crypto.randomUUID(), type: collection.type, payload: item });
          }
        }
      } catch { /* Un caché local ilegible no sustituye el contenido del servidor. */ }
    }
    this.persistQueue();
    localStorage.setItem(migrationKey, '1');
  }
  private persistQueue(): void {
    try { localStorage.setItem(this.outboxKey(), JSON.stringify(this.queue)); }
    catch { this.error.set('No se pudo conservar el envío pendiente en este navegador.'); }
    try { localStorage.setItem(`${this.outboxKey()}:failed`, JSON.stringify(this.failedQueue)); } catch { /* Mantener el aviso de error actual. */ }
  }
}
