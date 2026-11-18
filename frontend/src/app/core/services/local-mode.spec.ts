import { PreferencesRepository } from './preferences.repository';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AcademicSyncService } from './academic-sync.service';
import { ACADEMIC_MODE } from './academic-mode';

describe('Modo local sin peticiones académicas', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: ACADEMIC_MODE, useValue: 'local' }] });
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); localStorage.clear(); });
  it('registra, inicia, publica, refresca y cierra sesión sin utilizar HTTP', async () => {
    const auth = TestBed.inject(AuthService);
    const sync = TestBed.inject(AcademicSyncService);
    TestBed.runInInjectionContext(() => sync.start());
    await firstValueFrom(auth.register({ email: 'nueva@demo.edu', fullName: 'Nueva Estudiante', institution: 'Universidad Tecnológica Nacional', role: 'student', password: 'no-debe-almacenarse' }));
    await firstValueFrom(auth.login({ email: 'profesor@universidad.edu', password: '' }));
    TestBed.tick();
    await sync.commit('tarea.publish', { id: 'local-task', title: 'Tarea local', description: 'Sin solicitudes HTTP', subject: 'Ciencias', dueDate: '2099-01-01', maxScore: 100 });
    await sync.refresh();
    expect(sync.snapshot()?.tareas).toHaveLength(1);
    auth.logout(); TestBed.tick();
    expect(sync.snapshot()).toBeNull();
    TestBed.inject(HttpTestingController).expectNone((request) => request.url.includes('/api/academic'));
    expect(JSON.stringify(localStorage)).not.toContain('no-debe-almacenarse');
  });
  it('persiste preferencias separadas por perfil', () => {
    const preferences = TestBed.inject(PreferencesRepository);
    const value = { theme: 'dark' as const, emailNotifications: false, forumReplyNotifications: true, examAlerts: true,
      weeklyAiSummary: false, aiTone: 'socratic' as const, aiAutoSuggestions: false, fontSize: 'lg' as const, reduceMotion: true };
    preferences.save('first', value);
    expect(preferences.read('first')).toEqual(value);
    expect(preferences.read('second')).toEqual({});
    preferences.save('second', { ...value, theme: 'light' });
    expect(preferences.read('first').theme).toBe('dark');
    expect(preferences.read('second').theme).toBe('light');
  });

});
