import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Estudiante } from './estudiante';
import { AuthService } from '../core/services/auth.service';

describe('Estudiante', () => {
  let component: Estudiante;
  let fixture: ComponentFixture<Estudiante>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Estudiante],
      providers: [provideRouter([])],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Estudiante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializarse con el dashboard activo y el nombre del estudiante', () => {
    expect(component.activeNav()).toBe('dashboard');
    expect(component.studentName()).toBe('Alejandro');
    expect(component.navItems().length).toBe(5);
    expect(component.navItems().some((item) => item.id === 'asistente-ia')).toBe(false);
  });

  it('debe abrir y cerrar el drawer del asistente IA correctamente', () => {
    expect(component.isAiDrawerOpen()).toBe(false);
    component.toggleAiDrawer();
    expect(component.isAiDrawerOpen()).toBe(true);
    component.closeAiDrawer();
    expect(component.isAiDrawerOpen()).toBe(false);
    component.openAiDrawer();
    expect(component.isAiDrawerOpen()).toBe(true);
  });

  it('debe cambiar de navegación lateral con selectNav', () => {
    component.selectNav('biblioteca');
    expect(component.activeNav()).toBe('biblioteca');
    expect(component.toastMessage()).toContain('biblioteca');
  });

  it('debe mostrar mensaje contextual con nombre e institución al seleccionar perfil', () => {
    component.selectNav('perfil');
    expect(component.activeNav()).toBe('perfil');
    expect(component.toastMessage()).toContain('Perfil de Alejandro');
  });

  it('debe calcular dinámicamente las iniciales del estudiante (userInitials)', () => {
    expect(component.userInitials()).toBe('AL');

    component.studentName.set('Camila Torres');
    expect(component.userInitials()).toBe('CT');

    component.studentName.set('Juan');
    expect(component.userInitials()).toBe('JU');
  });

  it('debe permitir cerrar sesión con onLogout y redirigir a /login', async () => {
    vi.useFakeTimers();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const logoutSpy = vi.spyOn(authService, 'logout');

    component.onLogout();
    expect(logoutSpy).toHaveBeenCalled();
    expect(component.toastMessage()).toContain('Cerrando sesión');

    vi.advanceTimersByTime(850);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);

    vi.useRealTimers();
  });

  it('debe filtrar materias de la biblioteca digital según searchQuery', () => {
    expect(component.filteredSubjects().length).toBe(4);

    component.searchQuery.set('matemáticas');
    expect(component.filteredSubjects().length).toBe(1);
    expect(component.filteredSubjects()[0].name).toBe('Matemáticas');

    component.searchQuery.set('no-existe');
    expect(component.filteredSubjects().length).toBe(0);
  });

  it('debe permitir continuar el curso activo, emitir toast y redirigir a /foro', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onContinueCourse();

    expect(component.toastMessage()).toContain('Biología Celular');
    expect(component.toastMessage()).toContain('foro');
    expect(navigateSpy).toHaveBeenCalledWith(['/foro']);
  });

  it('debe alternar, abrir y cerrar el panel de notificaciones académicas', () => {
    expect(component.isNotificationsDrawerOpen()).toBe(false);

    component.onNotificationsClick();
    expect(component.isNotificationsDrawerOpen()).toBe(true);

    component.closeNotificationsDrawer();
    expect(component.isNotificationsDrawerOpen()).toBe(false);

    component.openNotificationsDrawer();
    expect(component.isNotificationsDrawerOpen()).toBe(true);
  });

  it('debe gestionar las notificaciones: marcar leídas, alternar y eliminar', () => {
    expect(component.notifications().length).toBe(4);
    expect(component.unreadNotificationsCount()).toBe(2);

    // Marcar como leída
    component.onMarkNotificationAsRead('notif-1');
    expect(component.notifications().find((n) => n.id === 'notif-1')?.read).toBe(true);

    // Alternar lectura
    component.onToggleNotificationRead('notif-1');
    expect(component.notifications().find((n) => n.id === 'notif-1')?.read).toBe(false);

    // Marcar todas
    component.onMarkAllNotificationsAsRead();
    expect(component.unreadNotificationsCount()).toBe(0);

    // Eliminar
    component.onDeleteNotification('notif-1');
    expect(component.notifications().length).toBe(3);
    expect(component.toastMessage()).toContain('eliminada');
  });

  it('debe redirigir al foro al seleccionar una notificación con actionRoute', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const targetNotif = component.notifications()[0]; // actionRoute: '/foro'
    component.openNotificationsDrawer();
    component.onNotificationSelected(targetNotif);

    expect(navigateSpy).toHaveBeenCalledWith(['/foro']);
    expect(component.isNotificationsDrawerOpen()).toBe(false);
  });

  it('debe permitir iniciar el examen de práctica', () => {
    component.onStartExam();
    expect(component.toastMessage()).toContain('Examen de Práctica');
  });

  it('debe permitir enviar mensajes al Asistente de IA y recibir respuesta simulada', async () => {
    vi.useFakeTimers();

    component.aiInputText.set('¿Qué es la mitosis?');
    component.submitAiMessage();

    expect(component.chatMessages().length).toBe(3); // 2 iniciales + 1 usuario
    expect(component.isAiThinking()).toBe(true);

    vi.advanceTimersByTime(700);

    expect(component.isAiThinking()).toBe(false);
    expect(component.chatMessages().length).toBe(4); // + 1 respuesta IA
    expect(component.chatMessages()[3].sender).toBe('ai');

    vi.useRealTimers();
  });

  it('debe ejecutar acciones rápidas del asistente IA', () => {
    vi.useFakeTimers();

    const action = component.quickActions()[0]; // 'summary'
    component.onQuickAction(action);

    expect(component.chatMessages().length).toBe(3);
    vi.advanceTimersByTime(700);
    expect(component.chatMessages()[3].text).toContain('Resumen de Mitosis');

    vi.useRealTimers();
  });

  it('debe manejar fallback de avatar si ocurre un error de carga', () => {
    expect(component.isAvatarBroken('q1')).toBe(false);
    component.onAvatarError('q1');
    expect(component.isAvatarBroken('q1')).toBe(true);
  });

  it('debe navegar al catálogo de biblioteca y pasar la categoría al seleccionar una materia', () => {
    const matSubject = component.subjects()[0]; // id: 'mat', name: 'Matemáticas'
    component.onSelectSubject(matSubject);

    expect(component.activeNav()).toBe('biblioteca');
    expect(component.selectedSubjectCategory()).toBe('matematicas');
    expect(component.toastMessage()).toContain('Matemáticas');
  });

  it('debe limpiar la categoría seleccionada al pulsar Ver todo en la biblioteca', () => {
    component.selectedSubjectCategory.set('ciencias');
    component.onViewAllLibrary();

    expect(component.activeNav()).toBe('biblioteca');
    expect(component.selectedSubjectCategory()).toBeNull();
  });
});
