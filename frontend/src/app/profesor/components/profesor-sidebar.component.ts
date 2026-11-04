import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../models/profesor.model';

@Component({
  selector: 'app-profesor-sidebar',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar" aria-label="Navegación principal">
      <div class="sidebar-header">
        <a routerLink="/" class="brand-link" title="Ir a la página principal">
          <span class="brand-title">DiscerIA</span>
          <span class="brand-subtitle">Academic Research</span>
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
          <span>New Analysis</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      min-width: 240px;
      background-color: #fff;
      border-right: 1px solid #e5eaf2;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem 1.25rem;
      justify-content: space-between;
      height: 100vh;
      position: sticky;
      top: 0;
    }

    .sidebar-header {
      padding: 0 0.5rem 2rem;

      .brand-link { display: flex; flex-direction: column; text-decoration: none; }
      .brand-title {
        font-size: 1.45rem;
        font-weight: 800;
        color: #1053d4;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }
      .brand-subtitle {
        font-size: 0.75rem;
        font-weight: 500;
        color: #64748b;
        margin-top: 0.15rem;
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
        gap: 0.4rem;
      }

      .nav-button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.65rem 0.9rem;
        border-radius: 10px;
        font-size: 0.92rem;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        background: transparent;
        border: none;
        transition: all 0.15s ease;

        i { font-size: 1.15rem; color: #64748b; }

        &:hover {
          background-color: #f8fafc;
          color: #0f172a;
          i { color: #1053d4; }
        }

        &.active {
          background-color: #e8f1fd;
          color: #1053d4;
          font-weight: 600;
          i { color: #1053d4; }
        }
      }
    }

    .sidebar-footer .btn-new-analysis {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background-color: #0d59e3;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(13, 89, 227, 0.2);
      transition: all 0.18s ease;

      &:hover {
        background-color: #0b49be;
        transform: translateY(-1px);
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

