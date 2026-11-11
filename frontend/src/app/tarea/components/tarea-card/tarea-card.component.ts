import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tarea } from '../../models/tarea.model';

@Component({
  selector: 'app-tarea-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarea-card.component.html',
  styleUrl: './tarea-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareaCardComponent {
  public readonly tarea = input.required<Tarea>();
  public readonly isProfessor = input<boolean>(false);

  public readonly cardClicked = output<Tarea>();
  public readonly actionClicked = output<Tarea>();
  public readonly deleteClicked = output<string>();

  public readonly statusBadgeClass = computed(() => {
    switch (this.tarea().status) {
      case 'pendiente':
        return 'badge-warning';
      case 'entregada':
        return 'badge-info';
      case 'calificada':
        return 'badge-success';
      case 'vencida':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  });

  public readonly statusLabel = computed(() => {
    switch (this.tarea().status) {
      case 'pendiente':
        return 'Pendiente';
      case 'entregada':
        return 'Entregada';
      case 'calificada':
        return 'Calificada';
      case 'vencida':
        return 'Vencida';
      default:
        return this.tarea().status;
    }
  });

  public onAction(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit(this.tarea());
  }

  public onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteClicked.emit(this.tarea().id);
  }
}

