import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionComponent } from './configuracion';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { User } from '../core/models/auth.model';
import {
  ConfiguracionAparienciaComponent,
  ConfiguracionCuentaComponent,
  ConfiguracionHeaderComponent,
  ConfiguracionIaComponent,
  ConfiguracionLogoutModalComponent,
  ConfiguracionNotificacionesComponent,
  ConfiguracionTabsComponent,
} from './components';

describe('ConfiguracionComponent (Smart/Dumb Pattern & Signals)', () => {
  let component: ConfiguracionComponent;
  let fixture: ComponentFixture<ConfiguracionComponent>;
  let themeService: ThemeService;
  let authService: AuthService;

  const mockUser: User = {
    id: 'usr-test-123',
    email: 'estudiante.test@disceria.edu',
    fullName: 'Alejandro Morales',
    role: 'student',
    institution: 'Universidad Tecnológica Nacional',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConfiguracionComponent,
        ConfiguracionHeaderComponent,
        ConfiguracionTabsComponent,
        ConfiguracionCuentaComponent,
        ConfiguracionAparienciaComponent,
        ConfiguracionIaComponent,
        ConfiguracionNotificacionesComponent,
        ConfiguracionLogoutModalComponent,
      ],
      providers: [ThemeService, AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    authService = TestBed.inject(AuthService);

    fixture.componentRef.setInput('user', mockUser);
    fixture.detectChanges();
  });

  describe('Componente Padre: ConfiguracionComponent (Smart Orchestrator)', () => {
    it('debe crearse correctamente e inicializar el usuario efectivo y la pestaña de cuenta', () => {
      expect(component).toBeTruthy();
      expect(component.effectiveUser().fullName).toBe('Alejandro Morales');
      expect(component.effectiveUser().email).toBe('estudiante.test@disceria.edu');
      expect(component.activeSection()).toBe('cuenta');
    });

    it('debe calcular las iniciales de usuario correctamente', () => {
      expect(component.userInitials()).toBe('AM');
    });

    it('debe permitir cambiar de pestaña de configuración con selectSection()', () => {
      component.selectSection('apariencia');
      expect(component.activeSection()).toBe('apariencia');

      component.selectSection('ia');
      expect(component.activeSection()).toBe('ia');

      component.selectSection('notificaciones');
      expect(component.activeSection()).toBe('notificaciones');
    });

    it('debe cambiar y alternar el tema visual mediante ThemeService y emitir themeChanged', () => {
      const themeSpy = vi.fn();
      component.themeChanged.subscribe(themeSpy);

      component.selectTheme('dark');
      expect(themeService.currentTheme()).toBe('dark');
      expect(themeSpy).toHaveBeenCalledWith('dark');

      component.toggleTheme();
      expect(themeService.currentTheme()).toBe('light');
      expect(themeSpy).toHaveBeenCalledWith('light');
    });

    it('debe controlar el flujo de confirmación de cierre de sesión', () => {
      const logoutSpy = vi.fn();
      component.logoutRequested.subscribe(logoutSpy);

      expect(component.isLogoutConfirmOpen()).toBe(false);

      component.promptLogout();
      expect(component.isLogoutConfirmOpen()).toBe(true);

      component.cancelLogout();
      expect(component.isLogoutConfirmOpen()).toBe(false);
      expect(logoutSpy).not.toHaveBeenCalled();

      component.promptLogout();
      component.confirmLogout();
      expect(component.isLogoutConfirmOpen()).toBe(false);
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('debe emitir preferencesSaved con los datos del formulario reactivo al guardar', () => {
      const saveSpy = vi.fn();
      component.preferencesSaved.subscribe(saveSpy);

      component.preferencesForm.patchValue({
        aiTone: 'socratic',
        fontSize: 'lg',
        reduceMotion: true,
      });

      component.savePreferences();

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          aiTone: 'socratic',
          fontSize: 'lg',
          reduceMotion: true,
        })
      );
    });
  });

  describe('Componente Hijo Auxiliar: ConfiguracionTabsComponent', () => {
    it('debe emitir sectionSelected al seleccionar una pestaña', () => {
      const tabsFixture = TestBed.createComponent(ConfiguracionTabsComponent);
      const tabsComponent = tabsFixture.componentInstance;
      tabsFixture.componentRef.setInput('sections', component.sections);
      tabsFixture.componentRef.setInput('activeSection', 'cuenta');
      tabsFixture.detectChanges();

      const selectSpy = vi.fn();
      tabsComponent.sectionSelected.subscribe(selectSpy);

      tabsComponent.onSelectSection('apariencia');
      expect(selectSpy).toHaveBeenCalledWith('apariencia');
    });
  });

  describe('Componente Hijo Auxiliar: ConfiguracionLogoutModalComponent', () => {
    it('debe emitir confirmed y cancelled según la acción del usuario', () => {
      const modalFixture = TestBed.createComponent(ConfiguracionLogoutModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalFixture.componentRef.setInput('isOpen', true);
      modalFixture.detectChanges();

      const confirmSpy = vi.fn();
      const cancelSpy = vi.fn();
      modalComponent.confirmed.subscribe(confirmSpy);
      modalComponent.cancelled.subscribe(cancelSpy);

      modalComponent.onConfirm();
      expect(confirmSpy).toHaveBeenCalled();

      modalComponent.onCancel();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
