import { Component, input, model, output } from '@angular/core';
import { ForumAuthor, UserRole } from '../models/foro.model';

@Component({
  selector: 'app-foro-header',
  template: `
    <header class="top-header">
      <div class="header-search-wrap">
        <i class="bi bi-search search-icon" aria-hidden="true"></i>
        <input
          type="search"
          class="header-search-input"
          placeholder="Buscar discusiones, dudas o publicaciones..."
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          aria-label="Buscar en los foros académicos"
        />
      </div>

      <div class="header-actions">
        <!-- Botón Topbar Asistente IA (Opción 1: Barra Superior) -->
        <button
          type="button"
          class="icon-btn btn-ai-toggle"
          [class.active]="isAiPanelOpen()"
          (click)="aiToggleClicked.emit()"
          title="Asistente de Comunidad Context AI"
          aria-label="Alternar Asistente de Comunidad"
          [attr.aria-expanded]="isAiPanelOpen()"
        >
          <i class="bi bi-robot"></i>
        </button>

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
      height: var(--header-height, 70px);
      background-color: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-8);
      gap: var(--space-6);
      position: sticky;
      top: 0;
      z-index: 20;

      @media (max-width: 768px) {
        padding: 0 var(--space-4);
        height: auto;
        min-height: 60px;
        flex-wrap: wrap;
        gap: var(--space-3);
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
        color: var(--color-slate-400);
        pointer-events: none;
        font-size: 0.95rem;
      }
    }

    .header-search-input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.6rem;
      background-color: var(--color-slate-50);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-slate-900);
      outline: none;
      transition: var(--transition-fast);

      &:focus {
        background-color: var(--color-bg-surface);
        border-color: var(--color-primary-600);
        box-shadow: var(--focus-ring);
      }

      &::placeholder {
        color: var(--color-slate-400);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background-color: transparent;
      border: 1px solid var(--color-border-subtle);
      color: var(--color-slate-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      cursor: pointer;
      position: relative;
      transition: var(--transition-fast);

      &:hover {
        background-color: var(--color-slate-100);
        color: var(--color-slate-900);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
      }

      &.btn-ai-toggle {
        background: var(--color-slate-100);
        color: var(--color-primary-700);

        &:hover {
          background: var(--color-primary-50);
          color: var(--color-primary-800);
          transform: translateY(-1px);
        }

        &.active {
          background: var(--color-ai-gradient);
          color: var(--color-white);
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
        }
      }

      .notification-indicator {
        position: absolute;
        top: 8px;
        right: 9px;
        width: 8px;
        height: 8px;
        background-color: var(--color-danger);
        border-radius: var(--radius-full);
        border: 2px solid var(--color-white);
      }
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      object-fit: cover;
      border: 2px solid var(--color-white);
      box-shadow: var(--shadow-xs);
    }

    .user-avatar-initials {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--color-ai-gradient);
      color: var(--color-white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
      box-shadow: var(--shadow-sm);
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
  public readonly isAiPanelOpen = input<boolean>(true);

  public readonly roleToggled = output<void>();
  public readonly aiToggleClicked = output<void>();

  public onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}
