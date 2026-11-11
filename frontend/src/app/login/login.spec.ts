import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoginPageComponent } from './login-page.component';
import { Login } from './login';
import { LoginFormComponent, LoginHeroComponent } from './components';

describe('Login Component (Smart Parent & Presentational Child Nodes)', () => {
  let parentComponent: LoginPageComponent;
  let parentFixture: ComponentFixture<LoginPageComponent>;
  let formComponent: LoginFormComponent;
  let formFixture: ComponentFixture<LoginFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, Login, LoginHeroComponent, LoginFormComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    parentFixture = TestBed.createComponent(LoginPageComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    formFixture = TestBed.createComponent(LoginFormComponent);
    formComponent = formFixture.componentInstance;
    formFixture.detectChanges();

    await parentFixture.whenStable();
    await formFixture.whenStable();
  });

  describe('Componente Padre: LoginPageComponent (Smart Orchestrator)', () => {
    it('debe crearse correctamente e instanciar estados iniciales con rol de estudiante por defecto', () => {
      expect(parentComponent).toBeTruthy();
      expect(parentComponent.currentRole()).toBe('student');
      expect(parentComponent.isLoading()).toBe(false);
      expect(parentComponent.errorMessage()).toBeNull();
      expect(parentComponent.successMessage()).toBeNull();
    });

    it('debe alternar el rol seleccionado mediante onRoleChange', () => {
      parentComponent.onRoleChange('professor');
      expect(parentComponent.currentRole()).toBe('professor');

      parentComponent.onRoleChange('student');
      expect(parentComponent.currentRole()).toBe('student');
    });

    it('debe redirigir a /estudiante/dashboard tras un login exitoso de estudiante', async () => {
      vi.useFakeTimers();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      parentComponent.handleLogin({
        email: 'estudiante.test@universidad.edu',
        password: 'password123',
        rememberMe: false,
        role: 'student',
      });

      expect(parentComponent.isLoading()).toBe(true);

      // Avanza el delay del AuthService (900ms)
      await vi.advanceTimersByTimeAsync(950);
      expect(parentComponent.isLoading()).toBe(false);
      expect(parentComponent.successMessage()).toContain('espacio de estudio');

      // Avanza el setTimeout de navegación (1200ms)
      await vi.advanceTimersByTimeAsync(1250);
      expect(navigateSpy).toHaveBeenCalledWith(['/estudiante/dashboard']);

      vi.useRealTimers();
    });

    it('debe redirigir a /profesor/dashboard tras un login exitoso con rol de profesor', async () => {
      vi.useFakeTimers();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      // Simular selección o registro de profesor
      parentComponent.onRoleChange('professor');

      parentComponent.handleLogin({
        email: 'profesor.test@universidad.edu',
        password: 'password123',
        rememberMe: false,
        role: 'professor',
      });

      expect(parentComponent.isLoading()).toBe(true);

      await vi.advanceTimersByTimeAsync(950);
      expect(parentComponent.successMessage()).toContain('panel docente');

      await vi.advanceTimersByTimeAsync(1250);
      expect(navigateSpy).toHaveBeenCalledWith(['/profesor/dashboard']);

      vi.useRealTimers();
    });

    it('debe emitir mensaje de recuperación al ejecutar handleForgotPassword', () => {
      parentComponent.handleForgotPassword('test@universidad.edu');
      expect(parentComponent.successMessage()).toContain('test@universidad.edu');
    });
  });

  describe('Componente Hijo Auxiliar: LoginFormComponent (Dumb Form & Validations)', () => {
    it('debe inicializar el formulario con campos vacíos e inválidos y rol por defecto estudiante', () => {
      expect(formComponent.loginForm).toBeDefined();
      expect(formComponent.loginForm.valid).toBe(false);
      expect(formComponent.loginForm.get('email')?.value).toBe('');
      expect(formComponent.loginForm.get('password')?.value).toBe('');
      expect(formComponent.selectedRole()).toBe('student');
    });

    it('debe emitir roleChange cuando se selecciona una pestaña de rol diferente', () => {
      const roleSpy = vi.fn();
      formComponent.roleChange.subscribe(roleSpy);

      formComponent.onSelectRole('professor');
      expect(roleSpy).toHaveBeenCalledWith('professor');
    });

    it('debe validar el formato del correo institucional', () => {
      const emailControl = formComponent.emailControl;
      emailControl?.setValue('correo-invalido');
      expect(emailControl?.valid).toBe(false);

      emailControl?.setValue('estudiante@universidad.edu');
      expect(emailControl?.valid).toBe(true);
    });

    it('debe requerir un mínimo de 6 caracteres para la contraseña', () => {
      const passwordControl = formComponent.passwordControl;
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBe(true);
    });

    it('debe alternar la visibilidad de la contraseña al llamar a togglePasswordVisibility', () => {
      expect(formComponent.showPassword()).toBe(false);
      formComponent.togglePasswordVisibility();
      expect(formComponent.showPassword()).toBe(true);
      formComponent.togglePasswordVisibility();
      expect(formComponent.showPassword()).toBe(false);
    });

    it('debe marcar todos los campos como touched si el formulario es inválido al hacer submit', () => {
      formComponent.onSubmit();
      expect(formComponent.loginForm.touched).toBe(true);
      expect(formComponent.localErrorMessage()).toBeTruthy();
    });

    it('debe emitir submitLogin y loginSubmitted con los datos tipados y el rol cuando el formulario es válido', () => {
      const submitSpy = vi.fn();
      const submittedSpy = vi.fn();
      formComponent.submitLogin.subscribe(submitSpy);
      formComponent.loginSubmitted.subscribe(submittedSpy);

      formComponent.loginForm.setValue({
        email: 'alumno@universidad.edu',
        password: 'password123',
        rememberMe: true,
      });

      formComponent.onSubmit();
      const expectedPayload = {
        email: 'alumno@universidad.edu',
        password: 'password123',
        rememberMe: true,
        role: 'student',
      };
      expect(submitSpy).toHaveBeenCalledWith(expectedPayload);
      expect(submittedSpy).toHaveBeenCalledWith(expectedPayload);
    });
  });
});
