import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export const ACADEMIC_MODE = new InjectionToken<'local' | 'server' | 'supabase'>('ACADEMIC_MODE', {
  providedIn: 'root', factory: () => environment.academicMode,
});
