import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GradeTareaDto, Tarea } from '../../models/tarea.model';

@Component({
  selector: 'app-tarea-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarea-detail-modal.component.html',
  styleUrl: './tarea-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareaDetailModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly tarea = input<Tarea | null>(null);
  public readonly isProfessor = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly deliverClicked = output<Tarea>();
  public readonly gradeSubmitted = output<GradeTareaDto>();

  public readonly gradeForm: FormGroup = this.fb.group({
    grade: [95, [Validators.required, Validators.min(0), Validators.max(100)]],
    feedback: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      const currentTarea = this.tarea();
      if (currentTarea?.mySubmission?.grade !== undefined) {
        this.gradeForm.patchValue({
          grade: currentTarea.mySubmission.grade,
          feedback: currentTarea.mySubmission.feedback || '',
        });
      } else {
        this.gradeForm.reset({
          grade: 95,
          feedback: '',
        });
      }
    });
  }

  public onSubmitGrade(): void {
    if (this.gradeForm.invalid || !this.tarea() || !this.tarea()?.mySubmission) {
      this.gradeForm.markAllAsTouched();
      return;
    }

    const val = this.gradeForm.value;
    this.gradeSubmitted.emit({
      tareaId: this.tarea()!.id,
      submissionId: this.tarea()!.mySubmission!.id,
      grade: Number(val.grade),
      feedback: val.feedback.trim(),
    });
  }

  public onDeliver(): void {
    if (this.tarea()) {
      this.deliverClicked.emit(this.tarea()!);
    }
  }

  public onClose(): void {
    this.closeModal.emit();
  }
}

