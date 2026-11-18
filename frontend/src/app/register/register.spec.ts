import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Register } from './register';
import { RegisterFormComponent, RegisterHeroComponent } from './components';

describe('Register Component (Smart Parent & Presentational Child Nodes)', () => {
  let parentComponent: Register;
  let parentFixture: ComponentFixture<Register>;
  let formComponent: RegisterFormComponent;
  let formFixture: ComponentFixture<RegisterFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register, RegisterHeroComponent, RegisterFormComponent],
      providers: [provideRouter([]), provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    parentFixture = TestBed.createComponent(Register);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();

    formFixture = TestBed.createComponent(RegisterFormComponent);
    formComponent = formFixture.componentInstance;
    formFixture.detectChanges();

    await parentFixture.whenStable();
    await formFixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem('disceria_registered_user');
  });

  describe('Componente Padre: Register (Smart Orchestrator)', () => {
    it('debe crearse correctamente e inicializar estados', () => {
      expect(parentComponent).toBeTruthy();
      expect(parentComponent.isLoading()).toBe(false);
      expect(parentComponent.errorMessage()).toBeNull();
      expect(parentComponent.successMessage()).toBeNull();
    });

    it('debe procesar el registro, almacenar usuario en localStorage y navegar a /login', async () => {
      vi.useFakeTimers();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      parentComponent.handleRegister({
        fullName: 'Carlos Docente',
        email: 'carlos@universidad.edu',
        institution: 'Universidad Nacional',
        role: 'professor',
        password: 'Password123',
      });

      expect(parentComponent.isLoading()).toBe(true);

      TestBed.inject(HttpTestingController).expectOne('/api/academic/register').flush({ user: { id: 'registered-user', fullName: 'Carlos Docente', email: 'carlos@universidad.edu', institution: 'Universidad Nacional', role: 'professor' } });

      // Simulación de registro (1200ms)
      await vi.advanceTimersByTimeAsync(1250);
      expect(parentComponent.isLoading()).toBe(false);
      expect(parentComponent.successMessage()).toContain('¡Cuenta creada exitosamente');

      // Comprobar persistencia en localStorage
      const stored = localStorage.getItem('disceria_registered_user');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored || '{}');
      expect(parsed.email).toBe('carlos@universidad.edu');
      expect(parsed.role).toBe('professor');

      // Redirección (1500ms)
      await vi.advanceTimersByTimeAsync(1550);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Componente Hijo Auxiliar: RegisterFormComponent (Dumb Form & Validations)', () => {
    it('debe inicializar el formulario con valores por defecto e inválidos', () => {
      expect(formComponent.registerForm).toBeDefined();
      expect(formComponent.registerForm.valid).toBe(false);
      expect(formComponent.registerForm.get('role')?.value).toBe('student');
      expect(formComponent.registerForm.get('acceptTerms')?.value).toBe(false);
    });

    it('debe validar el nombre completo', () => {
      const fullNameControl = formComponent.fullNameControl;
      fullNameControl?.setValue('Ab');
      expect(fullNameControl?.valid).toBe(false);

      fullNameControl?.setValue('Gabriel Narváez');
      expect(fullNameControl?.valid).toBe(true);
    });

    it('debe validar el formato del correo institucional', () => {
      const emailControl = formComponent.emailControl;
      emailControl?.setValue('correo-invalido');
      expect(emailControl?.valid).toBe(false);

      emailControl?.setValue('gabriel@universidad.edu');
      expect(emailControl?.valid).toBe(true);
    });

    it('debe validar que la contraseña y confirmPassword coincidan', () => {
      const passwordControl = formComponent.passwordControl;
      const confirmControl = formComponent.confirmPasswordControl;

      passwordControl?.setValue('Password123');
      confirmControl?.setValue('Diferente123');
      expect(formComponent.registerForm.hasError('passwordMismatch')).toBe(true);

      confirmControl?.setValue('Password123');
      expect(formComponent.registerForm.hasError('passwordMismatch')).toBe(false);
    });

    it('debe alternar la visibilidad de las contraseñas', () => {
      expect(formComponent.showPassword()).toBe(false);
      formComponent.togglePasswordVisibility();
      expect(formComponent.showPassword()).toBe(true);

      expect(formComponent.showConfirmPassword()).toBe(false);
      formComponent.toggleConfirmPasswordVisibility();
      expect(formComponent.showConfirmPassword()).toBe(true);
    });

    it('debe requerir la aceptación de términos y condiciones', () => {
      const termsControl = formComponent.acceptTermsControl;
      expect(termsControl?.valid).toBe(false);

      termsControl?.setValue(true);
      expect(termsControl?.valid).toBe(true);
    });

    it('debe marcar todos los campos como touched si el formulario es inválido al hacer submit', () => {
      formComponent.onSubmit();
      expect(formComponent.registerForm.touched).toBe(true);
      expect(formComponent.localErrorMessage()).toContain('completa correctamente');
    });

    it('debe calcular reactivamente la fortaleza de la contraseña', () => {
      formComponent.passwordControl?.setValue('abc');
      expect(formComponent.passwordStrength().level).toBe(1);

      formComponent.passwordControl?.setValue('Password123');
      expect(formComponent.passwordStrength().level).toBe(2);

      formComponent.passwordControl?.setValue('Password123#');
      expect(formComponent.passwordStrength().level).toBe(3);
    });

    it('debe emitir registerSubmitted con datos válidos al hacer submit', () => {
      const emitSpy = vi.fn();
      formComponent.registerSubmitted.subscribe(emitSpy);

      formComponent.registerForm.setValue({
        fullName: 'Laura Gómez',
        email: 'laura@universidad.edu',
        institution: 'Universidad Tecnológica',
        role: 'student',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: true,
      });

      formComponent.onSubmit();
      expect(emitSpy).toHaveBeenCalledWith({
        fullName: 'Laura Gómez',
        email: 'laura@universidad.edu',
        institution: 'Universidad Tecnológica',
        role: 'student',
        password: 'Password123',
      });
    });
  });
});
