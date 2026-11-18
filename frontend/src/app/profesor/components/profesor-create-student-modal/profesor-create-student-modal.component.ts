import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateStudentDto, StudentStatus } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-create-student-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './profesor-create-student-modal.component.html',
  styleUrl: './profesor-create-student-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorCreateStudentModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input.required<boolean>();
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly studentSubmitted = output<CreateStudentDto>();

  public readonly studentForm: FormGroup = this.fb.group({
    studentName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['Biología: Mitosis', [Validators.required, Validators.minLength(3)]],
    score: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
    status: ['active' as StudentStatus, [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.studentForm.reset({
          studentName: '',
          email: '',
          topic: 'Biología: Mitosis',
          score: 75,
          status: 'active',
        });
      }
    });
  }

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const formValue = this.studentForm.value;
    const dto: CreateStudentDto = {
      studentName: formValue.studentName.trim(),
      email: formValue.email.trim(),
      topic: formValue.topic.trim(),
      score: Number(formValue.score),
      status: formValue.status as StudentStatus,
    };

    this.studentSubmitted.emit(dto);
  }
}

