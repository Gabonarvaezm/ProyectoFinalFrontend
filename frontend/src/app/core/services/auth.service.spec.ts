import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, MOCK_USERS } from './auth.service';
import { STORAGE_KEYS } from '../models/auth.model';

describe('AuthService con cuentas compartidas', () => {
  let service: AuthService;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  it('inicia sin una cuenta autenticada', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
  for (const account of MOCK_USERS) {
    it(`autentica y conserva la cuenta de ${account.user.role} devuelta por el servidor`, async () => {
      const result = firstValueFrom(service.login({ email: account.user.email, password: 'password123', rememberMe: true }));
      http.expectOne('/api/academic/login').flush({ user: account.user, token: 'server-session' });
      expect((await result).user.role).toBe(account.user.role);
      expect(service.sessionToken()).toBe('server-session');
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe('server-session');
      expect(service.getCurrentRole()).toBe(account.user.role);
    });
  }
  it('rechaza datos incompletos antes de llamar al servidor', async () => {
    await expect(firstValueFrom(service.login({ email: '', password: '' }))).rejects.toThrow();
    http.expectNone('/api/academic/login');
  });
  it('no permite elegir un rol distinto al registrado en el servidor', async () => {
    const student = MOCK_USERS[1].user;
    const result = firstValueFrom(service.login({ email: student.email, password: 'password123', role: 'professor' }));
    http.expectOne('/api/academic/login').flush({ user: student, token: 'student-session' });
    await result;
    expect(service.isProfessor()).toBe(false);
  });
  it('mantiene el error de una cuenta incorrecta', async () => {
    const result = firstValueFrom(service.login({ email: 'unknown@example.com', password: 'password123' }));
    const failure = expect(result).rejects.toThrow('Correo o contraseña incorrectos.');
    http.expectOne('/api/academic/login').flush({ error: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    await failure;
  });
  it('limpia la cuenta y el token al cerrar la sesión', async () => {
    const result = firstValueFrom(service.login({ email: MOCK_USERS[0].user.email, password: 'password123' }));
    http.expectOne('/api/academic/login').flush({ user: MOCK_USERS[0].user, token: 'server-session' });
    await result;
    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.sessionToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
  });
});
