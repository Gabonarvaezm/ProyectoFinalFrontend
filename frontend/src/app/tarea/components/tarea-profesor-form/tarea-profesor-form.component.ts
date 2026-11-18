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
import { CreateTareaDto, TareaPriority } from '../../models/tarea.model';

@Component({
  selector: 'app-tarea-profesor-form',
  imports: [ReactiveFormsModule, TaskFileComponent, DialogFocusDirective],
  templateUrl: './tarea-profesor-form.component.html',
  styleUrl: './tarea-profesor-form.component.scss',
})
export class TareaProfesorFormComponent {
  readonly file = signal<AcademicFile | undefined>(undefined);
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly isSubmitting = input<boolean>(false);
  public readonly subjects = input<string[]>([
    'Ciencias',
    'Matemáticas',
    'Historia',
    'Tecnología',
    'Lenguaje',
  ]);

  public readonly closeModal = output<void>();
  public readonly tareaCreated = output<CreateTareaDto>();

  public readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
    subject: ['Ciencias', [Validators.required]],
    dueDate: [this.getDefaultDueDate(), [Validators.required]],
    maxScore: [100, [Validators.required, Validators.min(10), Validators.max(100)]],
    priority: ['alta' as TareaPriority, [Validators.required]],
    attachmentName: [''],
    instructions: [''],
    criteria: [''],
    recipients: [''],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.file.set(undefined);
        this.form.reset({ title: '', description: '', subject: 'Ciencias', dueDate: this.getDefaultDueDate(),
          maxScore: 100, priority: 'alta', instructions: '', criteria: '', recipients: '', attachmentName: '' });
      }
    });
  }

  private getDefaultDueDate(): string {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const dto: CreateTareaDto = {
      material: this.file(),
      instructions: val.instructions?.trim(),
      criteria: val.criteria?.trim(),
      recipientEmails: val.recipients?.trim() ? val.recipients.split(',').map((email: string) => email.trim().toLowerCase()).filter(Boolean) : undefined,
      title: val.title.trim(),
      description: val.description.trim(),
      subject: val.subject,
      dueDate: val.dueDate,
      maxScore: Number(val.maxScore),
      priority: val.priority,
      attachmentName: val.attachmentName?.trim() || undefined,
    };

    this.tareaCreated.emit(dto);

  }

  public onClose(): void {
    this.closeModal.emit();
  }
}

