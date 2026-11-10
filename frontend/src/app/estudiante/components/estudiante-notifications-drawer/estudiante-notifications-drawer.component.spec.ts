import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstudianteNotificationsDrawerComponent } from './estudiante-notifications-drawer.component';
import { StudentNotification } from '../../models/estudiante.model';

describe('EstudianteNotificationsDrawerComponent', () => {
  let component: EstudianteNotificationsDrawerComponent;
  let fixture: ComponentFixture<EstudianteNotificationsDrawerComponent>;

  const mockNotifications: StudentNotification[] = [
    {
      id: 'notif-1',
      type: 'task',
      title: 'Tarea Asignada: Mitosis',
      message: 'Completa la actividad de biología celular.',
      authorName: 'Prof. Carlos García',
      authorRole: 'professor',
      authorInitials: 'CG',
      timeAgo: 'Hace 30 min',
      read: false,
      subject: 'Ciencias',
      actionRoute: '/foro',
    },
    {
      id: 'notif-2',
      type: 'forum_reply',
      title: 'Respuesta en foro de Integrales',
      message: 'El Prof. Martínez respondió tu consulta.',
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
      title: 'Aviso sobre Examen',
      message: 'Recordatorio del examen parcial de Ciencias.',
      authorName: 'Prof. Laura Gómez',
      authorRole: 'professor',
      authorInitials: 'LG',
      timeAgo: 'Ayer',
      read: true,
      subject: 'Ciencias',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudianteNotificationsDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EstudianteNotificationsDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('notifications', mockNotifications);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular métricas derivadas de no leídas, tareas y foros', () => {
    expect(component.unreadCount()).toBe(2);
    expect(component.tasksCount()).toBe(1);
    expect(component.forumsCount()).toBe(1);
  });

  it('debe filtrar notificaciones según el filtro activo', () => {
    expect(component.filteredNotifications().length).toBe(3);

    component.setFilter('unread');
    expect(component.filteredNotifications().length).toBe(2);

    component.setFilter('tasks');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].type).toBe('task');

    component.setFilter('forums');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].type).toBe('forum_reply');

    component.setFilter('all');
    expect(component.filteredNotifications().length).toBe(3);
  });

  it('debe emitir closeRequested al cerrar', () => {
    const spy = vi.spyOn(component.closeRequested, 'emit');
    component.onClose();
    expect(spy).toHaveBeenCalled();
  });

  it('debe emitir markAllAsRead al marcar todas', () => {
    const spy = vi.spyOn(component.markAllAsRead, 'emit');
    component.onMarkAllAsRead();
    expect(spy).toHaveBeenCalled();
  });

  it('debe emitir toggleRead al cambiar estado de lectura', () => {
    const spy = vi.spyOn(component.toggleRead, 'emit');
    const mockEvent = new MouseEvent('click');
    component.onToggleRead(mockNotifications[0], mockEvent);
    expect(spy).toHaveBeenCalledWith('notif-1');
  });

  it('debe emitir deleteNotification al eliminar', () => {
    const spy = vi.spyOn(component.deleteNotification, 'emit');
    const mockEvent = new MouseEvent('click');
    component.onDelete('notif-1', mockEvent);
    expect(spy).toHaveBeenCalledWith('notif-1');
  });

  it('debe emitir markAsRead si estaba no leída y emitir notificationSelected al hacer clic en el item', () => {
    const markSpy = vi.spyOn(component.markAsRead, 'emit');
    const selectSpy = vi.spyOn(component.notificationSelected, 'emit');

    component.onNotificationItemClick(mockNotifications[0]);
    expect(markSpy).toHaveBeenCalledWith('notif-1');
    expect(selectSpy).toHaveBeenCalledWith(mockNotifications[0]);
  });
});

