import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AUTH_ROUTES } from '../constants/auth.constants';

/**
 * Functional Guard que asegura que sólo usuarios autenticados ingresen a rutas protegidas.
 * Si el usuario no ha iniciado sesión, es redirigido a la vista de login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([AUTH_ROUTES.LOGIN]);
};

