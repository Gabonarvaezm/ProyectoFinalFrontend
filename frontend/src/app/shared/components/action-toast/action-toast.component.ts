import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-action-toast',
  standalone: true,
  templateUrl: './action-toast.component.html',
  styleUrl: './action-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    '[class.is-success]': "tone() === 'success'",
    '[class.is-error]': "tone() === 'error'",
  },
})
export class ActionToastComponent {
  readonly message = input<string | null>('');
  readonly tone = input<'info' | 'success' | 'error'>('info');
}
