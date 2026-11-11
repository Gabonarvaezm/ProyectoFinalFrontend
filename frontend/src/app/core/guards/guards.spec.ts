import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { User } from '../models/auth.model';

describe('Guards de Autenticación y Roles', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('debe permitir acceso si el usuario está autenticado', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@universidad.edu',
        fullName: 'Test User',
        role: 'student',
        institution: 'Universidad',
      };
      (authService as unknown as { _currentUser: { set: (u: User | null) => void } })._currentUser.set(
        mockUser
      );

      const canActivate = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(canActivate).toBe(true);
    });

    it('debe redirigir a /login si el usuario no está autenticado', () => {
      (authService as unknown as { _currentUser: { set: (u: User | null) => void } })._currentUser.set(
        null
      );

      const urlTree = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(urlTree).toEqual(router.createUrlTree(['/login']));
    });
  });

  describe('roleGuard', () => {
    it('debe permitir acceso si el rol del usuario coincide con el permitido', () => {
      const mockProf: User = {
        id: '2',
        email: 'prof@universidad.edu',
        fullName: 'Profesor X',
        role: 'professor',
        institution: 'Universidad',
      };
      (authService as unknown as { _currentUser: { set: (u: User | null) => void } })._currentUser.set(
        mockProf
      );

      const guardFn = roleGuard('professor');
      const result = TestBed.runInInjectionContext(() => guardFn({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('debe redirigir a /profesor/dashboard si un profesor intenta acceder a una ruta de estudiante', () => {
      const mockProf: User = {
        id: '2',
        email: 'prof@universidad.edu',
        fullName: 'Profesor X',
        role: 'professor',
        institution: 'Universidad',
      };
      (authService as unknown as { _currentUser: { set: (u: User | null) => void } })._currentUser.set(
        mockProf
      );

      const guardFn = roleGuard('student');
      const result = TestBed.runInInjectionContext(() => guardFn({} as any, {} as any));
      expect(result).toEqual(router.createUrlTree(['/profesor/dashboard']));
    });

    it('debe redirigir a /estudiante/dashboard si un estudiante intenta acceder a una ruta de profesor', () => {
      const mockStudent: User = {
        id: '3',
        email: 'student@universidad.edu',
        fullName: 'Estudiante Y',
        role: 'student',
        institution: 'Universidad',
      };
      (authService as unknown as { _currentUser: { set: (u: User | null) => void } })._currentUser.set(
        mockStudent
      );

      const guardFn = roleGuard('professor');
      const result = TestBed.runInInjectionContext(() => guardFn({} as any, {} as any));
      expect(result).toEqual(router.createUrlTree(['/estudiante/dashboard']));
    });
  });
});
