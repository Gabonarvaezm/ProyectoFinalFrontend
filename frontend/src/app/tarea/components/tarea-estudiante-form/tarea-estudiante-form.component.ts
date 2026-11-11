import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubmitTareaDto, Tarea } from '../../models/tarea.model';

@Component({
  selector: 'app-tarea-estudiante-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarea-estudiante-form.component.html',
  styleUrl: './tarea-estudiante-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareaEstudianteFormComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly tarea = input<Tarea | null>(null);
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly tareaSubmitted = output<SubmitTareaDto>();

  public readonly form: FormGroup = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    attachmentUrl: [''],
    comments: ['', [Validators.maxLength(500)]],
  });

  public onSubmit(): void {
    if (this.form.invalid || !this.tarea()) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const dto: SubmitTareaDto = {
      tareaId: this.tarea()!.id,
      content: val.content.trim(),
      attachmentUrl: val.attachmentUrl?.trim() || undefined,
      comments: val.comments?.trim() || undefined,
    };

    this.tareaSubmitted.emit(dto);
    this.form.reset({
      content: '',
      attachmentUrl: '',
      comments: '',
    });
  }

  public onClose(): void {
    this.closeModal.emit();
  }
}

