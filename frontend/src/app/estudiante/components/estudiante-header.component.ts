import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-estudiante-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top-header">
      <div class="search-bar-wrap">
        <i class="bi bi-search search-icon" aria-hidden="true"></i>
        <input
          #studSearch
          type="search"
          class="search-input"
          placeholder="Buscar lecciones, libros, conceptos o evaluaciones..."
          [value]="searchQuery()"
          (input)="onSearch(studSearch.value)"
          aria-label="Buscar en la plataforma educativa"
        />
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-icon-action"
          (click)="notificationsClicked.emit()"
          [attr.aria-label]="notificationsCount() + ' notificaciones pendientes'"
          title="Notificaciones de tareas y foros"
        >
          <i class="bi bi-bell"></i>
          @if (notificationsCount() > 0) {
            <span class="notification-dot" aria-hidden="true"></span>
          }
        </button>

        <div
          class="user-profile-badge"
          (click)="profileClicked.emit()"
          tabindex="0"
          role="button"
          aria-label="Perfil del estudiante"
        >
          <div class="user-avatar-initials">{{ userInitials() }}</div>
          <div class="user-info-text">
            <span class="user-greeting">Hola de nuevo,</span>
            <span class="user-name">{{ studentName() }}</span>
          </div>
        </div>

        <button
          type="button"
          class="btn-icon-action btn-logout"
          (click)="logoutClicked.emit()"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .top-header {
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      position: sticky;
      top: 0;
      z-index: 20;

      @media (max-width: 768px) {
        padding: 0.85rem 1rem;
      }
    }

    .search-bar-wrap {
      position: relative;
      flex: 1;
      max-width: 520px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 0.65rem 1rem 0.65rem 2.6rem;
        border: 1px solid #e2e8f0;
        border-radius: 9999px;
        background-color: #f8fafc;
        font-size: 0.9rem;
        color: #0f172a;
        outline: none;
        transition: all 0.2s ease;

        &:focus {
          background-color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-icon-action {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background-color: #f8fafc;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.15rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
        border-color: #cbd5e1;
      }

      &.btn-logout {
        color: #dc2626;
        &:hover {
          background-color: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }
      }

      .notification-dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background-color: #ef4444;
        border-radius: 50%;
        border: 2px solid #ffffff;
      }
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.35rem 0.75rem;
      border-radius: 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f8fafc;
      }
    }

    .user-avatar-initials {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-info-text {
      display: flex;
      flex-direction: column;

      @media (max-width: 640px) {
        display: none;
      }

      .user-greeting {
        font-size: 0.725rem;
        color: #94a3b8;
      }

      .user-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0f172a;
      }
    }
  `],
})
export class EstudianteHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly studentName = input.required<string>();
  public readonly userInitials = input.required<string>();
  public readonly notificationsCount = input<number>(2);

  public readonly searchChanged = output<string>();
  public readonly notificationsClicked = output<void>();
  public readonly profileClicked = output<void>();
  public readonly logoutClicked = output<void>();

  public onSearch(val: string): void {
    this.searchQuery.set(val);
    this.searchChanged.emit(val);
  }
}
