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
});
