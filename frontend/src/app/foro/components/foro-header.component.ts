import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ForumAuthor, UserRole } from '../models/foro.model';

@Component({
  selector: 'app-foro-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top-header">
      <div class="header-search-wrap">
        <i class="bi bi-search search-icon" aria-hidden="true"></i>
        <input
          type="search"
          class="header-search-input"
          placeholder="Search forums..."
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          aria-label="Buscar en los foros académicos"
        />
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="icon-btn"
          aria-label="Notificaciones del foro"
          title="Respuestas académicas recientes"
        >
          <i class="bi bi-bell"></i>
          @if (notificationsCount() > 0) {
            <span class="notification-indicator"></span>
          }
          <span class="visually-hidden">Tienes notificaciones académicas nuevas</span>
        </button>

        <button
          type="button"
          class="icon-btn"
          aria-label="Configuración de preferencias"
          title="Configuración"
        >
          <i class="bi bi-gear"></i>
        </button>

        <div
          class="user-profile-badge"
          [title]="currentUser().name + ' (' + (currentUser().roleTitle || currentUser().role) + ')'"
        >
          @if (currentUser().avatar) {
            <img
              [src]="currentUser().avatar"
              [alt]="currentUser().name"
              class="user-avatar"
            />
          } @else {
            <div class="user-avatar-initials">{{ currentUser().initials }}</div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-header {
      height: 70px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      gap: 1.5rem;
      position: sticky;
      top: 0;
      z-index: 30;

      @media (max-width: 768px) {
        padding: 0 1rem;
        height: 60px;
      }
    }

    .header-search-wrap {
      position: relative;
      width: 100%;
      max-width: 480px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        pointer-events: none;
      }
    }

    .header-search-input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.6rem;
      background-color: #f1f5f9;
      border: 1px solid transparent;
      border-radius: 9999px;
      font-size: 0.9rem;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;

      &:focus {
        background-color: #ffffff;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: transparent;
      border: 1px solid #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
        border-color: #cbd5e1;
      }

      .notification-indicator {
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
      cursor: pointer;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .user-avatar-initials {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d4ed8, #4f46e5);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class ForoHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly currentUser = input.required<ForumAuthor>();
  public readonly currentRole = input.required<UserRole>();
  public readonly notificationsCount = input<number>(2);
  public readonly roleToggled = output<void>();

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}

