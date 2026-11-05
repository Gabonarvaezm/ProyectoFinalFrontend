import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatSession, ChatbotAcademicMode, ModeOption } from '../models/chatbot.model';

@Component({
  selector: 'app-chatbot-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <aside class="chatbot-sidebar" aria-label="Historial y configuración del Chatbot">
      <!-- Encabezado con Brand de DiscerIA y botón Nuevo Chat -->
      <div class="sidebar-top">
        <a routerLink="/" class="brand-link" aria-label="Ir al inicio de DiscerIA">
          <div class="brand-icon">
            <i class="bi bi-robot" aria-hidden="true"></i>
          </div>
          <div class="brand-text">
            <span class="brand-name">Discer<span class="brand-accent">IA</span></span>
            <span class="brand-sub">Academic AI Assistant</span>
          </div>
        </a>

        <button
          type="button"
          class="btn-new-chat"
          (click)="newChatRequested.emit()"
          aria-label="Iniciar una nueva sesión de consulta académica"
        >
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
          <span>Nueva Consulta</span>
        </button>
      </div>

      <!-- Selector de Modo Académico de la IA -->
      <div class="modes-section">
        <span class="section-title">MODO DE ASISTENCIA</span>
        <div class="modes-grid" role="group" aria-label="Seleccionar modo de asistencia">
          @for (m of modes(); track m.id) {
            <button
              type="button"
              class="mode-card-btn"
              [class.active]="activeMode() === m.id"
              (click)="modeSelected.emit(m.id)"
              [title]="m.description"
              [attr.aria-pressed]="activeMode() === m.id"
            >
              <i [class]="m.icon + ' mode-icon'" aria-hidden="true"></i>
              <div class="mode-info">
                <span class="mode-label">{{ m.label }}</span>
                <span class="mode-desc">{{ m.description }}</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Historial de Conversaciones Recientes -->
      <div class="sessions-section">
        <div class="sessions-header">
          <span class="section-title">SESIONES RECIENTES</span>
          @if (sessions().length > 0) {
            <button
              type="button"
              class="btn-clear-history"
              (click)="clearHistoryRequested.emit()"
              title="Limpiar todas las conversaciones"
              aria-label="Limpiar historial"
            >
              <i class="bi bi-trash3" aria-hidden="true"></i>
            </button>
          }
        </div>

        <ul class="sessions-list" aria-label="Lista de conversaciones recientes">
          @for (session of sessions(); track session.id) {
            <li class="session-item">
              <button
                type="button"
                class="session-btn"
                [class.active]="activeSessionId() === session.id"
                (click)="sessionSelected.emit(session.id)"
                [attr.aria-current]="activeSessionId() === session.id ? 'true' : null"
              >
                <i class="bi bi-chat-left-text session-icon" aria-hidden="true"></i>
                <div class="session-meta">
                  <span class="session-title">{{ session.title }}</span>
                  <span class="session-preview">{{ session.lastMessage }}</span>
                </div>
              </button>
            </li>
          } @empty {
            <li class="empty-sessions">
              <i class="bi bi-chat-square-dots" aria-hidden="true"></i>
              <span>No hay sesiones archivadas</span>
            </li>
          }
        </ul>
      </div>

      <!-- Pie con Navegación Rápida -->
      <div class="sidebar-bottom">
        <a routerLink="/estudiante" class="nav-back-link">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          <span>Volver al Dashboard</span>
        </a>
        <a routerLink="/foro" class="nav-back-link">
          <i class="bi bi-chat-square-quote" aria-hidden="true"></i>
          <span>Ir a Foros</span>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    .chatbot-sidebar {
      width: 320px;
      min-width: 320px;
      background-color: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 30;
      overflow-y: auto;
      padding: 1.5rem 1.25rem;
      gap: 1.5rem;

      @media (max-width: 1024px) {
        width: 100%;
        min-width: 100%;
        height: auto;
        position: relative;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        padding: 1.25rem 1rem;
      }
    }

    .sidebar-top {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #8b5cf6 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
    }

    .brand-accent {
      color: #2563eb;
    }

    .brand-sub {
      font-size: 0.725rem;
      font-weight: 600;
      color: #4f46e5;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .btn-new-chat {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 3px 8px rgba(29, 78, 216, 0.2);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 14px rgba(29, 78, 216, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #94a3b8;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.65rem;
    }

    .modes-section {
      display: flex;
      flex-direction: column;
    }

    .modes-grid {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .mode-card-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;

      .mode-icon {
        font-size: 1.15rem;
        color: #64748b;
        transition: color 0.2s ease;
      }

      .mode-info {
        display: flex;
        flex-direction: column;
      }

      .mode-label {
        font-size: 0.825rem;
        font-weight: 700;
        color: #0f172a;
      }

      .mode-desc {
        font-size: 0.7rem;
        color: #64748b;
        line-height: 1.3;
      }

      &:hover {
        background-color: #f1f5f9;
        border-color: #cbd5e1;

        .mode-icon {
          color: #2563eb;
        }
      }

      &.active {
        background-color: #eff6ff;
        border-color: #bfdbfe;

        .mode-icon {
          color: #1d4ed8;
        }

        .mode-label {
          color: #1d4ed8;
        }
      }
    }

    .sessions-section {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 180px;
    }

    .sessions-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      .btn-clear-history {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.2rem;
        border-radius: 4px;
        transition: color 0.2s ease;

        &:hover {
          color: #ef4444;
        }
      }
    }

    .sessions-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      overflow-y: auto;
      max-height: 260px;
    }

    .session-item {
      width: 100%;
    }

    .session-btn {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: all 0.18s ease;

      .session-icon {
        font-size: 0.95rem;
        color: #94a3b8;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .session-meta {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .session-title {
        font-size: 0.825rem;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .session-preview {
        font-size: 0.7rem;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }

      &.active {
        background-color: #f1f5f9;
        border-color: #e2e8f0;

        .session-icon {
          color: #1d4ed8;
        }
      }
    }

    .empty-sessions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 0.5rem;
      font-size: 0.785rem;
      color: #94a3b8;
      justify-content: center;
    }

    .sidebar-bottom {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .nav-back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }
    }
  `],
})
export class ChatbotSidebarComponent {
  public readonly sessions = input.required<readonly ChatSession[]>();
  public readonly activeSessionId = input.required<string>();
  public readonly activeMode = input.required<ChatbotAcademicMode>();
  public readonly modes = input.required<readonly ModeOption[]>();

  public readonly sessionSelected = output<string>();
  public readonly modeSelected = output<ChatbotAcademicMode>();
  public readonly newChatRequested = output<void>();
  public readonly clearHistoryRequested = output<void>();
}

