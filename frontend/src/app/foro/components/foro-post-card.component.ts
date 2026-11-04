import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateReplyPayload,
  ForumAuthor,
  ForumPost,
  ForumReply,
  UserRole,
} from '../models/foro.model';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-foro-post-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="post-card" [class.expanded]="isExpanded()">
      <!-- Cabecera de la Publicación -->
      <div class="post-header">
        <div class="post-author-wrap">
          @if (post().author.avatar) {
            <img
              [src]="post().author.avatar"
              [alt]="post().author.name"
              class="author-avatar"
            />
          } @else {
            <div class="author-avatar-fallback">
              <i class="bi bi-person"></i>
            </div>
          }
          <div class="author-meta">
            <span class="author-name">{{ post().author.name }}</span>
            <span class="meta-separator">•</span>
            <span class="post-time">{{ post().createdAt }}</span>
          </div>
        </div>

        <div class="post-badges">
          <span class="subject-tag" [attr.data-subject]="post().subject">
            {{ post().subject }}
          </span>

          @if (post().isTeacherVerified) {
            <span class="badge-teacher-verified" title="Esta respuesta contiene verificación de un profesor">
              <i class="bi bi-patch-check-fill"></i>
              <span>Teacher Verified</span>
            </span>
          }

          @if (post().isUnanswered) {
            <span class="badge-unanswered" title="Aún no cuenta con una solución validada">
              Unanswered
            </span>
          }
        </div>
      </div>

      <!-- Título y Contenido de la Duda -->
      <div class="post-body">
        <h2 class="post-title">
          <button
            type="button"
            class="post-title-btn"
            (click)="onToggleExpand()"
            [attr.aria-expanded]="isExpanded()"
          >
            {{ post().title }}
          </button>
        </h2>
        <p class="post-excerpt">{{ post().content }}</p>

        @if (post().academicReference) {
          <div class="academic-cite-box">
            <i class="bi bi-journal-bookmark-fill cite-icon"></i>
            <span class="cite-text">
              <strong>Referencia sugerida:</strong> {{ post().academicReference }}
            </span>
          </div>
        }
      </div>

      <!-- Barra Inferior de Métricas e Interacciones -->
      <footer class="post-footer">
        <div class="footer-left">
          <!-- Botón Respuestas -->
          <button
            type="button"
            class="stat-action-btn"
            [class.active]="isExpanded()"
            (click)="onToggleExpand()"
            aria-label="Ver respuestas del tema"
            [attr.aria-expanded]="isExpanded()"
          >
            <i class="bi bi-chat-left-text"></i>
            <span>{{ post().repliesCount }} respuestas</span>
          </button>

          <!-- Botón Helpful / Útil -->
          <button
            type="button"
            class="stat-action-btn"
            [class.active-helpful]="post().userHasVotedHelpful"
            (click)="onHelpfulClick()"
            aria-label="Marcar como útil"
          >
            <i [class]="post().userHasVotedHelpful ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up'"></i>
            <span>{{ post().helpfulCount }} helpful</span>
          </button>
        </div>

        <div class="footer-right">
          <span class="views-stat" title="Número de lecturas">
            <i class="bi bi-eye"></i>
            <span>{{ post().viewsCount }} views</span>
          </span>
        </div>
      </footer>

      <!-- ── HILO EXPANDIDO DE RESPUESTAS & FORMULARIO REACTIVO ── -->
      @if (isExpanded()) {
        <div class="thread-expanded-container">
          <!-- Lista de Respuestas Académicas Existentes -->
          <div class="replies-section">
            <h3 class="replies-title">
              Respuestas Académicas ({{ post().replies.length }})
            </h3>

            @if (post().replies.length === 0) {
              <p class="no-replies-msg">
                Aún no hay respuestas en esta discusión. Sé el primero en contribuir académicamente.
              </p>
            }

            @for (reply of post().replies; track reply.id) {
              <div class="reply-card" [class.reply-verified]="reply.isTeacherVerified">
                <div class="reply-header">
                  <div class="reply-author-info">
                    @if (reply.author.avatar) {
                      <img
                        [src]="reply.author.avatar"
                        [alt]="reply.author.name"
                        class="reply-avatar"
                      />
                    } @else {
                      <div class="reply-avatar-initials">{{ reply.author.initials }}</div>
                    }
                    <div>
                      <div class="reply-name-row">
                        <span class="reply-author-name">{{ reply.author.name }}</span>
                        @if (reply.author.role === 'professor') {
                          <span class="docente-tag">Docente</span>
                        }
                      </div>
                      <span class="reply-time">{{ reply.createdAt }} • {{ reply.author.institution }}</span>
                    </div>
                  </div>

                  @if (reply.isTeacherVerified) {
                    <div class="verified-stamp">
                      <i class="bi bi-patch-check-fill"></i> Solución Verificada
                    </div>
                  }
                </div>

                <div class="reply-body">
                  <p>{{ reply.content }}</p>
                  @if (reply.academicReference) {
                    <div class="reply-reference">
                      <i class="bi bi-quote"></i>
                      <span>{{ reply.academicReference }}</span>
                    </div>
                  }
                </div>

                <div class="reply-footer">
                  <button
                    type="button"
                    class="reply-helpful-btn"
                    [class.active]="reply.userHasVotedHelpful"
                    (click)="onReplyHelpfulClick(reply)"
                  >
                    <i [class]="reply.userHasVotedHelpful ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up'"></i>
                    <span>{{ reply.helpfulCount }} útil</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Formulario Reactivo para Responder a la Discusión -->
          <form
            [formGroup]="replyForm"
            (ngSubmit)="onReplySubmit()"
            class="reply-form"
            novalidate
          >
            <h4 class="reply-form-title">
              <i class="bi bi-pencil-square"></i>
              <span>Agregar tu Aporte Académico</span>
            </h4>

            <!-- Campo Contenido de la Respuesta -->
            <div class="form-group">
              <label [for]="'reply-content-' + post().id" class="form-label">
                Tu explicación o demostración
              </label>
              <textarea
                [id]="'reply-content-' + post().id"
                formControlName="content"
                class="form-textarea"
                rows="4"
                placeholder="Escribe una respuesta académica rigurosa, clara y justificada..."
                [class.is-invalid]="replyForm.get('content')?.invalid && replyForm.get('content')?.touched"
                [attr.aria-invalid]="replyForm.get('content')?.invalid && replyForm.get('content')?.touched ? true : null"
                [attr.aria-describedby]="replyForm.get('content')?.invalid && replyForm.get('content')?.touched ? ('reply-content-error-' + post().id) : null"
              ></textarea>

              @if (replyForm.get('content')?.invalid && replyForm.get('content')?.touched) {
                <p [id]="'reply-content-error-' + post().id" class="form-error-msg" role="alert">
                  <i class="bi bi-exclamation-circle"></i>
                  La respuesta debe tener al menos 10 caracteres.
                </p>
              }
            </div>

            <!-- Campo Referencia Académica Opcional -->
            <div class="form-group">
              <label [for]="'reply-reference-' + post().id" class="form-label">
                Cita bibliográfica o fuente académica (Opcional recomendado)
              </label>
              <input
                type="text"
                [id]="'reply-reference-' + post().id"
                formControlName="academicReference"
                class="form-input"
                placeholder="Ej. Stewart, J. Cálculo Trascendentes Tempranas, Cap. 7"
              />
            </div>

            <!-- Opción exclusiva para Docentes: Certificar Respuesta -->
            @if (currentRole() === 'professor') {
              <div class="form-checkbox-group">
                <label class="checkbox-label" [for]="'reply-verified-' + post().id">
                  <input
                    type="checkbox"
                    [id]="'reply-verified-' + post().id"
                    formControlName="markAsTeacherVerified"
                    class="custom-checkbox"
                  />
                  <span class="checkbox-text">
                    <strong>Certificar como Solución Oficial (Teacher Verified)</strong>
                    <small>Otorga credencial de validación docente a esta solución</small>
                  </span>
                </label>
              </div>
            }

            <!-- Botón Enviar Respuesta -->
            <div class="reply-form-actions">
              <button
                type="submit"
                class="btn-primary"
                [disabled]="replyForm.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="spinner-sm"></span> Publicando...
                } @else {
                  <i class="bi bi-send-fill"></i> Publicar Respuesta
                }
              </button>
            </div>
          </form>
        </div>
      }
    </article>
  `,
  styles: [`
    .post-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        box-shadow: 0 10px 20px -3px rgba(15, 23, 42, 0.08);
        border-color: #cbd5e1;
      }

      &.expanded {
        border-color: #2563eb;
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
      }
    }

    .post-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
    }

    .post-author-wrap {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .author-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }

    .author-avatar-fallback {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .author-meta {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
    }

    .author-name {
      font-weight: 600;
      color: #0f172a;
    }

    .meta-separator {
      color: #94a3b8;
    }

    .post-time {
      color: #64748b;
    }

    .post-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .subject-tag {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #eff6ff;
      color: #1d4ed8;

      &[data-subject="Matemáticas"] {
        background-color: #e0e7ff;
        color: #4338ca;
      }
      &[data-subject="Historia"] {
        background-color: #fef3c7;
        color: #b45309;
      }
      &[data-subject="Ciencias"] {
        background-color: #dcfce7;
        color: #15803d;
      }
      &[data-subject="Lenguaje"] {
        background-color: #ffe4e6;
        color: #be123c;
      }
      &[data-subject="Tecnología"] {
        background-color: #e0f2fe;
        color: #0369a1;
      }
    }

    .badge-teacher-verified {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #fef9c3;
      color: #a16207;
      border: 1px solid #fef08a;

      i {
        color: #eab308;
        font-size: 0.85rem;
      }
    }

    .badge-unanswered {
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .post-body {
      margin-bottom: 1.15rem;

      .post-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.5rem;
        line-height: 1.35;
      }

      .post-title-btn {
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: color 0.2s ease;

        &:hover {
          color: #1d4ed8;
        }

        &:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 3px;
          border-radius: 4px;
        }
      }

      .post-excerpt {
        font-size: 0.925rem;
        color: #334155;
        line-height: 1.6;
        margin: 0;
      }
    }

    .academic-cite-box {
      margin-top: 0.75rem;
      padding: 0.6rem 0.85rem;
      background-color: #f1f5f9;
      border-left: 3px solid #2563eb;
      border-radius: 0 6px 6px 0;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: #64748b;

      .cite-icon {
        color: #1d4ed8;
        font-size: 0.95rem;
        margin-top: 1px;
      }

      strong {
        color: #0f172a;
      }
    }

    .post-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .stat-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: transparent;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      transition: all 0.2s ease;

      i {
        font-size: 1.05rem;
      }

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }

      &.active {
        background-color: #eff6ff;
        color: #1d4ed8;
        font-weight: 600;
      }

      &.active-helpful {
        color: #1d4ed8;
        font-weight: 600;

        i {
          color: #1d4ed8;
          transform: scale(1.1);
        }
      }
    }

    .footer-right {
      .views-stat {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: #94a3b8;

        i {
          font-size: 1rem;
        }
      }
    }

    .thread-expanded-container {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px dashed #e2e8f0;
      animation: fadeIn 0.3s ease;
    }

    .replies-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;

      .replies-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
    }

    .no-replies-msg {
      font-size: 0.9rem;
      color: #64748b;
      background-color: #f1f5f9;
      padding: 1rem;
      border-radius: 10px;
      text-align: center;
      margin: 0;
    }

    .reply-card {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.15rem;

      &.reply-verified {
        background-color: #fefce8;
        border-color: #fef08a;
      }
    }

    .reply-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .reply-author-info {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .reply-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .reply-avatar-initials {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #1d4ed8;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .reply-name-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .reply-author-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
    }

    .docente-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      background-color: #e0e7ff;
      color: #4338ca;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    .reply-time {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }

    .verified-stamp {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #a16207;

      i {
        color: #eab308;
      }
    }

    .reply-body {
      p {
        margin: 0;
        font-size: 0.9rem;
        color: #334155;
        line-height: 1.55;
      }

      .reply-reference {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        font-style: italic;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
    }

    .reply-footer {
      margin-top: 0.65rem;
      display: flex;
      justify-content: flex-end;
    }

    .reply-helpful-btn {
      background: transparent;
      border: none;
      font-size: 0.8rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(15, 23, 42, 0.05);
        color: #0f172a;
      }

      &.active {
        color: #1d4ed8;
        font-weight: 600;
      }
    }

    .reply-form {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem;

      .reply-form-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 1rem;

        i {
          color: #1d4ed8;
        }
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.15rem;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;

      &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
      }

      &.is-invalid {
        border-color: #ef4444;
        background-color: #fef2f2;
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .form-error-msg {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.785rem;
      color: #dc2626;
      margin: 0;
      font-weight: 500;
    }

    .form-checkbox-group {
      margin: 1rem 0;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      cursor: pointer;
      user-select: none;

      .custom-checkbox {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        accent-color: #1d4ed8;
        cursor: pointer;
      }

      .checkbox-text {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 0.85rem;
          color: #0f172a;
        }

        small {
          font-size: 0.75rem;
          color: #64748b;
        }
      }
    }

    .reply-form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      background-color: #1d4ed8;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background-color: #1e40af;
        box-shadow: 0 4px 10px rgba(29, 78, 216, 0.25);
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ForoPostCardComponent {
  private readonly fb = inject(FormBuilder);

  public readonly post = input.required<ForumPost>();
  public readonly isExpanded = input<boolean>(false);
  public readonly currentRole = input.required<UserRole>();
  public readonly currentUser = input.required<ForumAuthor>();
  public readonly draftContent = input<string>('');

  public readonly toggleExpand = output<string>();
  public readonly helpfulVote = output<ForumPost>();
  public readonly replyHelpfulVote = output<ForumReply>();
  public readonly replySubmit = output<CreateReplyPayload>();

  public readonly isSubmitting = signal<boolean>(false);

  public replyForm: FormGroup = this.fb.group({
    content: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(1500)],
    ],
    academicReference: ['', [Validators.maxLength(250)]],
    markAsTeacherVerified: [false],
  });

  constructor() {
    // Escucha cambios reactivos del draft inyectado desde el Asistente AI
    effect(() => {
      const draft = this.draftContent();
      if (draft && this.isExpanded()) {
        this.replyForm.patchValue({
          content: draft,
          academicReference: 'Recomendación Contextual DiscerIA AI',
        });
      }
    });
  }

  public onToggleExpand(): void {
    this.toggleExpand.emit(this.post().id);
  }

  public onHelpfulClick(): void {
    this.helpfulVote.emit(this.post());
  }

  public onReplyHelpfulClick(reply: ForumReply): void {
    this.replyHelpfulVote.emit(reply);
  }

  public onReplySubmit(): void {
    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.replyForm.value;
    const isTeacher = this.currentRole() === 'professor';

    this.replySubmit.emit({
      postId: this.post().id,
      content: val.content.trim(),
      academicReference: val.academicReference?.trim() || undefined,
      isTeacherVerified: isTeacher && !!val.markAsTeacherVerified,
    });

    this.replyForm.reset({
      content: '',
      academicReference: '',
      markAsTeacherVerified: this.currentRole() === 'professor',
    });
    this.isSubmitting.set(false);
  }
}

