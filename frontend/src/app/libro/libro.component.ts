import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BOOK_FORMATS,
  BookCategory,
  BookFormat,
  CategoryFilter,
  CreateBookDto,
} from '../biblioteca/models/book.model';
import { CATEGORIES } from '../biblioteca/data/books.data';

@Component({
  selector: 'app-libro',
  imports: [ReactiveFormsModule],
  templateUrl: './libro.component.html',
  styleUrl: './libro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibroComponent {
  private readonly fb = inject(FormBuilder);

  // ── Constantes de UI ─────────────────────────────────────────────────────
  public readonly currentYear = new Date().getFullYear();
  public readonly availableFormats = BOOK_FORMATS;

  // ── Inputs del Padre ─────────────────────────────────────────────────────
  /** Controla la visibilidad del modal */
  public readonly isOpen = input.required<boolean>();
  /** Estado de envío para deshabilitar el botón mientras se procesa */
  public readonly isSubmitting = input<boolean>(false);
  /** Categorías dinámicas provenientes del catálogo padre */
  public readonly categories = input<readonly CategoryFilter[]>(CATEGORIES);
  /** Institución del docente autenticado */
  public readonly userInstitution = input<string>('');

  // ── Outputs hacia el Padre ────────────────────────────────────────────────
  /** Notifica al padre para cerrar el modal */
  public readonly closeModal = output<void>();
  /** Emite el DTO validado para que el padre lo persista */
  public readonly bookCreated = output<CreateBookDto>();

  // ── Categorías filtradas (sin "all" para el select de creación) ──────────
  public readonly selectableCategories = computed(() =>
    this.categories().filter((c) => c.id !== 'all')
  );

  // ── Formulario Reactivo Tipado ────────────────────────────────────────────
  public readonly bookForm: FormGroup = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(150)],
    ],
    author: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    category: ['ciencias' as BookCategory, [Validators.required]],
    format: ['PDF' as BookFormat, [Validators.required]],
    description: [
      '',
      [Validators.required, Validators.minLength(15), Validators.maxLength(800)],
    ],
    pages: [
      '',
      [
        Validators.required,
        Validators.min(1),
        Validators.max(5000),
        Validators.pattern(/^[0-9]+$/),
      ],
    ],
    year: [
      new Date().getFullYear(),
      [
        Validators.required,
        Validators.min(1900),
        Validators.max(new Date().getFullYear() + 1),
      ],
    ],
    tags: ['', [Validators.required, Validators.minLength(2)]],
    coverImage: [''],
  });

  constructor() {
    // Resetea el formulario limpiamente cada vez que el modal se abre
    effect(() => {
      if (this.isOpen()) {
        this.bookForm.reset({
          title: '',
          author: '',
          category: 'ciencias' as BookCategory,
          format: 'PDF' as BookFormat,
          description: '',
          pages: '',
          year: this.currentYear,
          tags: '',
          coverImage: '',
        });
      }
    });
  }

  // ── Helpers de validación para el template ────────────────────────────────

  public isFieldInvalid(field: string): boolean {
    const ctrl = this.bookForm.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  public getDescriptionLength(): number {
    return this.bookForm.get('description')?.value?.length ?? 0;
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  public onClose(): void {
    this.closeModal.emit();
  }

  public onSubmit(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }

    const raw = this.bookForm.value;

    const dto: CreateBookDto = {
      title: raw.title.trim(),
      author: raw.author.trim(),
      category: raw.category as BookCategory,
      format: raw.format as BookFormat,
      description: raw.description.trim(),
      pages: Number(raw.pages),
      year: Number(raw.year),
      tags: (raw.tags as string)
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0),
      coverImage: raw.coverImage?.trim() || '',
      institution: this.userInstitution() || 'Comunidad Docente DiscerIA',
    };

    this.bookCreated.emit(dto);
  }
}

