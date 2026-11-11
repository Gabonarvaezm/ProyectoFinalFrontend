import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AUTH_ROUTES } from '../constants/auth.constants';

/**
 * Functional Guard que valida que el usuario autenticado posea el rol específico requerido
 * para acceder a una ruta protegida ('student' | 'professor' | 'admin').
 *
 * @param allowedRole Rol o roles autorizados
 */
export const roleGuard = (allowedRole: 'student' | 'professor' | 'admin'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUser();

    if (!currentUser) {
      return router.createUrlTree([AUTH_ROUTES.LOGIN]);
    }

    if (currentUser.role === allowedRole || currentUser.role === 'admin') {
      return true;
    }

    // Redirigir al dashboard correspondiente a su rol si intenta acceder a otra vista
    if (currentUser.role === 'professor') {
      return router.createUrlTree([AUTH_ROUTES.PROFESSOR_DASHBOARD]);
    }

    return router.createUrlTree([AUTH_ROUTES.STUDENT_DASHBOARD]);
  };
};

