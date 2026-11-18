import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PasswordRecoveryComponent } from './password-recovery.component';
import { AuthService } from '../core/services/auth.service';
import { SupabaseAuthRepository } from '../core/services/supabase-auth.repository';

describe('Recuperación real de contraseña', () => {
  it('comprueba confirmación y sesión antes de actualizar; cierra sesión al finalizar', async () => {
    const repository = { updatePassword: vi.fn().mockResolvedValue(undefined) };
    const auth = { whenReady: () => Promise.resolve(), isAuthenticated: vi.fn(() => true), logout: vi.fn() };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth },
      { provide: SupabaseAuthRepository, useValue: repository }] });
    const fixture = TestBed.createComponent(PasswordRecoveryComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ password: 'Password123', confirmation: 'Otro1234' }); await component.save();
    expect(repository.updatePassword).not.toHaveBeenCalled();
    component.form.setValue({ password: 'Password123', confirmation: 'Password123' });
    auth.isAuthenticated.mockReturnValue(false); await component.save();
    expect(repository.updatePassword).not.toHaveBeenCalled();
    expect(component.error()).toContain('expiró');
    auth.isAuthenticated.mockReturnValue(true); await component.save();
    expect(repository.updatePassword).toHaveBeenCalledWith('Password123');
    expect(auth.logout).toHaveBeenCalled(); expect(component.success()).toBe(true);
  });
});
