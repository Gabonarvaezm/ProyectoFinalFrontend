import { SupabaseFilesRepository } from './supabase-files.repository';
import type { AcademicFile } from '../../tarea/models/tarea.model';
import { inject, Injectable } from '@angular/core';
import type { AcademicEvent, AcademicSnapshot } from '../models/academic.model';
import { SupabaseClientService } from './supabase-client.service';

export class SupabaseAcademicError extends Error {
  readonly retryable: boolean;
  constructor(message: string, readonly code?: string) {
    super(message);
    this.retryable = !code || ['PGRST000','PGRST001','PGRST002','57014'].includes(code);
  }
}

@Injectable({ providedIn: 'root' })
export class SupabaseAcademicRepository {
  private readonly connection = inject(SupabaseClientService);

  private readonly files = inject(SupabaseFilesRepository);

  async snapshot(): Promise<AcademicSnapshot> {
    const { data, error } = await this.connection.client.rpc('academic_snapshot');
    if (error) throw new SupabaseAcademicError(this.message(error), error.code);
    return data as AcademicSnapshot;
  }

  async commit(event: AcademicEvent): Promise<AcademicSnapshot> {
    const payload = { ...event.payload } as Record<string, unknown>;
    for (const key of ['attachment', 'material']) {
      const value = payload[key];
      if (value && typeof value === 'object' && 'name' in value && 'mime' in value && 'base64' in value) {
        payload[key] = await this.files.upload(value as AcademicFile, event.id, key);
      }
    }
    const { error } = await this.connection.client.rpc('academic_mutate', { event: { ...event, payload } });
    if (error) throw new SupabaseAcademicError(this.message(error), error.code);
    // Read through a separate invoker RPC so PostgreSQL RLS remains active.
    return this.snapshot();
  }

  private message(error: { code?: string; message: string }): string {
    if (error.code === 'PGRST002') return 'La Data API de Supabase no está disponible. Revisa que esté activada y exponga el esquema public.';
    if (error.code === 'PGRST202' || error.code === '42P01') return 'Falta aplicar la migración de la base de datos de Supabase.';
    return error.message || 'No se pudo conectar con Supabase. Revisa la conexión.';
  }
}
