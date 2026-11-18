import { Component } from '@angular/core';
import { LoginPageComponent } from './login-page.component';

/**
 * Re-exportación y compatibilidad de arquitectura para Login
 * Mantiene compatibilidad con app.routes.ts y suites de tests existentes.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginPageComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login extends LoginPageComponent {}

export { LoginPageComponent };
