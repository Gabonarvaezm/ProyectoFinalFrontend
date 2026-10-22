import { Routes } from '@angular/router';
import { Login } from './login/login';
import { PaginaPrincipal } from './pagina-principal/pagina-principal';



export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        loadComponent: () => import('./register/register').then((m) => m.Register),
    },
    {
        path: '',
        component: PaginaPrincipal
    }
];

