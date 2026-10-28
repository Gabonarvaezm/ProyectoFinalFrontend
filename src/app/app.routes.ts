import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pagina-principal/pagina-principal').then((m) => m.PaginaPrincipal),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: 'profesor',
    loadComponent: () => import('./profesor/profesor').then((m) => m.Profesor),
  },
  {
    path: 'estudiante',
    loadComponent: () => import('./estudiante/estudiante').then((m) => m.Estudiante),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
