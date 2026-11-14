import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { STORAGE_KEYS, User } from './core/models/auth.model';
import { Foro } from './foro/foro';

@Component({ template: '<h1>Dashboard</h1>' })
class DashboardTestComponent {}

describe('Regreso al dashboard desde las secciones compartidas', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter(routes.map((route) =>
          route.path === 'profesor' || route.path === 'estudiante'
            ? { path: route.path, component: DashboardTestComponent }
            : route
        )),
      ],
    });
  });

  afterEach(() => localStorage.clear());

  const roles: User['role'][] = ['professor', 'student'];
  const links = [
    { section: '/foro', selector: '.sidebar-nav .nav-btn' },
    { section: '/chatbot', selector: '.sidebar-bottom .nav-back-link' },
    { section: '/chatbot', selector: '.header-actions a' },
  ];

  for (const role of roles) {
    for (const { section, selector } of links) {
      it(`debe regresar al dashboard de ${role} desde ${section} (${selector})`, async () => {
        const user: User = {
          id: 'navigation-user',
          email: 'usuario@universidad.edu',
          fullName: 'Usuario de prueba',
          role,
        };
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(user));

        const dashboard = role === 'professor' ? '/profesor' : '/estudiante';
        const harness = await RouterTestingHarness.create(dashboard);
        await harness.navigateByUrl(section);

        // La perspectiva y las acciones del foro deben respetar la sesión.
        if (section === '/foro') {
          const foro = harness.routeDebugElement?.componentInstance as Foro;
          expect(foro.currentRole()).toBe(role);
          expect(foro.currentUser().role).toBe(role);
          expect(foro.currentUser().name).toBe(user.fullName);

          const profile = harness.routeNativeElement?.querySelector<HTMLElement>('.user-profile-badge');
          profile?.click();
          harness.routeNativeElement?.querySelector<HTMLElement>('.role-badge')?.click();
          harness.detectChanges();

          expect(foro.currentRole()).toBe(role);
          expect(harness.routeNativeElement?.querySelector('.role-badge-btn')).toBeNull();
          const verification = harness.routeNativeElement?.querySelector(
            'input[formControlName="markAsTeacherVerified"]'
          );
          if (role === 'professor') {
            expect(verification).not.toBeNull();
          } else {
            expect(verification).toBeNull();
            expect(harness.routeNativeElement?.querySelector('.role-badge')).toBeNull();
          }
        }

        const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(selector);
        expect(link?.getAttribute('href')).toBe(dashboard);
        if (selector === '.header-actions a') {
          expect(link?.textContent).toContain(
            role === 'professor' ? 'Portal Profesor' : 'Portal Estudiante'
          );
        }

        link!.click();
        await harness.fixture.whenStable();

        expect(TestBed.inject(Router).url).toBe(dashboard);
        expect(harness.routeNativeElement?.textContent).toContain('Dashboard');
      });
    }
  }
});
