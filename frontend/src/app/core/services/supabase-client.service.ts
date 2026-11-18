import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../../../environments/supabase.config';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly platformId = inject(PLATFORM_ID);
  private instance?: SupabaseClient;

  get client(): SupabaseClient {
    if (!isPlatformBrowser(this.platformId)) throw new Error('La conexión a Supabase se inicia en el navegador.');
    return this.instance ??= createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
}
