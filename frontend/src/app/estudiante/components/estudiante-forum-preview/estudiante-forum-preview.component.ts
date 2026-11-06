import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ForumQuestion } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-forum-preview',
  standalone: true,
  templateUrl: './estudiante-forum-preview.component.html',
  styleUrl: './estudiante-forum-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudianteForumPreviewComponent {
  public readonly questions = input.required<readonly ForumQuestion[]>();
  public readonly brokenAvatars = input<Set<string>>(new Set());

  public readonly viewAllRequested = output<void>();
  public readonly viewThreadRequested = output<ForumQuestion>();
  public readonly avatarErrorOccurred = output<string>();

  public isAvatarBroken(id: string): boolean {
    return this.brokenAvatars().has(id);
  }
}

