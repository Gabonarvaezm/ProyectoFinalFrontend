import { LocalPersistenceService } from './local-persistence.service';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DestroyRef, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { AcademicEvent, AcademicSnapshot } from '../models/academic.model';
import { STORAGE_KEYS } from '../models/auth.model';
import { ACADEMIC_MODE } from './academic-mode';
import { LocalAcademicRepository } from './local-academic.repository';

@Injectable({ providedIn: 'root' })
export class AcademicSyncService {
  private readonly storage = inject(LocalPersistenceService);
  private readonly mode = inject(ACADEMIC_MODE);
  private readonly local = inject(LocalAcademicRepository);
  readonly isLocalDemo = this.mode === 'local';
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private running = false;
  private generation = 0;
  private stateVersion = 0;
  private queue: AcademicEvent[] = [];
  private failedQueue: AcademicEvent[] = [];
  private intervalId?: ReturnType<typeof setInterval>;
  private migrated = false;
  private serverAvailable = true;
  readonly enabled = signal(false);
  readonly snapshot = signal<AcademicSnapshot | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  start(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    this.started = true;
    this.enabled.set(true);
    if (this.isLocalDemo) {
      effect(() => {
        const user = this.auth.currentUser();
        this.generation++;
        this.error.set(null);
        try { this.snapshot.set(user ? this.local.snapshot(user) : null); }
        catch (error: unknown) { this.snapshot.set(null); this.error.set(error instanceof Error ? error.message : 'No se pudieron leer los datos locales.'); }
      });
      const changed = (event: StorageEvent) => {
        if (event.key === STORAGE_KEYS.LOCAL_ACADEMIC || event.key === null) void this.refresh();
      };
      window.addEventListener('storage', changed);
      this.destroyRef.onDestroy(() => window.removeEventListener('storage', changed));
      return;
    }
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
      try { this.queue = JSON.parse(this.storage.readText(this.outboxKey()) || '[]') as AcademicEvent[]; }
      catch { this.queue = []; }
      try { this.failedQueue = JSON.parse(this.storage.readText(`${this.outboxKey()}:failed`) || '[]') as AcademicEvent[]; }
      catch { this.failedQueue = []; }
      if (!Array.isArray(this.queue)) this.queue = [];
      if (!Array.isArray(this.failedQueue)) this.failedQueue = [];
      if (this.failedQueue.length) this.error.set('Hay publicaciones que no pudieron enviarse. Reintenta o descarta el envío para corregirlo.');
      this.serverAvailable = true;
      void this.refresh();
      this.intervalId = setInterval(() => {
        if (this.serverAvailable) {
          void this.refresh();
        } else if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = undefined;
        }
      }, 4000);
    });
    this.destroyRef.onDestroy(() => { if (this.intervalId) clearInterval(this.intervalId); });
  }

  publish(type: string, payload: object): void {
    if (!this.started) return;
    if (this.isLocalDemo) {
      const user = this.auth.currentUser();
      if (!user) throw new Error('Inicia una sesión local para guardar.');
      try {
        this.snapshot.set(this.local.mutate(user, { id: crypto.randomUUID(), type, payload }));
        this.error.set(null);
      } catch (error: unknown) {
        this.error.set(error instanceof Error ? error.message : 'No se pudo guardar localmente.');
        // A rejected storage write must also roll back any legacy optimistic service view.
        this.snapshot.set(this.local.snapshot(user));
        throw error;
      }
      return;
    }
    if (!this.auth.sessionToken()) {
      this.error.set('Inicia sesión de nuevo para publicar y recibir contenidos.');
      return;
    }
    this.queue.push({ id: crypto.randomUUID(), type, payload });
    this.persistQueue();
    if (this.serverAvailable) {
      this.saving.set(true);
      void this.refresh();
    }
  }

  async commit(type: string, payload: object): Promise<AcademicSnapshot> {
    if (this.isLocalDemo) {
      const user = this.auth.currentUser();
      if (!user) throw new Error('Inicia una sesión local para guardar.');
      this.saving.set(true);
      try {
        const state = await this.local.commit(user, { id: crypto.randomUUID(), type, payload });
        if (this.auth.currentUser()?.id !== user.id) throw new Error('La sesión local cambió durante el guardado.');
        this.snapshot.set(state); this.error.set(null); return state;
      } catch (error: unknown) {
        this.error.set(error instanceof Error ? error.message : 'No se pudo guardar localmente.'); throw error;
      } finally { this.saving.set(false); }
    }
    const token = this.auth.sessionToken();
    if (!token) throw new Error('Inicia sesión para guardar.');
    const generation = this.generation;
    this.stateVersion++;
    this.saving.set(true);
    try {
      const state = await firstValueFrom(this.http.post<AcademicSnapshot>('/api/academic/events',
        { id: crypto.randomUUID(), type, payload },
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }).pipe(timeout(15000)));
      if (generation !== this.generation) throw new Error('La sesión cambió durante el guardado.');
      this.stateVersion++;
      this.snapshot.set(state);
      return state;
    } catch (error: unknown) {
      const detail: unknown = error instanceof HttpErrorResponse ? error.error : null;
      throw new Error(typeof detail === 'object' && detail !== null && 'error' in detail && typeof detail.error === 'string'
        ? detail.error : 'No se pudo confirmar el guardado. Revisa la conexión y recarga antes de reintentar.');
    } finally { this.saving.set(false); }
  }

  async refresh(): Promise<void> {
    if (this.isLocalDemo) {
      const user = this.auth.currentUser();
      try { this.snapshot.set(user ? this.local.snapshot(user) : null); this.error.set(null); }
      catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'No se pudieron recuperar los datos locales.'); }
      return;
    }
    const token = this.auth.sessionToken();
    if (!token || this.running || !this.serverAvailable) return;
    const generation = this.generation;
    const stateVersion = this.stateVersion;
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
        if (stateVersion === this.stateVersion) this.snapshot.set(result);
      }
      const result = await firstValueFrom(this.http.get<AcademicSnapshot>('/api/academic/state', { headers }).pipe(timeout(15000)));
      if (generation === this.generation) {
        if (stateVersion === this.stateVersion) this.snapshot.set(result);
        if (!this.failedQueue.length) this.error.set(null);
        this.importLegacyContent(result);
      }
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      if (!writing) {
        if (
          (error instanceof HttpErrorResponse &&
            (error.status === 0 ||
              error.status === 502 ||
              error.status === 503 ||
              error.status === 504)) ||
          (error instanceof Error && error.name === 'TimeoutError')
        ) {
          this.serverAvailable = false;
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
          }
          this.error.set('No se puede conectar con la API académica. El modo servidor requiere un backend disponible.');
          this.saving.set(false);
          return;
        }
      }
      if (writing) {
        const detail: unknown = error instanceof HttpErrorResponse ? error.error : null;
        this.error.set(typeof detail === 'object' && detail !== null && 'error' in detail && typeof detail.error === 'string'
          ? detail.error : 'No se pudo compartir el contenido. Conservamos el envío para reintentarlo.');
        if (error instanceof HttpErrorResponse && [400, 403, 404, 409].includes(error.status)) {
          const failed = this.queue.shift();
          if (failed) this.failedQueue.push(failed);
          this.persistQueue();
        }
      }
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.auth.logout();
        void this.router.navigate(['/login']);
      }
    } finally {
      this.running = false;
      this.saving.set(this.serverAvailable && this.queue.length > 0 && !this.error());
      if (this.serverAvailable && this.queue.length && !this.error() && generation === this.generation) void this.refresh();
    }
  }

  receipt(id: string, read: boolean, deleted = false): void {
    this.snapshot.update((state) => state ? { ...state, notifications: deleted
      ? state.notifications.filter((notice) => notice.id !== id)
      : state.notifications.map((notice) => notice.id === id ? { ...notice, read } : notice) } : null);
    this.publish('notice.receipt', { id, read, deleted });
  }

  retry(): void {
    this.serverAvailable = true;
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
    if (this.serverAvailable) {
      void this.refresh();
    }
  }

  private outboxKey(): string { return `disceria_outbox:${this.auth.currentUser()?.email}`; }
  private importLegacyContent(state: AcademicSnapshot): void {
    if (this.migrated || !this.auth.isProfessor()) return;
    this.migrated = true;
    const migrationKey = `disceria_shared_migration:${this.auth.currentUser()?.email}`;
    if (this.storage.readText(migrationKey)) return;
    const collections = [
      { key: STORAGE_KEYS.BOOKS, existing: state.books, type: 'book.publish' },
      { key: STORAGE_KEYS.FORUM_POSTS, existing: state.posts, type: 'post.publish' },
    ];
    for (const collection of collections) {
      try {
        const items: unknown = JSON.parse(this.storage.readText(collection.key) || '[]');
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
    this.storage.writeText(migrationKey, '1');
  }
  private persistQueue(): void {
    try { this.storage.writeText(this.outboxKey(), JSON.stringify(this.queue)); }
    catch { this.error.set('No se pudo conservar el envío pendiente en este navegador.'); }
    try { this.storage.writeText(`${this.outboxKey()}:failed`, JSON.stringify(this.failedQueue)); } catch { /* Mantener el aviso de error actual. */ }
  }
}
