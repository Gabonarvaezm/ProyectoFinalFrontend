import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-configuracion-logout-modal',
  standalone: true,
  templateUrl: './configuracion-logout-modal.component.html',
  styleUrl: './configuracion-logout-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionLogoutModalComponent {
  public readonly isOpen = input.required<boolean>();
  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();

  public onConfirm(): void {
    this.confirmed.emit();
  }

  public onCancel(): void {
    this.cancelled.emit();
  }
}

