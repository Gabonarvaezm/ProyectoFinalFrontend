import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Login } from './login';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el formulario con campos vacíos e inválidos', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.valid).toBe(false);
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('debe validar el formato del correo institucional', () => {
    const emailControl = component.emailControl;
    emailControl?.setValue('correo-invalido');
    expect(emailControl?.valid).toBe(false);

    emailControl?.setValue('estudiante@universidad.edu');
    expect(emailControl?.valid).toBe(true);
  });

  it('debe requerir un mínimo de 6 caracteres para la contraseña', () => {
    const passwordControl = component.passwordControl;
    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('123456');
    expect(passwordControl?.valid).toBe(true);
  });

  it('debe alternar la visibilidad de la contraseña al llamar a togglePasswordVisibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('debe marcar todos los campos como touched si el formulario es inválido al hacer submit', () => {
    component.onSubmit();
    expect(component.loginForm.touched).toBe(true);
    expect(component.errorMessage()).toBeTruthy();
    expect(component.isLoading()).toBe(false);
  });

  it('debe redirigir a /estudiante tras un login exitoso de estudiante', async () => {
    vi.useFakeTimers();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.loginForm.setValue({
      email: 'estudiante.test@universidad.edu',
      password: 'password123',
      rememberMe: false,
    });

    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    // Avanza el delay del AuthService (900ms)
    await vi.advanceTimersByTimeAsync(950);
    expect(component.isLoading()).toBe(false);
    expect(component.successMessage()).toContain('espacio de estudio');

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

    component.loginForm.setValue({
      email: 'profesor.test@universidad.edu',
      password: 'password123',
      rememberMe: false,
    });

    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    await vi.advanceTimersByTimeAsync(950);
    expect(component.successMessage()).toContain('panel docente');

    await vi.advanceTimersByTimeAsync(1250);
    expect(navigateSpy).toHaveBeenCalledWith(['/profesor']);

    localStorage.removeItem('disceria_registered_user');
    vi.useRealTimers();
  });
});
