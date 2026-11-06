import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Login } from './login';
import { LoginFormComponent, LoginHeroComponent } from './components';

describe('Login Component (Smart Parent & Presentational Child Nodes)', () => {
  let parentComponent: Login;
  let parentFixture: ComponentFixture<Login>;
  let formComponent: LoginFormComponent;
  let formFixture: ComponentFixture<LoginFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login, LoginHeroComponent, LoginFormComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    parentFixture = TestBed.createComponent(Login);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    formFixture = TestBed.createComponent(LoginFormComponent);
    formComponent = formFixture.componentInstance;
    formFixture.detectChanges();

    await parentFixture.whenStable();
    await formFixture.whenStable();
  });

  describe('Componente Padre: Login (Smart Orchestrator)', () => {
    it('debe crearse correctamente e instanciar estados iniciales', () => {
      expect(parentComponent).toBeTruthy();
      expect(parentComponent.isLoading()).toBe(false);
      expect(parentComponent.errorMessage()).toBeNull();
      expect(parentComponent.successMessage()).toBeNull();
    });

    it('debe redirigir a /estudiante tras un login exitoso de estudiante', async () => {
      vi.useFakeTimers();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      parentComponent.handleLogin({
        email: 'estudiante.test@universidad.edu',
        password: 'password123',
        rememberMe: false,
      });

      expect(parentComponent.isLoading()).toBe(true);

      // Avanza el delay del AuthService (900ms)
      await vi.advanceTimersByTimeAsync(950);
      expect(parentComponent.isLoading()).toBe(false);
      expect(parentComponent.successMessage()).toContain('espacio de estudio');

      // Avanza el setTimeout de navegación (1200ms)
      await vi.advanceTimersByTimeAsync(1250);
      expect(navigateSpy).toHaveBeenCalledWith(['/estudiante']);

      vi.useRealTimers();
    });

    it('debe redirigir a /profesor tras un login exitoso con rol de profesor', async () => {
      vi.useFakeTimers();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      // Simular registro previo de profesor en localStorage
      localStorage.setItem(
        'disceria_registered_user',
        JSON.stringify({
          email: 'profesor.test@universidad.edu',
          fullName: 'Profesor Test',
          role: 'professor',
        })
      );

      parentComponent.handleLogin({
        email: 'profesor.test@universidad.edu',
        password: 'password123',
        rememberMe: false,
      });

      expect(parentComponent.isLoading()).toBe(true);

      await vi.advanceTimersByTimeAsync(950);
      expect(parentComponent.successMessage()).toContain('panel docente');

      await vi.advanceTimersByTimeAsync(1250);
      expect(navigateSpy).toHaveBeenCalledWith(['/profesor']);

      localStorage.removeItem('disceria_registered_user');
      vi.useRealTimers();
    });

    it('debe emitir mensaje de recuperación al ejecutar handleForgotPassword', () => {
      parentComponent.handleForgotPassword('test@universidad.edu');
      expect(parentComponent.successMessage()).toContain('test@universidad.edu');
    });
  });

  describe('Componente Hijo Auxiliar: LoginFormComponent (Dumb Form & Validations)', () => {
    it('debe inicializar el formulario con campos vacíos e inválidos', () => {
      expect(formComponent.loginForm).toBeDefined();
      expect(formComponent.loginForm.valid).toBe(false);
      expect(formComponent.loginForm.get('email')?.value).toBe('');
      expect(formComponent.loginForm.get('password')?.value).toBe('');
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

    it('debe emitir loginSubmitted con los datos tipados cuando el formulario es válido', () => {
      const emitSpy = vi.fn();
      formComponent.loginSubmitted.subscribe(emitSpy);

      formComponent.loginForm.setValue({
        email: 'alumno@universidad.edu',
        password: 'password123',
        rememberMe: true,
      });

      formComponent.onSubmit();
      expect(emitSpy).toHaveBeenCalledWith({
        email: 'alumno@universidad.edu',
        password: 'password123',
        rememberMe: true,
      });
    });
  });
});
