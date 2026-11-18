import { Injectable, inject } from '@angular/core';
import { UserPreferences } from '../../configuracion/models/configuracion.model';
import { STORAGE_KEYS } from '../models/auth.model';
import { LocalPersistenceService } from './local-persistence.service';

@Injectable({ providedIn: 'root' })
export class PreferencesRepository {
  private readonly storage = inject(LocalPersistenceService);
  read(userId: string): Partial<UserPreferences> {
    return this.storage.read<Record<string, Partial<UserPreferences>>>(STORAGE_KEYS.PREFERENCES, {})[userId] ?? {};
  }
  save(userId: string, value: UserPreferences): void {
    const users = this.storage.read<Record<string, Partial<UserPreferences>>>(STORAGE_KEYS.PREFERENCES, {});
    this.storage.write(STORAGE_KEYS.PREFERENCES, { ...users, [userId]: value });
  }
}
