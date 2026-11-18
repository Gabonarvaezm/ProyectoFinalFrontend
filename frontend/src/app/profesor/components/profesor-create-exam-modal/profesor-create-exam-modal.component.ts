import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CreateExamDto } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-create-exam-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profesor-create-exam-modal.component.html',
  styleUrls: ['./profesor-create-exam-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorCreateExamModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input.required<boolean>();
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly examSubmitted = output<CreateExamDto>();

  public readonly examForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    subject: ['Ciencias', [Validators.required]],
    topic: ['Biología Celular: Mitosis y Meiosis', [Validators.required, Validators.minLength(3)]],
    questionsCount: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
    difficulty: ['Media' as const, [Validators.required]],
    durationMinutes: [45, [Validators.required, Validators.min(10), Validators.max(180)]],
    instructions: ['Lee atentamente cada pregunta antes de responder. Dispones de un intento único.'],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.examForm.reset({
          title: '',
          subject: 'Ciencias',
          topic: 'Biología Celular: Mitosis y Meiosis',
          questionsCount: 10,
          difficulty: 'Media',
          durationMinutes: 45,
          instructions: 'Lee atentamente cada pregunta antes de responder. Dispones de un intento único.',
        });
      }
    });
  }

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    const value = this.examForm.value;
    const dto: CreateExamDto = {
      title: value.title.trim(),
      subject: value.subject.trim(),
      topic: value.topic.trim(),
      questionsCount: Number(value.questionsCount),
      difficulty: value.difficulty,
      durationMinutes: Number(value.durationMinutes),
      instructions: value.instructions?.trim() || '',
    };

    this.examSubmitted.emit(dto);
  }
}
