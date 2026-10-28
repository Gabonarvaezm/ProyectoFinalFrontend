import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

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

  it('debe autenticar mediante Google Institucional', async () => {
    vi.useFakeTimers();

    const googleLoginPromise = firstValueFrom(service.loginWithGoogle());
    await vi.advanceTimersByTimeAsync(1200);

    const res = await googleLoginPromise;
    expect(res).toBeTruthy();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.fullName).toBe('Estudiante Institucional');
  });

  it('debe cerrar sesión y reiniciar el estado reactivo', async () => {
    vi.useFakeTimers();

    const googleLoginPromise = firstValueFrom(service.loginWithGoogle());
    await vi.advanceTimersByTimeAsync(1200);
    await googleLoginPromise;

    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});
