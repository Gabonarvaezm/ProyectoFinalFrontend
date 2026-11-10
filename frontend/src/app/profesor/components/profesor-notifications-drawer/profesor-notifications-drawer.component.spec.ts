import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfesorNotificationsDrawerComponent } from './profesor-notifications-drawer.component';
import { TeacherNotification } from '../../models/profesor.model';

describe('ProfesorNotificationsDrawerComponent', () => {
  let component: ProfesorNotificationsDrawerComponent;
  let fixture: ComponentFixture<ProfesorNotificationsDrawerComponent>;

  const mockNotifications: TeacherNotification[] = [
    {
      id: 'notif-1',
      type: 'student_reply',
      title: 'Respuesta en Foro',
      message: 'Estudiante respondió a duda.',
      timeAgo: 'Hace 5 min',
      timestamp: '2026-11-09T17:00:00.000Z',
      read: false,
      authorName: 'Carlos Pérez',
      authorRole: 'student',
      authorInitials: 'CP',
      category: 'Biología Celular',
    },
    {
      id: 'notif-2',
      type: 'teacher_post',
      title: 'Nuevo Recurso',
      message: 'Docente publicó libro.',
      timeAgo: 'Hace 30 min',
      timestamp: '2026-11-09T16:30:00.000Z',
      read: true,
      authorName: 'Prof. Arturo Sotomayor',
      authorRole: 'professor',
      authorInitials: 'AS',
      category: 'Matemáticas',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesorNotificationsDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorNotificationsDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('notifications', mockNotifications);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular correctamente los conteos de no leídas, estudiantes y docentes', () => {
    expect(component.unreadCount()).toBe(1);
    expect(component.studentsCount()).toBe(1);
    expect(component.teachersCount()).toBe(1);
    expect(component.filteredNotifications().length).toBe(2);
  });

  it('debe filtrar notificaciones por estado no leído', () => {
    component.setFilter('unread');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].id).toBe('notif-1');
  });

  it('debe filtrar notificaciones de estudiantes', () => {
    component.setFilter('students');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].authorRole).toBe('student');
  });

  it('debe filtrar notificaciones de colegas profesores', () => {
    component.setFilter('teachers');
    expect(component.filteredNotifications().length).toBe(1);
    expect(component.filteredNotifications()[0].authorRole).toBe('professor');
  });

  it('debe emitir closeRequested al llamar onClose()', () => {
    let closed = false;
    component.closeRequested.subscribe(() => {
      closed = true;
    });

    component.onClose();
    expect(closed).toBe(true);
  });

  it('debe emitir markAllAsRead al invocar onMarkAllAsRead() si hay no leídas', () => {
    let markedAll = false;
    component.markAllAsRead.subscribe(() => {
      markedAll = true;
    });

    component.onMarkAllAsRead();
    expect(markedAll).toBe(true);
  });

  it('debe emitir markAsRead y notificationSelected al hacer clic en una no leída', () => {
    let markedId = '';
    let selectedNotif: TeacherNotification | null = null;

    component.markAsRead.subscribe((id) => {
      markedId = id;
    });
    component.notificationSelected.subscribe((item) => {
      selectedNotif = item;
    });

    const unreadItem = mockNotifications[0];
    component.onNotificationItemClick(unreadItem);

    expect(markedId).toBe('notif-1');
    expect(selectedNotif).toBe(unreadItem);
  });

  it('debe emitir deleteNotification al invocar onDelete()', () => {
    let deletedId = '';
    component.deleteNotification.subscribe((id) => {
      deletedId = id;
    });

    const dummyEvent = new MouseEvent('click');
    component.onDelete('notif-1', dummyEvent);

    expect(deletedId).toBe('notif-1');
  });
});

