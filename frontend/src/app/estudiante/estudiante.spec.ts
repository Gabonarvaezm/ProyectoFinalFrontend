import { StudentNotification } from './models/estudiante.model';
import { AcademicSyncService } from '../core/services/academic-sync.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Estudiante } from './estudiante';
import { AuthService } from '../core/services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

const TEST_NOTIFICATIONS: StudentNotification[] = [
    {
      id: 'notif-1',
      type: 'task',
      title: 'Nueva Tarea Asignada: Biología Celular',
      message: 'El Prof. García asignó la actividad "Reporte de Mitosis y Meiosis" para completar en el foro.',
      authorName: 'Prof. García',
      authorRole: 'professor',
      authorInitials: 'PG',
      timeAgo: 'Hace 30 min',
      read: false,
      subject: 'Ciencias',
      actionRoute: '/foro',
    },
    {
      id: 'notif-2',
      type: 'forum_reply',
      title: 'Respuesta Docente en Foro',
      message: 'El Prof. Martínez respondió tu consulta sobre la regla LIATE en integración por partes.',
      authorName: 'Prof. Martínez',
      authorRole: 'professor',
      authorInitials: 'PM',
      timeAgo: 'Hace 2 horas',
      read: false,
      subject: 'Matemáticas',
      actionRoute: '/foro',
    },
    {
      id: 'notif-3',
      type: 'teacher_announcement',
      title: 'Nuevo Material en Biblioteca',
      message: 'La docente publicó un compendio de ejercicios clave para el próximo examen de Ciencias.',
      authorName: 'Prof. Laura Gómez',
      authorRole: 'professor',
      authorInitials: 'LG',
      timeAgo: 'Ayer',
      read: true,
      subject: 'Ciencias',
      actionRoute: '/biblioteca',
    },
    {
      id: 'notif-4',
      type: 'forum_reply',
      title: 'Intervención de compañero en Historia',
      message: 'Mateo Gómez aportó una síntesis sobre el impacto de la Revolución Industrial.',
      authorName: 'Mateo Gómez',
      authorRole: 'student',
      authorInitials: 'MG',
      timeAgo: 'Hace 5 horas',
      read: true,
      subject: 'Historia',
      actionRoute: '/foro',
    },
  ];

describe('Estudiante', () => {
  let component: Estudiante;
  let fixture: ComponentFixture<Estudiante>;
  let authService: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Estudiante],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Estudiante);
    component = fixture.componentInstance;
    component.notifications.set(TEST_NOTIFICATIONS.map((notice) => ({ ...notice })));
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra los exámenes y comunicados publicados que recibe del servidor', async () => {
    const sync = TestBed.inject(AcademicSyncService);
    sync.snapshot.set({
      books: [], posts: [], tareas: [], students: [], notifications: [],
      exams: [{ id: 'shared-exam', title: 'Examen publicado de historia', topic: 'Independencia', subject: 'Historia', questionsCount: 5, durationMinutes: 20, difficulty: 'Media', instructions: 'Repasa el capítulo tres.', authorName: 'Docente de historia', createdAt: new Date().toISOString() }],
      messages: [{ id: 'shared-message', subject: 'Material para mañana', message: 'Trae tu cuaderno de historia.', authorName: 'Docente de historia', createdAt: new Date().toISOString(), priority: 'normal', targetGroup: 'all', sendToForums: false }],
    });
    await fixture.whenStable();
    const publications: HTMLElement = fixture.nativeElement.querySelector('app-estudiante-publications');
    expect(publications.textContent).toContain('Examen publicado de historia');
    expect(publications.textContent).toContain('Trae tu cuaderno de historia.');
    expect(component.practiceExam().title).toBe('Examen publicado de historia');
  });

  it('debe inicializarse con el dashboard activo y el nombre del estudiante', () => {
    expect(component.activeNav()).toBe('dashboard');
    expect(component.studentName()).toBe('Alejandro');
    expect(component.navItems().length).toBe(3);
    expect(component.navItems().some((item) => item.id === 'configuracion')).toBe(false);
    expect(component.navItems().some((item) => item.id === 'progreso')).toBe(false);
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
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const targetNotif = component.notifications()[0]; // actionRoute: '/foro'
    component.openNotificationsDrawer();
    component.onNotificationSelected(targetNotif);

    expect(navigateSpy).toHaveBeenCalledWith('/foro');
    expect(component.isNotificationsDrawerOpen()).toBe(false);
  });

  it('debe permitir iniciar el examen de práctica', () => {
    component.onStartExam();
    expect(component.toastMessage()).toContain('Examen de Práctica');
  });

  it('debe enviar mensajes al Asistente de IA y mostrar la respuesta de la API', async () => {
    vi.useFakeTimers();

    component.aiInputText.set('¿Qué es la mitosis?');
    component.submitAiMessage();

    expect(component.chatMessages().length).toBe(2); // bienvenida + consulta
    expect(component.isAiThinking()).toBe(true);

    http.expectOne('/api/chat').flush({ text: 'La mitosis produce dos células hijas.' });

    expect(component.isAiThinking()).toBe(false);
    expect(component.chatMessages().length).toBe(3); // respuesta de la API
    expect(component.chatMessages()[2].sender).toBe('ai');

    vi.useRealTimers();
  });

  it('debe ejecutar acciones rápidas del asistente IA', () => {
    vi.useFakeTimers();

    component.aiInputText.set('fracciones de sexto grado');
    const action = component.quickActions()[0]; // 'summary'
    component.onQuickAction(action);

    expect(component.chatMessages().length).toBe(2);
    const request = http.expectOne('/api/chat');
    expect(request.request.body.query).toBe('Genera un resumen sobre fracciones de sexto grado');
    request.flush({ text: 'Las fracciones representan partes de una unidad.' });
    expect(component.chatMessages()[2].text).toContain('fracciones');

    vi.useRealTimers();
  });

  it('debe pedir el tema antes de crear un examen sin imponer una materia', () => {
    component.onQuickAction(component.quickActions()[1]);
    expect(component.aiInputText()).toBe('Crea un examen de práctica de 3 preguntas sobre ');
    expect(component.isAiThinking()).toBe(false);
    http.expectNone('/api/chat');
  });

  it('debe mostrar el motivo del fallo y permitir reenviar la consulta sin duplicarla', () => {
    const initialCount = component.chatMessages().length;
    component.sendAiMessage('Explica las fracciones');
    http.expectOne('/api/chat').flush({ error: 'La IA alcanzó su límite de solicitudes.' }, {
      status: 429, statusText: 'Too Many Requests',
    });
    expect(component.aiErrorMessage()).toContain('límite de solicitudes');
    expect(component.aiInputText()).toBe('Explica las fracciones');
    expect(component.isAiThinking()).toBe(false);
    expect(component.chatMessages()).toHaveLength(initialCount);

    component.submitAiMessage();
    const retry = http.expectOne('/api/chat');
    expect(retry.request.body.history.some((message: { content: string }) =>
      message.content === 'Explica las fracciones')).toBe(false);
    retry.flush({ text: 'Una fracción representa una parte del total.' });
    expect(component.aiErrorMessage()).toBeNull();
    expect(component.chatMessages()).toHaveLength(initialCount + 2);
  });

  for (const topic of ['fracciones de sexto grado', 'la independencia de Colombia', 'el presente simple en inglés']) {
    it(`debe enviar desde el formulario hijo una consulta sobre ${topic}`, async () => {
      component.openAiDrawer();
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      const input = element.querySelector<HTMLInputElement>('.ai-input-field')!;
      input.value = `Explica ${topic}`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      element.querySelector('.ai-input-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      const request = http.expectOne('/api/chat');
      expect(request.request.body.query).toBe(`Explica ${topic}`);
      request.flush({ text: `Explicación escolar sobre ${topic}.` });
      await fixture.whenStable();
      expect(element.querySelector('.ai-messages')?.textContent ?? element.textContent).toContain(`Explicación escolar sobre ${topic}.`);
      expect(component.isAiThinking()).toBe(false);
    });
  }

  it('debe manejar fallback de avatar si ocurre un error de carga', () => {
    expect(component.isAvatarBroken('q1')).toBe(false);
    component.onAvatarError('q1');
    expect(component.isAvatarBroken('q1')).toBe(true);
  });

  it('debe actualizar el progreso semanal y resaltar la materia al seleccionarla', () => {
    const matSubject = component.subjects()[0]; // id: 'mat', name: 'Matemáticas'
    component.onSelectSubject(matSubject);

    expect(component.highlightedSubjectId()).toBe('mat');
    expect(component.toastMessage()).toContain('Matemáticas');
  });

  it('debe limpiar la categoría seleccionada al pulsar Ver todo en la biblioteca', () => {
    component.selectedSubjectCategory.set('ciencias');
    component.onViewAllLibrary();

    expect(component.activeNav()).toBe('biblioteca');
    expect(component.selectedSubjectCategory()).toBeNull();
  });
});
