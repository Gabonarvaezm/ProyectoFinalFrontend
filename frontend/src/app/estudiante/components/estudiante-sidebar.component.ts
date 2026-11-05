import { Component, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../../core/models/auth.model';

@Component({
  imports: [RouterLink],
  selector: 'app-estudiante-sidebar',
  template: `
    <aside class="sidebar" aria-label="Panel lateral de navegación">
      <div class="sidebar-header">
        <a routerLink="/" class="brand-link" aria-label="Ir a inicio de DiscerIA">
          <div class="brand-logo-wrap">
            <div class="brand-icon">
              <i class="bi bi-mortarboard-fill"></i>
            </div>
            <div class="brand-text">
              <span class="brand-name">DiscerIA</span>
              <span class="brand-sub">Portal Estudiante</span>
            </div>
          </div>
        </a>
      </div>

      <nav class="sidebar-nav" aria-label="Navegación del estudiante">
        <ul class="nav-list">
          @for (item of navItems(); track item.id) {
            <li class="nav-item">
              <button
                type="button"
                class="nav-btn"
                [class.active]="activeNav() === item.id"
                (click)="onSelectNav(item.id)"
              >
                <i [class]="item.icon + ' nav-icon'"></i>
                <span class="nav-label">{{ item.label }}</span>
              </button>
            </li>
          }
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="institution-badge" [title]="institution()">
          <i class="bi bi-building"></i>
          <span>{{ institution() }}</span>
        </div>
        <button
          type="button"
          class="nav-btn nav-btn-logout"
          (click)="logoutClicked.emit()"
          aria-label="Cerrar sesión"
        >
          <i class="bi bi-box-arrow-right nav-icon"></i>
          <span class="nav-label">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width, 256px);
      min-width: var(--sidebar-width, 256px);
      background-color: var(--color-bg-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      padding: var(--space-5) var(--space-4) var(--space-4);
      justify-content: space-between;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 30;

      @media (max-width: 1200px) {
        width: 100%;
        min-width: 100%;
        height: auto;
        position: static;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
      }
    }

    .brand-link {
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%);
      color: var(--color-white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.28);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;

      .brand-name {
        font-weight: var(--font-weight-extrabold);
        font-size: var(--font-size-lg);
        color: var(--color-slate-900);
        letter-spacing: -0.02em;
      }

      .brand-sub {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-muted);
      }
    }

    .sidebar-nav {
      flex: 1;
      margin: var(--space-5) 0;

      @media (max-width: 1200px) {
        margin: 0;
        flex: initial;
      }
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);

      @media (max-width: 1200px) {
        flex-direction: row;
        flex-wrap: wrap;
      }
    }

    .nav-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 0.65rem 0.875rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--color-slate-600);
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: var(--transition-fast);
      text-align: left;

      .nav-icon {
        font-size: 1.125rem;
        color: var(--color-slate-500);
        transition: color var(--duration-fast) var(--ease-out-expo);
      }

      &:hover {
        background-color: var(--color-slate-100);
        color: var(--color-primary-700);

        .nav-icon {
          color: var(--color-primary-700);
        }
      }

      &.active {
        background-color: var(--color-primary-50);
        color: var(--color-primary-700);
        font-weight: var(--font-weight-semibold);

        .nav-icon {
          color: var(--color-primary-700);
        }
      }
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);

      @media (max-width: 1200px) {
        border-top: none;
        padding-top: 0;
        flex-direction: row;
        align-items: center;
      }
    }

    .institution-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-slate-600);
      padding: 0.45rem 0.75rem;
      background-color: var(--color-slate-50);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-btn-logout {
      color: var(--color-danger);

      .nav-icon {
        color: var(--color-danger);
      }

      &:hover {
        background-color: var(--color-danger-bg);
        color: var(--color-danger);

        .nav-icon {
          color: var(--color-danger);
        }
      }
    }
  `],
})
export class EstudianteSidebarComponent {
  public readonly navItems = input.required<readonly NavItem[]>();
  public readonly activeNav = model.required<string>();
  public readonly institution = input<string>('Institución Pública');

  public readonly navSelected = output<string>();
  public readonly logoutClicked = output<void>();

  public onSelectNav(id: string): void {
    this.activeNav.set(id);
    this.navSelected.emit(id);
  }
}
