import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';

@Component({
  selector: 'app-biblioteca-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="biblioteca-header">
      <div class="header-titles">
        <div class="header-badge">
          <i class="bi bi-book-half" aria-hidden="true"></i>
          <span>Repositorio Académico Abierto</span>
        </div>
        <h1 class="biblioteca-title">Biblioteca Digital Universitaria</h1>
        <p class="biblioteca-subtitle">
          Explora y consulta libremente material bibliográfico de alta calidad académica, 
          diseñado para el fortalecimiento de la educación pública.
        </p>
      </div>

      <!-- Barra de Búsqueda y Filtros Rápidos -->
      <div class="search-filters-bar">
        <div class="search-input-wrapper">
          <i class="bi bi-search search-icon" aria-hidden="true"></i>
          <input
            #libSearch
            type="search"
            class="search-field"
            placeholder="Buscar por título, autor, asignatura o palabras clave..."
            [value]="searchQuery()"
            (input)="onSearchInput(libSearch.value)"
            aria-label="Buscar libros en el repositorio"
          />
          @if (searchQuery()) {
            <button
              type="button"
              class="btn-clear-search"
              (click)="onClearSearch()"
              aria-label="Limpiar búsqueda"
            >
              <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
            </button>
          }
        </div>

        <!-- Filtro por formato -->
        <div class="format-filter-group" role="group" aria-label="Filtrar por formato">
          <button
            type="button"
            class="format-pill"
            [class.active]="selectedFormat() === 'all'"
            (click)="onSetFormat('all')"
          >
            Todos
          </button>
          <button
            type="button"
            class="format-pill"
            [class.active]="selectedFormat() === 'pdf'"
            (click)="onSetFormat('pdf')"
          >
            <i class="bi bi-file-earmark-pdf" aria-hidden="true"></i>
            PDF
          </button>
          <button
            type="button"
            class="format-pill"
            [class.active]="selectedFormat() === 'epub'"
            (click)="onSetFormat('epub')"
          >
            <i class="bi bi-journal-text" aria-hidden="true"></i>
            ePub
          </button>
          <button
            type="button"
            class="format-pill"
            [class.active]="selectedFormat() === 'interactivo'"
            (click)="onSetFormat('interactivo')"
          >
            <i class="bi bi-display" aria-hidden="true"></i>
            Interactivo
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .biblioteca-header {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 2rem 2.25rem;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      @media (max-width: 768px) {
        padding: 1.5rem 1.25rem;
      }
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .header-badge {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #1d4ed8;
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        padding: 0.35rem 0.85rem;
        border-radius: 9999px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .biblioteca-title {
        font-size: 1.85rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        line-height: 1.2;

        @media (max-width: 768px) {
          font-size: 1.5rem;
        }
      }

      .biblioteca-subtitle {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0;
        max-width: 720px;
        line-height: 1.55;
      }
    }

    .search-filters-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      min-width: 280px;

      .search-icon {
        position: absolute;
        left: 1.15rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 1.05rem;
        pointer-events: none;
      }

      .search-field {
        width: 100%;
        padding: 0.8rem 2.75rem 0.8rem 2.85rem;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.925rem;
        background-color: #ffffff;
        color: #0f172a;
        box-shadow: 0 2px 4px rgba(15, 23, 42, 0.03);
        outline: none;
        transition: all 0.2s ease;

        &:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      }

      .btn-clear-search {
        position: absolute;
        right: 0.85rem;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 0.25rem;
        font-size: 1.05rem;
        transition: color 0.15s ease;

        &:hover {
          color: #0f172a;
        }
      }
    }

    .format-filter-group {
      display: flex;
      gap: 0.4rem;
      background-color: #f1f5f9;
      padding: 0.3rem;
      border-radius: 12px;
    }

    .format-pill {
      background: transparent;
      border: none;
      padding: 0.5rem 0.95rem;
      font-size: 0.825rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;

      &:hover {
        color: #0f172a;
      }

      &.active {
        background-color: #ffffff;
        color: #1d4ed8;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
      }
    }
  `],
})
export class BibliotecaHeaderComponent {
  public readonly searchQuery = model<string>('');
  public readonly selectedFormat = model<string>('all');
  public readonly formatChanged = output<string>();

  public onSearchInput(val: string): void {
    this.searchQuery.set(val);
  }

  public onClearSearch(): void {
    this.searchQuery.set('');
  }

  public onSetFormat(format: string): void {
    this.selectedFormat.set(format);
    this.formatChanged.emit(format);
  }
}

