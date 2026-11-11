import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, MOCK_USERS } from './auth.service';
import { STORAGE_KEYS } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.REGISTERED_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);

    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.REGISTERED_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  });

  it('debe crearse correctamente e inicializarse sin usuario si no hay sesión previa', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getCurrentRole()).toBeNull();
  });

  it('debe autenticar las credenciales mock de Estudiante y persistir la sesión activa en localStorage', async () => {
    vi.useFakeTimers();

    const loginPromise = firstValueFrom(
      service.login({
        email: 'estudiante@universidad.edu',
        password: 'password123',
        rememberMe: true,
      })
    );

    await vi.advanceTimersByTimeAsync(900);
    const res = await loginPromise;

    expect(res).toBeTruthy();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isStudent()).toBe(true);
    expect(service.isProfessor()).toBe(false);
    expect(service.hasRole('student')).toBe(true);
    expect(service.getCurrentRole()).toBe('student');
    expect(service.currentUser()?.fullName).toBe('Alejandro Silva');

    // Verificar persistencia en localStorage
    const savedSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    expect(savedSession).toBeTruthy();
    expect(JSON.parse(savedSession!).email).toBe('estudiante@universidad.edu');
  });

  it('debe autenticar las credenciales mock de Profesor', async () => {
    vi.useFakeTimers();

    const loginPromise = firstValueFrom(
      service.login({
        email: 'profesor@universidad.edu',
        password: 'password123',
      })
    );

    await vi.advanceTimersByTimeAsync(900);
    const res = await loginPromise;

    expect(res.user.role).toBe('professor');
    expect(service.isProfessor()).toBe(true);
    expect(service.isStudent()).toBe(false);
    expect(service.currentUser()?.fullName).toBe('Prof. Carlos Mendoza');
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
    await vi.advanceTimersByTimeAsync(900);
    const res = await loginPromise;

    expect(res.user.role).toBe('professor');
    expect(res.user.fullName).toBe('Prof. Roberto Gómez');
    expect(res.user.institution).toBe('Facultad de Ciencias');
  });

  it('debe cerrar sesión, limpiar localStorage y reiniciar el estado reactivo', async () => {
    vi.useFakeTimers();

    const loginPromise = firstValueFrom(
      service.login({
        email: 'profesor@universidad.edu',
        password: 'password123',
      })
    );
    await vi.advanceTimersByTimeAsync(900);
    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getCurrentRole()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION)).toBeNull();
  });
});
