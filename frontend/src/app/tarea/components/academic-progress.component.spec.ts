import { TestBed } from '@angular/core/testing';
import { AcademicProgressComponent } from './academic-progress.component';
import { Tarea } from '../models/tarea.model';

describe('Seguimiento real', () => {
  it('separa desarrollo y cumplimiento, normaliza escalas y filtra por estudiante', () => {
    const fixture = TestBed.createComponent(AcademicProgressComponent);
    const task: Tarea = { id: 'task', title: 'Experimento', description: 'Informe', subject: 'Ciencias',
      dueDate: '2099-01-01', assignedDate: '2026-11-18', assignedBy: 'Docente', priority: 'media', maxScore: 20, status: 'pendiente', submissionsCount: 1,
      recipients: [
        { studentId: 'ana', studentName: 'Ana', email: 'ana@test.edu', status: 'en_progreso' },
        { studentId: 'luis', studentName: 'Luis', email: 'luis@test.edu', status: 'calificada', submission: { id: 'sub', tareaId: 'task', studentId: 'luis', studentName: 'Luis', content: 'Respuesta', submittedAt: '2026-11-18', grade: 16 } },
      ] };
    fixture.componentRef.setInput('professor', true);
    fixture.componentRef.setInput('tareas', [task]);
    const component = fixture.componentInstance;
    expect(component.rows().length).toBe(2);
    expect(component.completion()).toBe('50.0%');
    expect(component.average()).toBe('80.0 / 100');
    expect(component.pending()).toBe(1);
    component.student.set('Ana');
    expect(component.completion()).toBe('0.0%');
    expect(component.average()).toBe('Sin calificaciones');
    component.subject.set('Historia');
    expect(component.completion()).toBe('Sin datos');
  });
});
