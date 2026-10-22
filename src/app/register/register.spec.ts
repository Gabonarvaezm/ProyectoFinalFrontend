import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
    const confirmPasswordControl = component.confirmPasswordControl;

    passwordControl?.setValue('Password123');
    confirmPasswordControl?.setValue('OtraPassword123');
    component.registerForm.updateValueAndValidity();

    expect(confirmPasswordControl?.hasError('passwordMismatch')).toBe(true);

    confirmPasswordControl?.setValue('Password123');
    component.registerForm.updateValueAndValidity();

    expect(confirmPasswordControl?.hasError('passwordMismatch')).toBe(false);
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
    termsControl?.setValue(false);
    expect(termsControl?.valid).toBe(false);

    termsControl?.setValue(true);
    expect(termsControl?.valid).toBe(true);
  });

  it('debe marcar todos los campos como touched si el formulario es inválido al hacer submit', () => {
    component.onSubmit();
    expect(component.registerForm.touched).toBe(true);
    expect(component.errorMessage()).toBeTruthy();
    expect(component.isLoading()).toBe(false);
  });
});
