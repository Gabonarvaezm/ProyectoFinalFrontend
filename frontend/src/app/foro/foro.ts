import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import {
  CommunityAiSuggestion,
  ForumAuthor,
  ForumPost,
  ForumReply,
  RelatedTopic,
  UserRole,
} from './models/foro.model';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-foro',
  styleUrl: './foro.scss',
  templateUrl: './foro.html',
})
export class Foro {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // ── Navegación Lateral ───────────────────────────────────────────────────
  public readonly activeNav = signal<string>('foros');
  public readonly navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill', route: '/estudiante' },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book', route: '/biblioteca' },
    { id: 'asistente-ia', label: 'Asistente IA', icon: 'bi bi-robot', route: '/estudiante' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text-fill', route: '/foro' },
    { id: 'progreso', label: 'Progreso', icon: 'bi bi-bar-chart', route: '/estudiante' },
    { id: 'perfil', label: 'Perfil', icon: 'bi bi-person-circle', route: '/estudiante' },
  ];

  // ── Usuario y Rol Activo ──────────────────────────────────────────────────
  public readonly currentRole = signal<UserRole>('student');
  public readonly currentUser = computed<ForumAuthor>(() => {
    const authUser = this.authService.currentUser();
    if (this.currentRole() === 'professor') {
      return {
        id: 'prof-carlos',
        name: authUser?.role === 'professor' ? authUser.fullName : 'Prof. Carlos Mendoza',
        role: 'professor',
        roleTitle: 'Docente Titular de Ciencias',
        institution: authUser?.institution || 'Universidad Tecnológica Pública',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        initials: 'CM',
      };
    }
    return {
      id: 'student-alejandro',
      name: authUser?.fullName || 'Alejandro Silva',
      role: 'student',
      roleTitle: 'Estudiante Académico',
      institution: authUser?.institution || 'Institución Pública Nacional',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      initials: 'AS',
    };
  });

  // ── Filtros y Búsqueda ───────────────────────────────────────────────────
  public readonly searchQuery = signal<string>('');
  public readonly selectedSubject = signal<string>('All Subjects');
  public readonly subjects = signal<string[]>([
    'All Subjects',
    'Matemáticas',
    'Ciencias',
    'Historia',
    'Lenguaje',
    'Tecnología',
  ]);

  // ── Estado de Interfaz y Modales ─────────────────────────────────────────
  public readonly isCreateModalOpen = signal<boolean>(false);
  public readonly activeExpandedPostId = signal<string | null>('post-1');
  public readonly toastMessage = signal<string | null>(null);
  public readonly isSubmittingPost = signal<boolean>(false);
  public readonly isSubmittingReply = signal<boolean>(false);

  // ── Sugerencia de Inteligencia Artificial (DiscerIA Context AI) ───────────
  public readonly aiSuggestion = signal<CommunityAiSuggestion>({
    postId: 'post-1',
    postTitle: '¿Cómo resuelvo integrales por partes?',
    summary:
      'For the "Integrales por partes" question, consider recommending the LIATE rule (Logarithmic, Inverse trig, Algebraic, Trig, Exponential) as a mnemonic for choosing \'u\'.',
    draftResponse:
      'Para resolver integrales por partes de forma sistemática utiliza la regla mnemotécnica LIATE:\n1. Logarítmicas (L)\n2. Inversas trigonométricas (I)\n3. Algebraicas (A)\n4. Trigonométricas (T)\n5. Exponenciales (E)\n\nElige como "u" la función que aparezca primero en esta lista y como "dv" el resto. Luego aplica la fórmula: ∫u dv = u*v - ∫v du.',
    referenceMnemonic: 'LIATE',
  });

  // ── Temas Relacionados ───────────────────────────────────────────────────
  public readonly relatedTopics = signal<RelatedTopic[]>([
    {
      id: 'rel-1',
      title: 'Técnicas de Integración Avanzadas',
      subject: 'Matemáticas',
      activeThreads: 34,
    },
    {
      id: 'rel-2',
      title: 'Renacimiento vs Barroco',
      subject: 'Historia',
      activeThreads: 12,
    },
    {
      id: 'rel-3',
      title: 'Regulación del Ciclo Celular y Mitosis',
      subject: 'Ciencias',
      activeThreads: 19,
    },
  ]);

  // ── Normas del Foro Académico (Forum Etiquette) ───────────────────────────
  public readonly forumEtiquette = [
    'Always cite your sources when providing academic answers.',
    'Check if a similar question has been asked before posting.',
    'Be respectful and constructive in your critiques.',
  ];

  // ── Lista Principal de Publicaciones del Foro ────────────────────────────
  public readonly posts = signal<ForumPost[]>([
    {
      id: 'post-1',
      title: '¿Cómo resuelvo integrales por partes?',
      content:
        'Tengo dificultades eligiendo adecuadamente qué término asignar como "u" y cuál como "dv" cuando combino funciones algebraicas con funciones trigonométricas o exponenciales. ¿Existe alguna regla o recomendación estándar para no iterar indefinidamente?',
      author: {
        id: 'user-ana',
        name: 'Ana Silva',
        role: 'student',
        institution: 'Facultad de Ciencias Básicas',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        initials: 'AS',
      },
      subject: 'Matemáticas',
      createdAt: '2 hours ago',
      isTeacherVerified: true,
      isUnanswered: false,
      helpfulCount: 24,
      userHasVotedHelpful: false,
      viewsCount: 156,
      repliesCount: 12,
      academicReference: 'Stewart, J. (2016). Cálculo de una variable: Trascendentes tempranas (8va ed.). Cengage Learning.',
      replies: [
        {
          id: 'rep-1',
          postId: 'post-1',
          author: {
            id: 'prof-rodriguez',
            name: 'Prof. Alexis Rodríguez',
            role: 'professor',
            roleTitle: 'Catedrático de Matemáticas',
            institution: 'Universidad Nacional Pública',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
            initials: 'AR',
          },
          content:
            'Excelente consulta, Ana. La regla estándar en el análisis de cálculo es **LIATE** (Logarítmicas, Inversas trigonométricas, Algebraicas, Trigonométricas, Exponenciales). La que aparezca más arriba en el acrónimo debe ser seleccionada como "u", facilitando que al derivarla se simplifique la expresión restante.',
          createdAt: '1 hour ago',
          helpfulCount: 18,
          userHasVotedHelpful: false,
          isTeacherVerified: true,
          academicReference: 'Larson, R., & Edwards, B. H. (2018). Cálculo (10ma ed.). McGraw-Hill.',
        },
      ],
    },
    {
      id: 'post-2',
      title: 'Duda sobre el Barroco y sus influencias arquitectónicas',
      content:
        'Al analizar la transición del Renacimiento tardío al Barroco, ¿cuáles fueron los factores teológicos y políticos determinantes que promovieron el uso del claroscuro y las plantas elípticas en los templos del siglo XVII?',
      author: {
        id: 'user-carlos-m',
        name: 'Carlos Mendoza',
        role: 'student',
        institution: 'Escuela de Humanidades y Artes',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
        initials: 'CM',
      },
      subject: 'Historia',
      createdAt: '5 hours ago',
      isTeacherVerified: false,
      isUnanswered: false,
      helpfulCount: 8,
      userHasVotedHelpful: false,
      viewsCount: 42,
      repliesCount: 5,
      academicReference: 'Gombrich, E. H. (1995). La historia del arte. Phaidon Press.',
      replies: [
        {
          id: 'rep-2',
          postId: 'post-2',
          author: {
            id: 'prof-marta',
            name: 'Dra. Marta Valenzuela',
            role: 'professor',
            institution: 'Instituto de Investigaciones Históricas',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
            initials: 'MV',
          },
          content:
            'El Concilio de Trento (Contrarreforma) fue el catalizador principal: la Iglesia Católica buscó emocionar e impresionar a los fieles mediante la teatralidad y el dinamismo lumínico frente a la sobriedad protestante.',
          createdAt: '3 hours ago',
          helpfulCount: 6,
          userHasVotedHelpful: false,
          isTeacherVerified: false,
          academicReference: 'Bazin, G. (1968). El Barroco. Destino.',
        },
      ],
    },
    {
      id: 'post-3',
      title: 'Impacto de la Mitosis en la salud celular a largo plazo',
      content:
        '¿Cómo influye el acortamiento de los telómeros durante sucesivas divisiones mitóticas en la senescencia celular y qué mecanismos intrínsecos activan la apoptosis antes de que ocurra una transformación oncogénica?',
      author: {
        id: 'user-elena',
        name: 'Elena Rojas',
        role: 'student',
        institution: 'Facultad de Ciencias de la Salud',
        avatar: '',
        initials: 'ER',
      },
      subject: 'Ciencias',
      createdAt: '1 day ago',
      isTeacherVerified: false,
      isUnanswered: true,
      helpfulCount: 3,
      userHasVotedHelpful: false,
      viewsCount: 89,
      repliesCount: 2,
      academicReference: 'Alberts, B., et al. (2015). Molecular Biology of the Cell (6th ed.). Garland Science.',
      replies: [],
    },
  ]);

  // ── Formularios Reactivos con Validaciones Rigurosas ──────────────────────
  public postForm: FormGroup = this.fb.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(120),
      ],
    ],
    subject: ['Matemáticas', [Validators.required]],
    content: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(2000),
      ],
    ],
    academicReference: ['', [Validators.maxLength(250)]],
  });

  public replyForm: FormGroup = this.fb.group({
    content: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1500),
      ],
    ],
    academicReference: ['', [Validators.maxLength(250)]],
    markAsTeacherVerified: [false],
  });

  // ── Publicaciones Filtradas por Buscador y Materia ────────────────────────
  public readonly filteredPosts = computed<ForumPost[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const currentSubject = this.selectedSubject();
    const allPosts = this.posts();

    return allPosts.filter((post) => {
      const matchesSubject =
        currentSubject === 'All Subjects' || post.subject === currentSubject;

      const matchesSearch =
        query === '' ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        post.subject.toLowerCase().includes(query);

      return matchesSubject && matchesSearch;
    });
  });

  // ── Métodos de Interacción del Foro ───────────────────────────────────────

  public onSelectSubject(subject: string): void {
    this.selectedSubject.set(subject);
  }

  public onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  public toggleRole(): void {
    const nextRole: UserRole = this.currentRole() === 'student' ? 'professor' : 'student';
    this.currentRole.set(nextRole);
    this.showToast(
      nextRole === 'professor'
        ? 'Cambiaste a Modo Docente (Puedes certificar respuestas con Teacher Verified)'
        : 'Cambiaste a Modo Estudiante'
    );
  }

  public openCreateModal(): void {
    this.postForm.reset({
      title: '',
      subject: this.selectedSubject() !== 'All Subjects' ? this.selectedSubject() : 'Matemáticas',
      content: '',
      academicReference: '',
    });
    this.isCreateModalOpen.set(true);
  }

  public closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  public toggleExpandPost(postId: string): void {
    this.activeExpandedPostId.update((current) => (current === postId ? null : postId));
    // Resetear formulario de respuesta para el hilo
    this.replyForm.reset({
      content: '',
      academicReference: '',
      markAsTeacherVerified: this.currentRole() === 'professor',
    });
  }

  public toggleHelpful(post: ForumPost): void {
    this.posts.update((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id === post.id) {
          const wasVoted = !!p.userHasVotedHelpful;
          return {
            ...p,
            userHasVotedHelpful: !wasVoted,
            helpfulCount: wasVoted ? Math.max(0, p.helpfulCount - 1) : p.helpfulCount + 1,
          };
        }
        return p;
      })
    );
  }

  public toggleReplyHelpful(reply: ForumReply): void {
    this.posts.update((currentPosts) =>
      currentPosts.map((post) => {
        const updatedReplies = post.replies.map((r) => {
          if (r.id === reply.id) {
            const wasVoted = !!r.userHasVotedHelpful;
            return {
              ...r,
              userHasVotedHelpful: !wasVoted,
              helpfulCount: wasVoted ? Math.max(0, r.helpfulCount - 1) : r.helpfulCount + 1,
            };
          }
          return r;
        });
        return { ...post, replies: updatedReplies };
      })
    );
  }

  public submitNewPost(): void {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.isSubmittingPost.set(true);
    const formVal = this.postForm.value;
    const author = this.currentUser();

    setTimeout(() => {
      const newPost: ForumPost = {
        id: `post-${Date.now()}`,
        title: formVal.title.trim(),
        content: formVal.content.trim(),
        subject: formVal.subject,
        author: {
          id: author.id,
          name: author.name,
          role: author.role,
          roleTitle: author.roleTitle,
          institution: author.institution,
          avatar: author.avatar,
          initials: author.initials,
        },
        createdAt: 'Just now',
        isTeacherVerified: author.role === 'professor',
        isUnanswered: true,
        helpfulCount: 0,
        userHasVotedHelpful: false,
        viewsCount: 1,
        repliesCount: 0,
        academicReference: formVal.academicReference?.trim() || undefined,
        replies: [],
      };

      this.posts.update((list) => [newPost, ...list]);
      this.isSubmittingPost.set(false);
      this.closeCreateModal();
      this.activeExpandedPostId.set(newPost.id);
      this.showToast('¡Tu publicación académica fue creada con éxito!');
    }, 400);
  }

  public submitReply(postId: string): void {
    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.isSubmittingReply.set(true);
    const replyVal = this.replyForm.value;
    const author = this.currentUser();
    const isTeacherVerified = author.role === 'professor' && !!replyVal.markAsTeacherVerified;

    setTimeout(() => {
      const newReply: ForumReply = {
        id: `reply-${Date.now()}`,
        postId,
        author: {
          id: author.id,
          name: author.name,
          role: author.role,
          roleTitle: author.roleTitle,
          institution: author.institution,
          avatar: author.avatar,
          initials: author.initials,
        },
        content: replyVal.content.trim(),
        createdAt: 'Just now',
        helpfulCount: 0,
        userHasVotedHelpful: false,
        isTeacherVerified,
        academicReference: replyVal.academicReference?.trim() || undefined,
      };

      this.posts.update((list) =>
        list.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              repliesCount: post.repliesCount + 1,
              isUnanswered: false,
              isTeacherVerified: post.isTeacherVerified || isTeacherVerified,
              replies: [...post.replies, newReply],
            };
          }
          return post;
        })
      );

      this.replyForm.reset({
        content: '',
        academicReference: '',
        markAsTeacherVerified: this.currentRole() === 'professor',
      });
      this.isSubmittingReply.set(false);
      this.showToast(
        isTeacherVerified
          ? 'Respuesta agregada y verificada como respuesta docente oficial.'
          : 'Respuesta académica publicada con éxito.'
      );
    }, 350);
  }

  public applyAiDraftResponse(): void {
    const draft = this.aiSuggestion().draftResponse;
    const targetPostId = this.aiSuggestion().postId;

    this.activeExpandedPostId.set(targetPostId);
    this.replyForm.patchValue({
      content: draft,
      academicReference: 'Método LIATE - Cálculo Integral y Diferencial.',
    });

    this.showToast('Respuesta sugerida por DiscerIA Context AI insertada en el borrador.');
  }

  public filterByRelatedTopic(topic: RelatedTopic): void {
    this.selectedSubject.set(topic.subject);
    this.searchQuery.set(topic.title);
    this.showToast(`Filtrando discusiones sobre "${topic.title}"`);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}
