import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-profesor-header',
  template: `
    <header class="top-header">
      <div class="search-box">
        <i class="bi bi-search search-icon" aria-hidden="true"></i>
        <input
          #searchInput
          type="search"
          class="search-input"
          placeholder="Buscar estudiantes, exámenes o cursos..."
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

    .search-box {
      position: relative;
      width: 100%;
      max-width: 440px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-slate-400);
        font-size: 0.95rem;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 0.625rem 1rem 0.625rem 2.6rem;
        background-color: var(--color-slate-50);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
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

      .icon-button {
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        border: 1px solid var(--color-border-subtle);
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-slate-600);
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

      .avatar-circle {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        background: var(--color-ai-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-white);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        box-shadow: var(--shadow-sm);
        cursor: pointer;
        transition: var(--transition-fast);

        &:hover {
          transform: scale(1.05);
        }
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
