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
import { SendMessageDto } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-send-message-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profesor-send-message-modal.component.html',
  styleUrls: ['./profesor-send-message-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesorSendMessageModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input.required<boolean>();
  public readonly isSubmitting = input<boolean>(false);
  public readonly defaultTargetGroup = input<'all' | 'needs-attention' | 'active'>('all');

  public readonly closeModal = output<void>();
  public readonly messageSubmitted = output<SendMessageDto>();

  public readonly messageForm: FormGroup = this.fb.group({
    targetGroup: ['all' as const, [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    priority: ['normal' as const, [Validators.required]],
    sendToForums: [false],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.messageForm.reset({
          targetGroup: this.defaultTargetGroup(),
          subject: '',
          message: '',
          priority: 'normal',
          sendToForums: false,
        });
      }
    });
  }

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const value = this.messageForm.value;
    const dto: SendMessageDto = {
      targetGroup: value.targetGroup,
      subject: value.subject.trim(),
      message: value.message.trim(),
      priority: value.priority,
      sendToForums: !!value.sendToForums,
    };

    this.messageSubmitted.emit(dto);
  }
}
