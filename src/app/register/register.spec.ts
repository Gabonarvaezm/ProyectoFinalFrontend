import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Register } from './register';

describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el formulario con valores por defecto e inválidos', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.valid).toBe(false);
    expect(component.registerForm.get('role')?.value).toBe('student');
    expect(component.registerForm.get('acceptTerms')?.value).toBe(false);
  });

  it('debe validar el nombre completo', () => {
    const fullNameControl = component.fullNameControl;
    fullNameControl?.setValue('Ab');
    expect(fullNameControl?.valid).toBe(false);

    fullNameControl?.setValue('Gabriel Narváez');
    expect(fullNameControl?.valid).toBe(true);
  });

  it('debe validar el formato del correo institucional', () => {
    const emailControl = component.emailControl;
    emailControl?.setValue('correo-invalido');
    expect(emailControl?.valid).toBe(false);

    emailControl?.setValue('gabriel@universidad.edu');
    expect(emailControl?.valid).toBe(true);
  });

  it('debe validar que la contraseña y confirmPassword coincidan', () => {
    const passwordControl = component.passwordControl;
    const confirmControl = component.confirmPasswordControl;

    passwordControl?.setValue('Password123');
    confirmControl?.setValue('Diferente123');
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);

    confirmControl?.setValue('Password123');
    expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
  });

  it('debe alternar la visibilidad de las contraseñas', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);

    expect(component.showConfirmPassword()).toBe(false);
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword()).toBe(true);
  });

  it('debe requerir la aceptación de términos y condiciones', () => {
    const termsControl = component.acceptTermsControl;
    expect(termsControl?.valid).toBe(false);

    termsControl?.setValue(true);
    expect(termsControl?.valid).toBe(true);
  });

  it('debe marcar todos los campos como touched si el formulario es inválido al hacer submit', () => {
    component.onSubmit();
    expect(component.registerForm.touched).toBe(true);
    expect(component.errorMessage()).toContain('completa correctamente');
  });

  it('debe procesar el registro cuando el formulario es válido', () => {
    vi.useFakeTimers();

    component.registerForm.setValue({
      fullName: 'Carlos Docente',
      email: 'carlos@universidad.edu',
      institution: 'Universidad Nacional',
      role: 'professor',
      password: 'Password123',
      confirmPassword: 'Password123',
      acceptTerms: true,
    });

    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    vi.advanceTimersByTime(1200);
    expect(component.isLoading()).toBe(false);
    expect(component.successMessage()).toContain('¡Cuenta creada exitosamente');
  });
});
