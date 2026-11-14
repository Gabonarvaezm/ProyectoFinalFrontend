import { Component, ElementRef, input, viewChildren } from '@angular/core';
import { PublishedExam, PublishedMessage } from '../../../core/models/academic.model';

@Component({
  selector: 'app-estudiante-publications',
  template: `
    @if (exams().length || messages().length) {
      <section aria-labelledby="teacher-publications-title">
        <h2 id="teacher-publications-title">Publicaciones de tus docentes</h2>
        @for (exam of exams(); track exam.id) {
          <details #examDetails [attr.data-exam-id]="exam.id">
            <summary><i class="bi bi-journal-check" aria-hidden="true"></i> {{ exam.title }} <span>Examen · {{ exam.subject }}</span></summary>
            <p>{{ exam.authorName }} · {{ exam.topic }}</p>
            <p>{{ exam.questionsCount }} preguntas · {{ exam.durationMinutes }} minutos · Dificultad {{ exam.difficulty }}</p>
            <p class="content">{{ exam.instructions || 'El docente aún no ha añadido instrucciones.' }}</p>
          </details>
        }
        @for (message of messages(); track message.id) {
          <details [class.urgent]="message.priority === 'urgent'">
            <summary><i class="bi bi-megaphone" aria-hidden="true"></i> {{ message.subject }} <span>{{ message.priority === 'urgent' ? 'Urgente' : 'Comunicado' }}</span></summary>
            <p>{{ message.authorName }}</p>
            <p class="content">{{ message.message }}</p>
          </details>
        }
      </section>
    }
  `,
  styles: `
    :host { display: block; margin-block: var(--space-6); }
    h2 { font-size: var(--font-size-lg); color: var(--color-text-main); }
    details { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-block: var(--space-3); padding: var(--space-4); }
    details.urgent { border-color: var(--color-warning); }
    summary { cursor: pointer; font-weight: var(--font-weight-semibold); color: var(--color-text-main); }
    summary:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 4px; }
    summary i { margin-inline-end: var(--space-2); color: var(--color-primary); }
    summary span { display: block; font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-block-start: var(--space-2); }
    p { color: var(--color-text-secondary); margin: var(--space-3) 0 0; }
    .content { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--color-text-main); }
  `,
})
export class EstudiantePublicationsComponent {
  private readonly details = viewChildren<ElementRef<HTMLDetailsElement>>('examDetails');
  readonly exams = input.required<readonly PublishedExam[]>();
  readonly messages = input.required<readonly PublishedMessage[]>();

  openExam(id: string): void {
    const element = this.details().map((ref) => ref.nativeElement).find((detail) => detail.dataset['examId'] === id);
    if (!element) return;
    element.open = true;
    element.scrollIntoView?.({ block: 'nearest' });
    element.querySelector('summary')?.focus();
  }
}
