import { inject, Injectable } from '@angular/core';
import { AcademicFile } from '../../tarea/models/tarea.model';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseFilesRepository {
  private readonly connection = inject(SupabaseClientService);

  async upload(file: AcademicFile, eventId: string, field: string): Promise<AcademicFile> {
    if (file.storagePath) return file;
    const { data: { user }, error: authError } = await this.connection.client.auth.getUser();
    if (authError || !user) throw new Error('Inicia sesión para adjuntar archivos.');
    const bytes = Uint8Array.from(atob(file.base64), char => char.charCodeAt(0));
    if (!bytes.length || bytes.length > 180 * 1024 || !['application/pdf','image/png','image/jpeg','text/plain'].includes(file.mime)) {
      throw new Error('Formato no permitido o archivo mayor de 180 KB.');
    }
    const path = `${user.id}/${eventId}/${field}`;
    const { error } = await this.connection.client.storage.from('academic-files').upload(path, bytes, { contentType: file.mime, upsert: false });
    if (error && error.statusCode !== '409') throw new Error('No se pudo subir el archivo a Supabase Storage.');
    return { name: file.name, mime: file.mime, base64: '', storagePath: path };
  }

  async download(path: string): Promise<Blob> {
    const { data, error } = await this.connection.client.storage.from('academic-files').download(path);
    if (error || !data) throw new Error('No se pudo descargar el archivo o no tienes permiso para consultarlo.');
    return data;
  }
}
