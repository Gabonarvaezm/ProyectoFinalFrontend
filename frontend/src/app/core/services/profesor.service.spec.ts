import { TestBed } from '@angular/core/testing';
import { ProfesorService } from './profesor.service';
import { CreateStudentDto } from '../../profesor/models/profesor.model';

describe('ProfesorService', () => {
  let service: ProfesorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfesorService);
  });

  it('debe crearse correctamente e inicializar estudiantes y métricas', () => {
    expect(service).toBeTruthy();
    expect(service.students().length).toBeGreaterThanOrEqual(3);
    expect(service.totalStudents()).toBe(service.students().length);
    expect(service.kpiMetrics().length).toBe(3);
  });

  it('debe registrar un nuevo estudiante y actualizar métricas y actividad', () => {
    const initialCount = service.totalStudents();

    const dto: CreateStudentDto = {
      studentName: 'Estudiante Prueba',
      email: 'prueba@universidad.edu',
      topic: 'Genética Molecular',
      score: 85,
      status: 'active',
    };

    const created = service.registerStudent(dto);

    expect(created.id).toBeDefined();
    expect(created.studentName).toBe('Estudiante Prueba');
    expect(service.totalStudents()).toBe(initialCount + 1);
    expect(service.recentActivities()[0].description).toContain('Estudiante Prueba');
  });

  it('debe actualizar el puntaje de un estudiante y ajustar su estado', () => {
    const student = service.students()[0];
    service.updateStudentScore(student.id, 100);

    const updated = service.students().find((s) => s.id === student.id);
    expect(updated?.score).toBe(100);
    expect(updated?.status).toBe('completed');
  });

  it('debe eliminar un estudiante y recalcular las métricas', () => {
    const student = service.students()[0];
    const initialCount = service.totalStudents();

    service.deleteStudent(student.id);
    expect(service.totalStudents()).toBe(initialCount - 1);
    expect(service.students().some((s) => s.id === student.id)).toBe(false);
  });

  // ── Pruebas de Notificaciones ────────────────────────────────────────────

  it('debe inicializar la lista de notificaciones y el conteo no leído', () => {
    expect(service.notifications().length).toBeGreaterThanOrEqual(4);
    expect(service.unreadNotificationsCount()).toBeGreaterThan(0);
  });

  it('debe marcar una notificación como leída con markNotificationAsRead', () => {
    const unread = service.notifications().find((n) => !n.read);
    expect(unread).toBeDefined();

    if (unread) {
      service.markNotificationAsRead(unread.id);
      const updated = service.notifications().find((n) => n.id === unread.id);
      expect(updated?.read).toBe(true);
    }
  });

  it('debe alternar el estado de lectura de una notificación', () => {
    const notif = service.notifications()[0];
    const initialStatus = notif.read;

    service.toggleNotificationRead(notif.id);
    expect(service.notifications().find((n) => n.id === notif.id)?.read).toBe(!initialStatus);

    service.toggleNotificationRead(notif.id);
    expect(service.notifications().find((n) => n.id === notif.id)?.read).toBe(initialStatus);
  });

  it('debe marcar todas las notificaciones como leídas', () => {
    service.markAllNotificationsAsRead();
    expect(service.unreadNotificationsCount()).toBe(0);
    expect(service.notifications().every((n) => n.read)).toBe(true);
  });

  it('debe eliminar una notificación de la lista', () => {
    const target = service.notifications()[0];
    const countBefore = service.notifications().length;

    service.deleteNotification(target.id);
    expect(service.notifications().length).toBe(countBefore - 1);
    expect(service.notifications().some((n) => n.id === target.id)).toBe(false);
  });

  it('debe agregar una nueva notificación a la lista', () => {
    const countBefore = service.notifications().length;

    const added = service.addNotification({
      type: 'student_reply',
      title: 'Nueva Duda',
      message: 'Un alumno hizo una pregunta.',
      timeAgo: 'Hace 1 min',
      read: false,
      authorName: 'Estudiante Test',
      authorRole: 'student',
      authorInitials: 'ET',
      category: 'General',
    });

    expect(added.id).toBeDefined();
    expect(service.notifications().length).toBe(countBefore + 1);
    expect(service.notifications()[0].title).toBe('Nueva Duda');
  });
});
