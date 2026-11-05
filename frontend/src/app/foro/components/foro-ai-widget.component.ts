import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommunityAiSuggestion, RelatedTopic } from '../models/foro.model';

@Component({
  selector: 'app-foro-ai-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="widgets-column" aria-label="Asistente inteligente y recursos del foro">
      <!-- Tarjeta 1: Asistente de Comunidad - DiscerIA Context AI -->
      <section class="widget-card ai-assistant-widget">
        <div class="widget-header ai-header">
          <div class="ai-badge-icon">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <h3 class="widget-title">Asistente de Comunidad</h3>
            <span class="widget-subtitle">DiscerIA Context AI</span>
          </div>
        </div>

        <div class="ai-widget-content">
          <span class="ai-kicker">SUGERENCIAS DE RESPUESTAS</span>
          <div class="ai-suggestion-box">
            <p class="suggestion-text">
              {{ aiSuggestion().summary }}
            </p>
            <button
              type="button"
              class="ai-draft-link"
              (click)="onDraftClick()"
              aria-label="Insertar borrador de respuesta sugerido por IA"
            >
              <span>Insertar borrador</span>
              <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Tarjeta 2: Temas Relacionados (Related Topics) -->
      <section class="widget-card related-topics-widget">
        <div class="widget-header">
          <i class="bi bi-chat-left-dots widget-icon"></i>
          <h3 class="widget-title-sm">TEMAS RELACIONADOS</h3>
        </div>

        <ul class="related-list">
          @for (topic of relatedTopics(); track topic.id) {
            <li class="related-item">
              <button
                type="button"
                class="related-link-btn"
                (click)="onTopicClick(topic)"
              >
                <span class="related-title">{{ topic.title }}</span>
                <span class="related-meta">
                  {{ topic.subject }} • {{ topic.activeThreads }} hilos activos
                </span>
              </button>
            </li>
          }
        </ul>
      </section>

      <!-- Tarjeta 3: Normas de Etiqueta del Foro (Forum Etiquette) -->
      <section class="widget-card etiquette-widget">
        <div class="widget-header">
          <i class="bi bi-info-circle widget-icon"></i>
          <h3 class="widget-title-sm">NORMAS DEL FORO</h3>
        </div>

        <ul class="etiquette-list">
          @for (rule of etiquetteRules(); track rule) {
            <li class="etiquette-item">
              <i class="bi bi-check2-circle etiquette-check"></i>
              <span>{{ rule }}</span>
            </li>
          }
        </ul>
      </section>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      position: static;
      width: 340px;
      min-width: 300px;
      max-width: 360px;
      flex: 0 0 340px;
      margin: 0;
      padding: 0;
    }

    .widgets-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: static;
      width: 100%;
    }

    .widget-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    /* ── Tarjeta Asistente IA ── */
    .ai-assistant-widget {
      border-color: #c7d2fe;
      background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 40%);
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .ai-badge-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
    }

    .widget-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e1b4b;
      margin: 0;
      line-height: 1.2;
    }

    .widget-subtitle {
      font-size: 0.725rem;
      color: #6366f1;
      font-weight: 600;
    }

    .ai-kicker {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #4f46e5;
      margin-bottom: 0.5rem;
    }

    .ai-suggestion-box {
      background-color: #ffffff;
      border: 1px solid #e0e7ff;
      border-radius: 8px;
      padding: 0.85rem;
      box-shadow: 0 1px 2px rgba(79, 70, 229, 0.05);

      .suggestion-text {
        font-size: 0.825rem;
        line-height: 1.45;
        color: #334155;
        margin: 0 0 0.65rem;
      }
    }

    .ai-draft-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #4f46e5;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      transition: gap 0.2s ease, color 0.2s ease;

      &:hover {
        color: #3730a3;
        gap: 0.55rem;
        text-decoration: underline;
      }
    }

    /* ── Encabezado Estándar para Tarjetas 2 y 3 ── */
    .widget-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.85rem;

      .widget-icon {
        font-size: 0.95rem;
        color: #64748b;
      }

      .widget-title-sm {
        font-size: 0.725rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #64748b;
        margin: 0;
      }
    }

    /* ── Tarjeta Temas Relacionados ── */
    .related-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .related-item {
      .related-link-btn {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        padding: 0.5rem 0.6rem;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        transition: background-color 0.15s ease;

        &:hover {
          background-color: #f8fafc;

          .related-title {
            color: #2563eb;
          }
        }

        .related-title {
          font-size: 0.825rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.3;
          transition: color 0.15s ease;
        }

        .related-meta {
          font-size: 0.725rem;
          color: #94a3b8;
        }
      }
    }

    /* ── Tarjeta Normas de Etiqueta ── */
    .etiquette-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .etiquette-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: #334155;
      line-height: 1.45;

      .etiquette-check {
        color: #2563eb;
        font-size: 0.95rem;
        margin-top: 1px;
        flex-shrink: 0;
      }
    }
  `],
})
export class ForoAiWidgetComponent {
  public readonly aiSuggestion = input.required<CommunityAiSuggestion>();
  public readonly relatedTopics = input<readonly RelatedTopic[]>([]);
  public readonly etiquetteRules = input<readonly string[]>([
    'Cita siempre tus fuentes al proporcionar respuestas académicas.',
    'Verifica si ya existe una pregunta similar antes de publicar.',
    'Sé respetuoso y constructivo en tus comentarios.',
  ]);

  public readonly draftRequested = output<CommunityAiSuggestion>();
  public readonly topicSelected = output<RelatedTopic>();

  public onDraftClick(): void {
    this.draftRequested.emit(this.aiSuggestion());
  }

  public onTopicClick(topic: RelatedTopic): void {
    this.topicSelected.emit(topic);
  }
}
