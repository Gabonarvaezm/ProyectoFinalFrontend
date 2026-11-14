import { Component, input } from '@angular/core';

@Component({
  selector: 'app-action-toast',
  template: `
    <i [class]="tone() === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-info-circle-fill'" aria-hidden="true"></i>
    <span>{{ message() }}</span>
  `,
  styleUrl: './action-toast.component.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    '[class.is-success]': "tone() === 'success'",
  },
})
export class ActionToastComponent {
  readonly message = input.required<string>();
  readonly tone = input<'info' | 'success'>('info');
}
