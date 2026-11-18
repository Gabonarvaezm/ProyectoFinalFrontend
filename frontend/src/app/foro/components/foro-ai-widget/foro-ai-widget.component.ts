import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommunityAiSuggestion, RelatedTopic } from '../../models/foro.model';

@Component({
  selector: 'app-foro-ai-widget',
  templateUrl: './foro-ai-widget.component.html',
  styleUrl: './foro-ai-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

