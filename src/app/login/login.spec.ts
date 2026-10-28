import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
