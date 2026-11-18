import { Component, computed, input, signal } from '@angular/core';
import { Tarea } from '../models/tarea.model';

@Component({
  selector: 'app-academic-progress',
  template: `
    <section aria-labelledby="academic-progress-title">
      <h2 id="academic-progress-title">Seguimiento académico</h2>
      <div class="filters">
        <label>Estudiante <input type="search" [value]="student()" (input)="student.set(value($event))" placeholder="Nombre o correo" /></label>
        <label>Asignatura <select (change)="subject.set(value($event))"><option value="">Todas</option>@for (name of subjects(); track name) { <option [value]="name">{{ name }}</option> }</select></label>
        <label>Asignadas desde <input type="date" (input)="from.set(value($event))" /></label>
        <label>Asignadas hasta <input type="date" (input)="to.set(value($event))" /></label>
      </div>
      <p>Asignaciones: {{ rows().length }} · Entregadas: {{ delivered().length }} · Pendientes: {{ pending() }} · Vencidas: {{ overdue() }}</p>
      <p>Cumplimiento: {{ completion() }} · Promedio normalizado: {{ average() }}</p>
      <p>El desarrollo se muestra mediante estados y avances guardados. Las notas se normalizan sobre 100 para comparar escalas.</p>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Historial académico desplazable"><table>
        <caption>Historial, evolución y últimas actividades por estudiante (más recientes primero)</caption>
        <thead><tr><th>Estudiante</th><th>Tarea / asignatura</th><th>Estado</th><th>Nota</th><th>Última actividad</th><th>Atención</th></tr></thead>
        <tbody>@for (row of rows(); track row.key) {
          <tr><td>{{ row.name }}</td><td>{{ row.task.title }} / {{ row.task.subject }}</td><td>{{ row.status.replaceAll('_', ' ') }}</td>
          <td>{{ row.submission?.grade !== undefined ? row.submission!.grade + ' / ' + row.task.maxScore : 'Sin calificar' }}</td>
          <td>{{ row.submission?.gradedAt || row.submission?.updatedAt || row.submission?.submittedAt || 'Sin actividad guardada' }}</td>
          <td>{{ row.status === 'vencida' || row.status === 'requiere_correccion' || (row.submission?.grade !== undefined && row.submission!.grade! / row.task.maxScore < 0.5) ? 'Requiere atención' : '—' }}</td></tr>
        } @empty { <tr><td colspan="6">Sin asignaciones para estos filtros.</td></tr> }</tbody>
      </table></div>
    </section>
  `,
  styles: [`
    section { margin-block: 1rem; padding: 1rem; border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-bg-surface); color: var(--color-text-main); }
    .filters { display:flex; flex-wrap:wrap; gap:1rem; } label { display:grid; gap:.3rem; }
    input, select { padding:.5rem; max-width:100%; color:var(--color-text-main); background:var(--color-bg-surface); border:1px solid var(--color-border); border-radius:.5rem; }
    .table-scroll { overflow-x:auto; } table { width:100%; border-collapse:collapse; text-align:left; } th, td { padding:.65rem; border-bottom:1px solid var(--color-border); } caption { text-align:left; padding-block:.75rem; }
  `],
})
export class AcademicProgressComponent {
  value(event: Event): string { return (event.target as HTMLInputElement | HTMLSelectElement).value; }
  readonly tareas = input.required<Tarea[]>();
  readonly professor = input(false);
  readonly student = signal('');
  readonly subject = signal('');
  readonly from = signal('');
  readonly to = signal('');
  readonly subjects = computed(() => [...new Set(this.tareas().map((task) => task.subject))]);
  readonly rows = computed(() => this.tareas().filter((task) => (!this.subject() || task.subject === this.subject()) && (!this.from() || task.assignedDate >= this.from()) && (!this.to() || task.assignedDate <= this.to()))
    .flatMap((task) => (this.professor() ? task.recipients ?? [] : [{ studentId: 'self', studentName: 'Mi progreso', email: '', status: task.status, submission: task.mySubmission }])
      .map((recipient) => ({ key: task.id + recipient.studentId, task, name: recipient.studentName, email: recipient.email, status: recipient.status, submission: recipient.submission })))
    .filter((row) => (row.name + ' ' + row.email).toLowerCase().includes(this.student().toLowerCase()))
    .sort((a, b) => (b.submission?.gradedAt ?? b.submission?.updatedAt ?? b.submission?.submittedAt ?? '').localeCompare(a.submission?.gradedAt ?? a.submission?.updatedAt ?? a.submission?.submittedAt ?? '')));
  readonly delivered = computed(() => this.rows().filter((row) => ['entregada', 'en_revision', 'calificada'].includes(row.status)));
  readonly overdue = computed(() => this.rows().filter((row) => row.status === 'vencida').length);
  readonly pending = computed(() => this.rows().length - this.delivered().length - this.overdue());
  readonly completion = computed(() => this.rows().length ? (100 * this.delivered().length / this.rows().length).toFixed(1) + '%' : 'Sin datos');
  readonly average = computed(() => {
    const grades = this.rows().filter((row) => row.submission?.grade !== undefined);
    return grades.length ? (grades.reduce((total, row) => total + row.submission!.grade! / row.task.maxScore * 100, 0) / grades.length).toFixed(1) + ' / 100' : 'Sin calificaciones';
  });
}
