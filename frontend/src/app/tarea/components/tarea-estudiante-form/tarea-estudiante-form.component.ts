import { DialogFocusDirective } from '../dialog-focus.directive';
import { TaskFileComponent } from '../task-file.component';
import { AcademicFile } from '../../models/tarea.model';
import {
  Component,
  inject,
  signal,
  effect,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubmitTareaDto, Tarea } from '../../models/tarea.model';

@Component({
  selector: 'app-tarea-estudiante-form',
  imports: [ReactiveFormsModule, TaskFileComponent, DialogFocusDirective],
  templateUrl: './tarea-estudiante-form.component.html',
  styleUrl: './tarea-estudiante-form.component.scss',
})
export class TareaEstudianteFormComponent {
  readonly file = signal<AcademicFile | undefined>(undefined);
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly tarea = input<Tarea | null>(null);
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly draftSaved = output<SubmitTareaDto>();
  public readonly tareaSubmitted = output<SubmitTareaDto>();

  public readonly form: FormGroup = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    attachmentUrl: [''],
    comments: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      const task = this.tarea();
      if (this.isOpen()) this.file.set(task?.mySubmission?.attachment);
      if (this.isOpen()) this.form.reset({ content: task?.mySubmission?.content ?? '',
        attachmentUrl: task?.mySubmission?.attachmentUrl ?? '', comments: task?.mySubmission?.comments ?? '' });
    });
  }
  public saveDraft(): void {
    if (this.tarea()) this.draftSaved.emit(this.dto());
  }
  private dto(): SubmitTareaDto {
    return { attachment: this.file(), tareaId: this.tarea()!.id, revision: this.tarea()!.mySubmission?.revision ?? 0,
      content: (this.form.value.content ?? '').trim(), attachmentUrl: this.form.value.attachmentUrl?.trim() || undefined,
      comments: this.form.value.comments?.trim() || undefined };
  }
  public onSubmit(): void {
    if (this.form.invalid || !this.tarea()) { this.form.markAllAsTouched(); return; }
    this.tareaSubmitted.emit(this.dto());
  }

  public onClose(): void {
    this.closeModal.emit();
  }
}

