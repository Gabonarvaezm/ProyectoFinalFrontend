import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePostPayload } from '../models/foro.model';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-foro-create-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="modal-backdrop"
        (click)="onBackdropClick()"
        (keydown.escape)="onClose()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="modal-title-wrap">
              <div class="modal-icon">
                <i class="bi bi-pencil-square"></i>
              </div>
              <div>
                <h2 id="modal-title" class="modal-title">Nueva Publicación Académica</h2>
                <p class="modal-subtitle">
                  Comparte tu consulta para debate colaborativo con estudiantes y catedráticos.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="modal-close-btn"
              (click)="onClose()"
              aria-label="Cerrar ventana"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </header>

          <form [formGroup]="postForm" (ngSubmit)="onSubmit()" novalidate class="modal-body">
            <!-- Campo Título -->
            <div class="form-group">
              <label for="post-title" class="form-label">
                Título o Pregunta de la Discusión <span class="required-star">*</span>
              </label>
              <input
                type="text"
                id="post-title"
                formControlName="title"
                class="form-input"
                placeholder="Ej. ¿Cómo resuelvo integrales por partes?"
                [class.is-invalid]="postForm.get('title')?.invalid && postForm.get('title')?.touched"
                [attr.aria-invalid]="postForm.get('title')?.invalid && postForm.get('title')?.touched ? true : null"
                [attr.aria-describedby]="postForm.get('title')?.invalid && postForm.get('title')?.touched ? 'post-title-error' : null"
              />
              @if (postForm.get('title')?.invalid && postForm.get('title')?.touched) {
                <p id="post-title-error" class="form-error-msg" role="alert">
                  <i class="bi bi-exclamation-circle"></i>
                  El título debe tener entre 8 y 120 caracteres.
                </p>
              }
            </div>

            <!-- Campo Materia / Categoría -->
            <div class="form-group">
              <label for="post-subject" class="form-label">
                Materia o Disciplina Académica <span class="required-star">*</span>
              </label>
              <select id="post-subject" formControlName="subject" class="form-select">
                <option value="Matemáticas">Matemáticas</option>
                <option value="Ciencias">Ciencias</option>
                <option value="Historia">Historia</option>
                <option value="Lenguaje">Lenguaje</option>
                <option value="Tecnología">Tecnología</option>
              </select>
            </div>

            <!-- Campo Contenido Detallado -->
            <div class="form-group">
              <label for="post-content" class="form-label">
                Descripción detallada de la duda o problema <span class="required-star">*</span>
              </label>
              <textarea
                id="post-content"
                formControlName="content"
                class="form-textarea"
                rows="5"
                placeholder="Explica qué has intentado, tus premisas o las dudas puntuales..."
                [class.is-invalid]="postForm.get('content')?.invalid && postForm.get('content')?.touched"
                [attr.aria-invalid]="postForm.get('content')?.invalid && postForm.get('content')?.touched ? true : null"
                [attr.aria-describedby]="postForm.get('content')?.invalid && postForm.get('content')?.touched ? 'post-content-error' : null"
              ></textarea>
              @if (postForm.get('content')?.invalid && postForm.get('content')?.touched) {
                <p id="post-content-error" class="form-error-msg" role="alert">
                  <i class="bi bi-exclamation-circle"></i>
                  La descripción debe tener al menos 20 caracteres para aportar contexto académico suficiente.
                </p>
              }
            </div>

            <!-- Campo Referencia Bibliográfica -->
            <div class="form-group">
              <label for="post-reference" class="form-label">
                Referencia Bibliográfica / Texto de Consulta
              </label>
              <input
                type="text"
                id="post-reference"
                formControlName="academicReference"
                class="form-input"
                placeholder="Ej. Stewart, J. (2016). Cálculo Trascendentes Tempranas."
              />
              <span class="form-hint">
                Citar la bibliografía facilita a los profesores y compañeros validar la duda con precisión.
              </span>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                (click)="onClose()"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="postForm.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="spinner-sm"></span> Publicando...
                } @else {
                  <i class="bi bi-check-lg"></i> Publicar en el Foro
                }
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 100;
      animation: fadeIn 0.2s ease;
    }

    .modal-dialog {
      background-color: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 620px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.25);
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .modal-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background-color: #eff6ff;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem;
    }

    .modal-subtitle {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    .modal-close-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        color: #0f172a;
        background-color: #f1f5f9;
      }
    }

    .modal-body {
      padding: 1.5rem;
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

      .required-star {
        color: #ef4444;
      }
    }

    .form-input,
    .form-select,
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

    .form-textarea {
      resize: vertical;
      min-height: 90px;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #64748b;
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

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.85rem;
      padding-top: 1.25rem;
      border-top: 1px solid #e2e8f0;
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

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      background-color: transparent;
      color: #334155;
      font-size: 0.875rem;
      font-weight: 600;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f1f5f9;
        border-color: #cbd5e1;
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

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ForoCreateModalComponent {
  private readonly fb = inject(FormBuilder);

  public readonly isOpen = input<boolean>(false);
  public readonly defaultSubject = input<string>('Matemáticas');
  public readonly isSubmitting = input<boolean>(false);

  public readonly closeModal = output<void>();
  public readonly postSubmitted = output<CreatePostPayload>();

  public postForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]],
    subject: ['Matemáticas', [Validators.required]],
    content: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    academicReference: ['', [Validators.maxLength(250)]],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const subj = this.defaultSubject();
        this.postForm.reset({
          title: '',
          subject: subj !== 'All Subjects' ? subj : 'Matemáticas',
          content: '',
          academicReference: '',
        });
      }
    });
  }

  public onBackdropClick(): void {
    this.closeModal.emit();
  }

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const val = this.postForm.value;
    this.postSubmitted.emit({
      title: val.title.trim(),
      subject: val.subject,
      content: val.content.trim(),
      academicReference: val.academicReference?.trim() || undefined,
    });
  }
}

