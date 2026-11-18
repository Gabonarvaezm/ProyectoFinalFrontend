import { Component, ElementRef, input, viewChildren } from '@angular/core';
import { PublishedExam, PublishedMessage } from '../../../core/models/academic.model';

@Component({
  selector: 'app-estudiante-publications',
  templateUrl: './estudiante-publications.component.html',
  styleUrl: './estudiante-publications.component.scss',
})
export class EstudiantePublicationsComponent {
  private readonly details = viewChildren<ElementRef<HTMLDetailsElement>>('examDetails');
  readonly exams = input.required<readonly PublishedExam[]>();
  readonly messages = input.required<readonly PublishedMessage[]>();

  openExam(id: string): void {
    const element = this.details()
      .map((ref) => ref.nativeElement)
      .find((detail) => detail.dataset['examId'] === id);
    if (!element) return;
    element.open = true;
    element.scrollIntoView?.({ block: 'nearest' });
    element.querySelector('summary')?.focus();
  }
}
