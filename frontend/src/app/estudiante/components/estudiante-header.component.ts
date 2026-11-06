import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-estudiante-header',
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
        <!-- Botón Topbar Asistente IA (Opción 1: Barra Superior) -->
        <button
          type="button"
          class="btn-icon-action btn-ai-toggle"
          [class.active]="isAiDrawerOpen()"
          (click)="aiToggleClicked.emit()"
          title="Asistente de Aprendizaje IA"
          aria-label="Alternar Asistente de IA"
          [attr.aria-expanded]="isAiDrawerOpen()"
        >
          <i class="bi bi-robot"></i>
        </button>

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
      </div>
    </header>
  `,
  styles: [`
    .top-header {
      background-color: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      padding: 0 var(--space-8);
      height: var(--header-height, 70px);
      display: flex;
      align-items: center;
      justify-content: space-between;
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

    .search-bar-wrap {
      position: relative;
      flex: 1;
      max-width: 520px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-slate-400);
        pointer-events: none;
        font-size: 0.95rem;
      }

      .search-input {
        width: 100%;
        padding: 0.625rem 1rem 0.625rem 2.6rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background-color: var(--color-slate-50);
        font-size: var(--font-size-sm);
        color: var(--color-slate-900);
        outline: none;
        transition: var(--transition-fast);

        &::placeholder {
          color: var(--color-slate-400);
        }

        &:hover {
          border-color: var(--color-slate-300);
        }

        &:focus {
          background-color: var(--color-bg-surface);
          border-color: var(--color-primary-600);
          box-shadow: var(--focus-ring);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .btn-icon-action {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border-subtle);
      background-color: transparent;
      color: var(--color-slate-600);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.15rem;
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

      .notification-dot {
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
      gap: var(--space-3);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-fast);

      &:hover {
        background-color: var(--color-slate-100);
      }
    }

    .user-avatar-initials {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--color-ai-gradient);
      color: var(--color-white);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    .user-info-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;

      @media (max-width: 640px) {
        display: none;
      }

      .user-greeting {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .user-name {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-slate-900);
      }
    }
  `],
})
export class EstudianteHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly studentName = input.required<string>();
  public readonly userInitials = input.required<string>();
  public readonly notificationsCount = input<number>(2);
  public readonly isAiDrawerOpen = input<boolean>(false);

  public readonly searchChanged = output<string>();
  public readonly notificationsClicked = output<void>();
  public readonly profileClicked = output<void>();
  public readonly aiToggleClicked = output<void>();

  public onSearch(val: string): void {
    this.searchQuery.set(val);
    this.searchChanged.emit(val);
  }
}
