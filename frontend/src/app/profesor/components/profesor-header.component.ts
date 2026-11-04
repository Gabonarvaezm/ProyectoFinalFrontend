import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-profesor-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top-header">
      <div class="search-box">
        <i class="bi bi-search search-icon" aria-hidden="true"></i>
        <input
          #searchInput
          type="search"
          class="search-input"
          placeholder="Buscar estudiantes, exámenes..."
          [value]="searchQuery()"
          (input)="onSearchChange(searchInput.value)"
          aria-label="Buscar estudiantes o exámenes"
        />
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="icon-button"
          (click)="notificationsClicked.emit()"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <i class="bi bi-bell"></i>
          @if (notificationsCount() > 0) {
            <span class="notification-indicator"></span>
          }
        </button>

        <button
          type="button"
          class="icon-button"
          aria-label="Configuración"
          title="Configuración"
        >
          <i class="bi bi-gear"></i>
        </button>

        <div class="user-profile-badge" [title]="teacherName()">
          <div class="avatar-circle">
            <span class="avatar-initials">{{ teacherInitials() }}</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-header {
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      background-color: transparent;
    }

    .search-box {
      position: relative;
      width: 100%;
      max-width: 440px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }

      .search-input {
        width: 100%;
        padding: 0.65rem 1rem 0.65rem 2.5rem;
        background-color: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #0f172a;
        outline: none;
        transition: all 0.2s ease;

        &::placeholder { color: #94a3b8; }
        &:focus {
          border-color: #1053d4;
          box-shadow: 0 0 0 3px rgba(16, 83, 212, 0.12);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;

      .icon-button {
        position: relative;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;
        cursor: pointer;
        font-size: 1.2rem;
        transition: background-color 0.2s ease;

        &:hover { background-color: #e2e8f0; color: #0f172a; }

        .notification-indicator {
          position: absolute;
          top: 6px;
          right: 7px;
          width: 7px;
          height: 7px;
          background-color: #ef4444;
          border-radius: 50%;
        }
      }

      .avatar-circle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0284c7, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
      }
    }
  `],
})
export class ProfesorHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly notificationsCount = input<number>(1);
  public readonly teacherName = input<string>('Prof. García');
  public readonly teacherInitials = input<string>('PG');

  public readonly notificationsClicked = output<void>();

  public onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }
}
