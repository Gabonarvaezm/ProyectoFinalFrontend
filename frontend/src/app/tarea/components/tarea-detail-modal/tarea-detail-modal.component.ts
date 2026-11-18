import { DialogFocusDirective } from '../dialog-focus.directive';
import { TaskFileComponent } from '../task-file.component';
import {
  Component,
  effect,
  signal,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GradeTareaDto, Tarea } from '../../models/tarea.model';

@Component({
  selector: 'app-tarea-detail-modal',
  imports: [UpperCasePipe, ReactiveFormsModule, TaskFileComponent, DialogFocusDirective],
  templateUrl: './tarea-detail-modal.component.html',
  styleUrl: './tarea-detail-modal.component.scss',
})
export class TareaDetailModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly tarea = input<Tarea | null>(null);
  public readonly isProfessor = input<boolean>(false);
  readonly studentId = input('');
  readonly isSaving = input(false);
  readonly selectedStudent = signal<{ taskId?: string; studentId: string; open: boolean }>({ studentId: '', open: false });

  readonly selectedId = signal('');
  readonly selectedSubmission = computed(() => {
    const task = this.tarea();
    if (!this.isProfessor()) return task?.mySubmission;
    const selected = this.selectedStudent().studentId;
    if (selected) return task?.submissions?.find((item) => item.studentId === selected);
    return task?.submissions?.find((item) => item.id === this.selectedId()) ?? task?.mySubmission ?? task?.submissions?.[0];
  });
  selectStudent(studentId: string): void { this.selectedStudent.set({ taskId: this.tarea()?.id, studentId, open: this.isOpen() }); }
  readonly selectedTask = computed(() => {
    const task = this.tarea();
    const submission = this.selectedSubmission();
    const recipient = task?.recipients?.find((item) => item.studentId === (this.selectedStudent().studentId || submission?.studentId));
    return task ? { ...task, mySubmission: submission, status: recipient?.status ?? task.status } : null;
  });
  readonly lastDelivery = computed(() => [...(this.selectedSubmission()?.history ?? [])].reverse().find((item) => item.submittedAt));
  readonly reviewRequested = output<string>();
  readonly correctionRequested = output<{ submissionId: string; feedback: string }>();
  requestCorrection(): void {
    const submission = this.selectedSubmission();
    const feedback = String(this.gradeForm.value.feedback ?? '').trim();
    if (this.isProfessor() && submission?.submittedAt && submission.status !== 'requiere_correccion' && feedback && !this.isSaving()) this.correctionRequested.emit({ submissionId: submission.id, feedback });
    else this.gradeForm.controls['feedback'].markAsTouched();
  }
  public readonly closeModal = output<void>();
  public readonly deliverClicked = output<Tarea>();
  public readonly gradeSubmitted = output<GradeTareaDto>();

  public readonly gradeForm: FormGroup = this.fb.group({
    grade: [95, [Validators.required, Validators.min(0), Validators.max(100)]],
    feedback: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  constructor() {
    let selectionKey = '';
    effect(() => {
      const taskId = this.tarea()?.id;
      const studentId = this.studentId();
      const open = this.isOpen();
      const key = JSON.stringify([taskId, studentId, open]);
      if (selectionKey !== key) { selectionKey = key; this.selectedStudent.set({ taskId, studentId, open }); }
    });
    let formVersion = '';
    effect(() => {
      const currentTarea = this.selectedTask();
      const submission = currentTarea?.mySubmission;
      const version = JSON.stringify([this.isOpen(), currentTarea?.id, submission?.id, submission?.revision, submission?.grade, submission?.feedback]);
      if (version === formVersion) return;
      formVersion = version;
      this.gradeForm.controls['grade'].setValidators([Validators.required, Validators.min(0), Validators.max(currentTarea?.maxScore ?? 100)]);
      this.gradeForm.controls['grade'].updateValueAndValidity();
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
    if (this.isSaving() || !this.isProfessor() || this.gradeForm.invalid || !this.tarea() || !this.selectedSubmission()?.submittedAt || this.selectedSubmission()?.status === 'requiere_correccion') {
      this.gradeForm.markAllAsTouched();
      return;
    }

    const val = this.gradeForm.value;
    this.gradeSubmitted.emit({
      tareaId: this.tarea()!.id,
      submissionId: this.selectedSubmission()!.id,
      revision: this.selectedSubmission()!.revision,
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

