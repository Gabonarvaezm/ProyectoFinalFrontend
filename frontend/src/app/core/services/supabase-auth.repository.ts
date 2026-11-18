import { inject, Injectable } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { AuthResponse, RegisteredUserData, User } from '../models/auth.model';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthRepository {
  private readonly connection = inject(SupabaseClientService);

  async profile(session: Session): Promise<AuthResponse> {
    const { data, error } = await this.connection.client.from('profiles')
      .select('id,email,full_name,role,institution').eq('id', session.user.id).single();
    if (error?.code === 'PGRST002') throw new Error('La Data API de Supabase no está disponible. Revisa la configuración del proyecto.');
    if (error || !data) throw new Error('No se pudo cargar tu perfil. Comprueba que la migración de Supabase esté aplicada.');
    return { token: session.access_token, user: {
      id: data.id, email: data.email, fullName: data.full_name, role: data.role, institution: data.institution,
    } as User };
  }

  async restore(): Promise<AuthResponse | null> {
    const { data, error } = await this.connection.client.auth.getSession();
    if (error) throw error;
    return data.session ? this.profile(data.session) : null;
  }

  subscribe(listener: (session: Session | null) => void): () => void {
    // Do not await another Supabase request inside the Auth callback.
    const { data } = this.connection.client.auth.onAuthStateChange((_event, session) => listener(session));
    return () => data.subscription.unsubscribe();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.connection.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Email not confirmed'
      ? 'Confirma tu correo antes de iniciar sesión.' : 'Correo o contraseña incorrectos.');
    return this.profile(data.session);
  }

  async register(input: RegisteredUserData & { password: string }): Promise<{ user: User; message: string }> {
    const { data, error } = await this.connection.client.auth.signUp({
      email: input.email.trim().toLowerCase(), password: input.password,
      options: { emailRedirectTo: `${window.location.origin}/login`, data: {
        full_name: input.fullName.trim(), institution: input.institution.trim(), requested_role: input.role,
      } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo registrar la cuenta.');
    // A teacher role is granted only by the database administrator, never from browser metadata.
    return { user: { id: data.user.id, email: input.email, fullName: input.fullName, institution: input.institution, role: 'student' },
      message: 'Registro recibido. Si el correo es nuevo, revisa tu bandeja para confirmar la cuenta.' +
        (input.role === 'professor' ? ' El acceso docente requiere autorización del administrador.' : '') };
  }

  async logout(): Promise<void> {
    const { error } = await this.connection.client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.connection.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-contrasena`,
    });
    if (error) throw new Error(error.message);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.connection.client.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }
}
