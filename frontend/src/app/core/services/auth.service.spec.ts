import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { STORAGE_KEYS } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(STORAGE_KEYS.REGISTERED_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('debe autenticar un usuario con credenciales válidas', async () => {
    vi.useFakeTimers();

    const loginPromise = firstValueFrom(
      service.login({
        email: 'estudiante.test@universidad.edu',
        password: 'password123',
        rememberMe: true,
      })
    );

    // Avanzar temporizador simulado de delay
    await vi.advanceTimersByTimeAsync(1000);

    const res = await loginPromise;
    expect(res).toBeTruthy();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('estudiante.test@universidad.edu');
    expect(service.currentUser()?.role).toBe('student');
  });

  it('debe rechazar credenciales incompletas o contraseñas cortas', async () => {
    await expect(
      firstValueFrom(service.login({ email: '', password: '' }))
    ).rejects.toThrow('Credenciales incompletas.');

    await expect(
      firstValueFrom(service.login({ email: 'usuario@correo.com', password: '123' }))
    ).rejects.toThrow('inferior a 6 caracteres');
  });

  it('debe asignar el rol registrado previamente si coincide el correo', async () => {
    vi.useFakeTimers();

    localStorage.setItem(
      STORAGE_KEYS.REGISTERED_USER,
      JSON.stringify({
        fullName: 'Prof. Roberto Gómez',
        email: 'roberto@universidad.edu',
        institution: 'Facultad de Ciencias',
        role: 'professor',
      })
    );

    const loginPromise = firstValueFrom(
      service.login({
        email: 'roberto@universidad.edu',
        password: 'password123',
      })
    );
    await vi.advanceTimersByTimeAsync(1000);
    const res = await loginPromise;

    expect(res.user.role).toBe('professor');
    expect(res.user.fullName).toBe('Prof. Roberto Gómez');
    expect(res.user.institution).toBe('Facultad de Ciencias');
  });

  it('debe cerrar sesión y reiniciar el estado reactivo', async () => {
    vi.useFakeTimers();

    const loginPromise = firstValueFrom(
      service.login({
        email: 'docente.test@universidad.edu',
        password: 'password123',
      })
    );
    await vi.advanceTimersByTimeAsync(1000);
    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});
