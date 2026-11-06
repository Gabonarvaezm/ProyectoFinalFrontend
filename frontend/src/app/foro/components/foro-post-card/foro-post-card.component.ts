import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateReplyPayload,
  ForumAuthor,
  ForumPost,
  ForumReply,
  UserRole,
} from '../../models/foro.model';

@Component({
  selector: 'app-foro-post-card',
  imports: [ReactiveFormsModule],
  templateUrl: './foro-post-card.component.html',
  styleUrl: './foro-post-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForoPostCardComponent {
  private readonly fb = inject(FormBuilder);

  public readonly post = input.required<ForumPost>();
  public readonly isExpanded = input<boolean>(false);
  public readonly currentRole = input.required<UserRole>();
  public readonly currentUser = input.required<ForumAuthor>();
  public readonly draftContent = input<string>('');

  public readonly toggleExpand = output<string>();
  public readonly helpfulVote = output<ForumPost>();
  public readonly replyHelpfulVote = output<ForumReply>();
  public readonly replySubmit = output<CreateReplyPayload>();

  public readonly isSubmitting = signal<boolean>(false);

  public replyForm: FormGroup = this.fb.group({
    content: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(1500)],
    ],
    academicReference: ['', [Validators.maxLength(250)]],
    markAsTeacherVerified: [false],
  });

  constructor() {
    // Escucha cambios reactivos del draft inyectado desde el Asistente AI
    effect(() => {
      const draft = this.draftContent();
      if (draft && this.isExpanded()) {
        this.replyForm.patchValue({
          content: draft,
          academicReference: 'Recomendación Contextual DiscerIA AI',
        });
      }
    });
  }

  public onToggleExpand(): void {
    this.toggleExpand.emit(this.post().id);
  }

  public onHelpfulClick(): void {
    this.helpfulVote.emit(this.post());
  }

  public onReplyHelpfulClick(reply: ForumReply): void {
    this.replyHelpfulVote.emit(reply);
  }

  public onReplySubmit(): void {
    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.replyForm.value;
    const isTeacher = this.currentRole() === 'professor';

    this.replySubmit.emit({
      postId: this.post().id,
      content: val.content.trim(),
      academicReference: val.academicReference?.trim() || undefined,
      isTeacherVerified: isTeacher && !!val.markAsTeacherVerified,
    });

    this.replyForm.reset({
      content: '',
      academicReference: '',
      markAsTeacherVerified: this.currentRole() === 'professor',
    });
    this.isSubmitting.set(false);
  }
}

