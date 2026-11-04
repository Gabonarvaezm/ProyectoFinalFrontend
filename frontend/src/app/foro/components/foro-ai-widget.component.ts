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
          <span class="ai-kicker">SUGGESTIONS FOR ANSWERS</span>
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
              <span>Draft response</span>
              <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- Tarjeta 2: Temas Relacionados (Related Topics) -->
      <section class="widget-card related-topics-widget">
        <div class="widget-header">
          <i class="bi bi-chat-left-dots widget-icon"></i>
          <h3 class="widget-title-sm">RELATED TOPICS</h3>
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
                  {{ topic.subject }} • {{ topic.activeThreads }} active threads
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
          <h3 class="widget-title-sm">FORUM ETIQUETTE</h3>
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
    .widgets-column {
      width: 360px;
      min-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      @media (max-width: 1280px) {
        width: 100%;
        min-width: 100%;
      }
    }

    .widget-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.35rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    }

    .ai-assistant-widget {
      border-color: rgba(99, 102, 241, 0.25);
      background: linear-gradient(180deg, #ffffff 0%, #faf5ff 100%);
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.15rem;
    }

    .ai-badge-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
    }

    .widget-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }

    .widget-subtitle {
      font-size: 0.75rem;
      color: #4f46e5;
      font-weight: 600;
    }

    .ai-kicker {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 0.65rem;
    }

    .ai-suggestion-box {
      background-color: #ffffff;
      border: 1px solid rgba(99, 102, 241, 0.18);
      border-radius: 10px;
      padding: 1rem;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.05);

      .suggestion-text {
        font-size: 0.85rem;
        color: #334155;
        line-height: 1.5;
        margin: 0 0 0.85rem;
      }
    }

    .ai-draft-link {
      background: transparent;
      border: none;
      color: #1d4ed8;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0;
      transition: all 0.2s ease;

      &:hover {
        color: #1e40af;
        gap: 0.5rem;
      }
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .widget-icon {
        color: #94a3b8;
        font-size: 1rem;
      }
    }

    .widget-title-sm {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #94a3b8;
      text-transform: uppercase;
      margin: 0;
    }

    .related-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .related-item {
      width: 100%;
    }

    .related-link-btn {
      width: 100%;
      text-align: left;
      background-color: #f1f5f9;
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 0.75rem 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      &:hover {
        background-color: #ffffff;
        border-color: #e2e8f0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);

        .related-title {
          color: #1d4ed8;
        }
      }
    }

    .related-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
      transition: color 0.2s ease;
    }

    .related-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

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
    'Always cite your sources when providing academic answers.',
    'Check if a similar question has been asked before posting.',
    'Be respectful and constructive in your critiques.',
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

