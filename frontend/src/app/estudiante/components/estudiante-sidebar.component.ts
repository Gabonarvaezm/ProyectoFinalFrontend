import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../../core/models/auth.model';

@Component({
  imports: [RouterLink],
  selector: 'app-estudiante-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
              <span class="brand-sub">Plataforma Educativa</span>
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
      width: 250px;
      min-width: 250px;
      background-color: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      justify-content: space-between;

      @media (max-width: 1200px) {
        width: 100%;
        min-width: 100%;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1rem 1.5rem;
      }
    }

    .brand-link {
      text-decoration: none;
      color: inherit;
    }

    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
    }

    .brand-text {
      display: flex;
      flex-direction: column;

      .brand-name {
        font-weight: 800;
        font-size: 1.1rem;
        color: #0f172a;
        line-height: 1.1;
      }

      .brand-sub {
        font-size: 0.7rem;
        font-weight: 600;
        color: #64748b;
        letter-spacing: 0.02em;
      }
    }

    .sidebar-nav {
      flex: 1;
      margin: 2rem 0;

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
      gap: 0.35rem;

      @media (max-width: 1200px) {
        flex-direction: row;
        flex-wrap: wrap;
      }
    }

    .nav-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: #64748b;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;

      .nav-icon {
        font-size: 1.1rem;
        transition: transform 0.2s ease;
      }

      &:hover {
        background-color: #f8fafc;
        color: #0f172a;

        .nav-icon {
          transform: translateX(2px);
        }
      }

      &.active {
        background-color: #eff6ff;
        color: #1d4ed8;

        .nav-icon {
          color: #1d4ed8;
        }
      }
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;

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
      gap: 0.5rem;
      font-size: 0.785rem;
      color: #64748b;
      padding: 0.5rem 0.75rem;
      background-color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-btn-logout {
      color: #dc2626;

      &:hover {
        background-color: #fef2f2;
        color: #b91c1c;
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
