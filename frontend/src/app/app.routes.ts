import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pagina-principal/pagina-principal').then((m) => m.PaginaPrincipal),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: 'profesor/dashboard',
    redirectTo: 'profesor',
    pathMatch: 'full',
  },
  {
    path: 'profesor',
    canActivate: [roleGuard('professor')],
    loadComponent: () => import('./profesor/profesor').then((m) => m.Profesor),
  },
  {
    path: 'estudiante/dashboard',
    redirectTo: 'estudiante',
    pathMatch: 'full',
  },
  {
    path: 'estudiante',
    canActivate: [roleGuard('student')],
    loadComponent: () => import('./estudiante/estudiante').then((m) => m.Estudiante),
  },
  {
    path: 'biblioteca',
    canActivate: [authGuard],
    loadComponent: () => import('./biblioteca/biblioteca').then((m) => m.Biblioteca),
  },
  {
    path: 'tareas',
    canActivate: [authGuard],
    loadComponent: () => import('./tarea/tarea').then((m) => m.Tarea),
  },
  {
    path: 'foro',
    canActivate: [authGuard],
    loadComponent: () => import('./foro/foro').then((m) => m.Foro),
  },
  {
    path: 'chatbot',
    canActivate: [authGuard],
    loadComponent: () => import('./chatbot/chatbot').then((m) => m.Chatbot),
  },
  {
    path: 'configuracion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./configuracion/configuracion').then((m) => m.ConfiguracionComponent),
  },
  {
    path: 'asistente-ia',
    redirectTo: 'chatbot',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
