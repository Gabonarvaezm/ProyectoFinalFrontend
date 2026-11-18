import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePostPayload } from '../../models/foro.model';

@Component({
  selector: 'app-foro-create-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './foro-create-modal.component.html',
  styleUrl: './foro-create-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForoCreateModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly defaultSubject = input<string>('Matemáticas');
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly postSubmitted = output<CreatePostPayload>();

  public postForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]],
    subject: ['Matemáticas', [Validators.required]],
    content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    academicReference: ['', [Validators.maxLength(250)]],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const subj = this.defaultSubject();
        this.postForm.reset({
          title: '',
          subject: subj !== 'Todas las Materias' ? subj : 'Matemáticas',
          content: '',
          academicReference: '',
        });
      }
    });
  }

  public onBackdropClick(): void {
    this.closeModal.emit();
  }

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const val = this.postForm.value;
    this.postSubmitted.emit({
      title: val.title.trim(),
      subject: val.subject,
      content: val.content.trim(),
      academicReference: val.academicReference?.trim() || undefined,
    });
  }
}

