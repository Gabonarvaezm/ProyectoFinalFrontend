import { Component, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-sidebar',
  imports: [RouterLink],
  template: `
    <aside class="sidebar" aria-label="Navegación principal">
      <div class="sidebar-header">
        <a routerLink="/" class="brand-link" title="Ir a la página principal" aria-label="Ir a inicio de DiscerIA">
          <div class="brand-logo-wrap">
            <div class="brand-icon">
              <i class="bi bi-mortarboard-fill"></i>
            </div>
            <div class="brand-text">
              <span class="brand-name">DiscerIA</span>
              <span class="brand-sub">Portal Docente</span>
            </div>
          </div>
        </a>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          @for (item of navItems(); track item.id) {
            <li class="nav-item">
              <button
                type="button"
                class="nav-button"
                [class.active]="activeNav() === item.id"
                (click)="onSelectNav(item.id)"
                [attr.aria-current]="activeNav() === item.id ? 'page' : null"
              >
                <i [class]="item.icon" aria-hidden="true"></i>
                <span>{{ item.label }}</span>
              </button>
            </li>
          }
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button
          type="button"
          class="btn-new-analysis"
          (click)="newAnalysis.emit()"
          aria-label="Iniciar nuevo análisis académico"
        >
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
          <span>Nuevo Análisis</span>
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
        padding: var(--space-3) var(--space-4);
      }
    }

    .sidebar-header {
      padding: 0 var(--space-2) var(--space-6);

      .brand-link {
        text-decoration: none;
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
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-slate-900);
          letter-spacing: -0.02em;
        }

        .brand-sub {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-muted);
        }
      }
    }

    .sidebar-nav {
      flex: 1;

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

      .nav-button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: 0.65rem 0.875rem;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-slate-600);
        cursor: pointer;
        background: transparent;
        border: none;
        transition: var(--transition-fast);
        text-align: left;

        i {
          font-size: 1.125rem;
          color: var(--color-slate-500);
          transition: color var(--duration-fast) var(--ease-out-expo);
        }

        &:hover {
          background-color: var(--color-slate-100);
          color: var(--color-primary-700);

          i {
            color: var(--color-primary-700);
          }
        }

        &.active {
          background-color: var(--color-primary-50);
          color: var(--color-primary-700);
          font-weight: var(--font-weight-semibold);

          i {
            color: var(--color-primary-700);
          }
        }
      }
    }

    .sidebar-footer .btn-new-analysis {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      background: var(--color-ai-gradient);
      color: var(--color-white);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      border: none;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
      transition: var(--transition-fast);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        filter: brightness(1.05);
      }

      &:active {
        transform: translateY(0);
      }
    }
  `],
})
export class ProfesorSidebarComponent {
  public readonly navItems = input.required<readonly NavItem[]>();
  public readonly activeNav = model.required<string>();

  public readonly navSelected = output<string>();
  public readonly newAnalysis = output<void>();

  public onSelectNav(id: string): void {
    this.activeNav.set(id);
    this.navSelected.emit(id);
  }
}
