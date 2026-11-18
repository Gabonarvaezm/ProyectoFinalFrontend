import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseAuthRepository } from '../core/services/supabase-auth.repository';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-password-recovery',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main>
      <h1>Crear nueva contraseña</h1>
      <p>Abre esta página desde el enlace que recibiste en tu correo.</p>
      <form [formGroup]="form" (ngSubmit)="save()">
        <label for="new-password">Nueva contraseña</label>
        <input id="new-password" type="password" autocomplete="new-password" formControlName="password" minlength="8" required />
        <label for="repeat-password">Repetir contraseña</label>
        <input id="repeat-password" type="password" autocomplete="new-password" formControlName="confirmation" required />
        <p>Usa al menos 8 caracteres, con letras y números.</p>
        @if (error()) { <p role="alert">{{ error() }}</p> }
        @if (success()) { <p role="status">Contraseña actualizada. Ya puedes iniciar sesión.</p> }
        <button type="submit" [disabled]="saving() || success()">{{ saving() ? 'Guardando…' : 'Actualizar contraseña' }}</button>
      </form>
      <a routerLink="/login">Volver a iniciar sesión</a>
    </main>
  `,
  styles: [`:host{display:grid;min-height:100dvh;place-items:center;background:var(--color-bg-app);color:var(--color-text-main);padding:1rem}
    main{max-width:440px;width:100%;padding:2rem;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:1rem;box-sizing:border-box}
    h1{font-size:1.5rem}form{display:grid;gap:.75rem;margin-block:1rem}input{padding:.75rem;color:var(--color-text-main);background:var(--color-bg-muted);border:1px solid var(--color-border);border-radius:.5rem;min-width:0}
    input:focus-visible{outline:2px solid var(--color-border-focus)}p{font-size:.875rem}button{padding:.75rem;background:var(--color-auth-action-bg);color:white;border:0;border-radius:.5rem;cursor:pointer}a{color:var(--color-primary)}[role=alert]{color:var(--color-danger)}`],
})
export class PasswordRecoveryComponent {
  private readonly auth = inject(AuthService);
  private readonly repository = inject(SupabaseAuthRepository);
  readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)]],
    confirmation: ['', Validators.required],
  });
  readonly error = signal('');
  readonly saving = signal(false);
  readonly success = signal(false);
  async save(): Promise<void> {
    if (this.saving()) return;
    this.error.set('');
    const { password, confirmation } = this.form.getRawValue();
    if (this.form.invalid || password !== confirmation) { this.form.markAllAsTouched(); this.error.set('Verifica que las contraseñas coincidan y cumplan los requisitos.'); return; }
    this.saving.set(true);
    try {
      await this.auth.whenReady();
      if (!this.auth.isAuthenticated()) throw new Error('El enlace no es válido o expiró. Solicita uno nuevo desde el inicio de sesión.');
      await this.repository.updatePassword(password);
      this.success.set(true);
      this.auth.logout();
    } catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.'); }
    finally { this.saving.set(false); }
  }
}
