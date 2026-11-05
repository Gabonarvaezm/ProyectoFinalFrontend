import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import {
  ForoAiWidgetComponent,
  ForoCreateModalComponent,
  ForoFiltersComponent,
  ForoHeaderComponent,
  ForoPostCardComponent,
} from './components';
import {
  CommunityAiSuggestion,
  CreatePostPayload,
  CreateReplyPayload,
  ForoFilterPayload,
  ForumAuthor,
  ForumPost,
  ForumReply,
  RelatedTopic,
  UserRole,
} from './models/foro.model';
import {
  FORUM_ETIQUETTE_RULES,
  INITIAL_AI_SUGGESTION,
  INITIAL_FORUM_POSTS,
  INITIAL_RELATED_TOPICS,
} from './data/foro.data';

@Component({
  imports: [
    RouterLink,
    ForoHeaderComponent,
    ForoFiltersComponent,
    ForoPostCardComponent,
    ForoAiWidgetComponent,
    ForoCreateModalComponent,
  ],
  selector: 'app-foro',
  styleUrl: './foro.scss',
  templateUrl: './foro.html',
})
export class Foro {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private timerIds: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerIds.forEach((id) => clearTimeout(id));
      this.timerIds = [];
    });
  }

  // ── Navegación Lateral (Menú de la Aplicación) ───────────────────────────
  public readonly activeNav = signal<string>('foros');
  public readonly navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-fill', route: '/estudiante' },
    { id: 'biblioteca', label: 'Biblioteca', icon: 'bi bi-book', route: '/biblioteca' },
    { id: 'foros', label: 'Foros', icon: 'bi bi-chat-square-text-fill', route: '/foro' },
    { id: 'progreso', label: 'Progreso', icon: 'bi bi-bar-chart', route: '/estudiante' },
    { id: 'perfil', label: 'Perfil', icon: 'bi bi-person-circle', route: '/estudiante' },
  ];

  // ── Panel Desplegable (Drawer) Asistente Context AI ───────────────────────
  public readonly isAiPanelOpen = signal<boolean>(true);

  public toggleAiPanel(): void {
    this.isAiPanelOpen.update((open) => !open);
  }

  // ── Estado Global del Foro (Gestión Central del Componente Padre) ───────
  public readonly currentRole = signal<UserRole>('student');
  public readonly searchQuery = signal<string>('');
  public readonly selectedSubject = signal<string>('Todas las Materias');
  public readonly subjects = signal<string[]>([
    'Todas las Materias',
    'Matemáticas',
    'Ciencias',
    'Historia',
    'Lenguaje',
    'Tecnología',
  ]);

  public readonly activeExpandedPostId = signal<string | null>('post-1');
  public readonly activeDraftContent = signal<string>('');
  public readonly isCreateModalOpen = signal<boolean>(false);
  public readonly isSubmittingPost = signal<boolean>(false);
  public readonly toastMessage = signal<string | null>(null);

  // ── Perfil Dinámico del Usuario ──────────────────────────────────────────
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

  // ── Datos Iniciales del Asistente y Temas Relacionados ───────────────────
  public readonly aiSuggestion = signal<CommunityAiSuggestion>(INITIAL_AI_SUGGESTION);

  public readonly relatedTopics = signal<RelatedTopic[]>([...INITIAL_RELATED_TOPICS]);

  public readonly forumEtiquette = FORUM_ETIQUETTE_RULES;

  // ── Almacén Reactivo de Publicaciones ────────────────────────────────────
  public readonly posts = signal<ForumPost[]>([...INITIAL_FORUM_POSTS]);

  // ── Cálculo Derivado de Publicaciones Filtradas ─────────────────────────
  public readonly filteredPosts = computed<ForumPost[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const currentSubject = this.selectedSubject();
    const allPosts = this.posts();

    return allPosts.filter((post) => {
      const matchesSubject =
        currentSubject === 'Todas las Materias' || post.subject === currentSubject;

      const matchesSearch =
        query === '' ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        post.subject.toLowerCase().includes(query);

      return matchesSubject && matchesSearch;
    });
  });

  // ── Orquestación de Modificaciones y Comunicación entre Nodos ───────────

  /** Comunicación desde ForoHeaderComponent */
  public toggleRole(): void {
    const nextRole: UserRole = this.currentRole() === 'student' ? 'professor' : 'student';
    this.currentRole.set(nextRole);
    this.showToast(
      nextRole === 'professor'
        ? 'Cambiaste a Modo Docente (Puedes certificar respuestas con solución oficial docente)'
        : 'Cambiaste a Modo Estudiante'
    );
  }

  /** Comunicación desde ForoFiltersComponent */
  public onFilterChanged(event: ForoFilterPayload): void {
    this.selectedSubject.set(event.subject);
    this.searchQuery.set(event.query);
  }

  /** Comunicación desde ForoPostCardComponent: Expansión de Hilo */
  public toggleExpandPost(postId: string): void {
    this.activeExpandedPostId.update((current) => (current === postId ? null : postId));
    // Limpiar borrador temporal si se cierra o cambia de hilo
    this.activeDraftContent.set('');
  }

  /** Comunicación desde ForoPostCardComponent: Voto Helpful */
  public handleHelpfulVote(post: ForumPost): void {
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

  /** Comunicación desde ForoPostCardComponent: Voto Helpful en Respuesta */
  public handleReplyHelpfulVote(reply: ForumReply): void {
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

  /** Comunicación desde ForoPostCardComponent: Nueva Respuesta */
  public handleReplySubmit(payload: CreateReplyPayload): void {
    const author = this.currentUser();
    const newReply: ForumReply = {
      id: `reply-${Date.now()}`,
      postId: payload.postId,
      author: {
        id: author.id,
        name: author.name,
        role: author.role,
        roleTitle: author.roleTitle,
        institution: author.institution,
        avatar: author.avatar,
        initials: author.initials,
      },
      content: payload.content,
      createdAt: 'Hace un momento',
      helpfulCount: 0,
      userHasVotedHelpful: false,
      isTeacherVerified: payload.isTeacherVerified,
      academicReference: payload.academicReference,
    };

    this.posts.update((list) =>
      list.map((post) => {
        if (post.id === payload.postId) {
          return {
            ...post,
            repliesCount: post.repliesCount + 1,
            isUnanswered: false,
            isTeacherVerified: post.isTeacherVerified || !!payload.isTeacherVerified,
            replies: [...post.replies, newReply],
          };
        }
        return post;
      })
    );

    this.showToast(
      payload.isTeacherVerified
        ? 'Respuesta verificada como solución oficial docente.'
        : 'Respuesta académica publicada con éxito.'
    );
  }

  /** Comunicación desde ForoAiWidgetComponent: Sugerencia de Borrador */
  public handleAiDraftRequested(suggestion: CommunityAiSuggestion): void {
    // 1. Abre el hilo de la publicación objetivo
    this.activeExpandedPostId.set(suggestion.postId);
    // 2. Transmite el contenido del borrador al nodo de la tarjeta de publicación
    this.activeDraftContent.set(suggestion.draftResponse);
    this.showToast('Respuesta sugerida por DiscerIA Context AI insertada en el borrador.');
  }

  /** Comunicación desde ForoAiWidgetComponent: Filtro por Tema Relacionado */
  public handleRelatedTopicSelected(topic: RelatedTopic): void {
    this.selectedSubject.set(topic.subject);
    this.searchQuery.set(topic.title);
    this.showToast(`Filtrando discusiones sobre "${topic.title}"`);
  }

  /** Apertura y Cierre del Modal */
  public openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  public closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  /** Comunicación desde ForoCreateModalComponent: Creación de Publicación */
  public handlePostSubmitted(payload: CreatePostPayload): void {
    this.isSubmittingPost.set(true);
    const author = this.currentUser();

    const postTimer = setTimeout(() => {
      const newPost: ForumPost = {
        id: `post-${Date.now()}`,
        title: payload.title,
        content: payload.content,
        subject: payload.subject,
        author: {
          id: author.id,
          name: author.name,
          role: author.role,
          roleTitle: author.roleTitle,
          institution: author.institution,
          avatar: author.avatar,
          initials: author.initials,
        },
        createdAt: 'Hace un momento',
        isTeacherVerified: author.role === 'professor',
        isUnanswered: true,
        helpfulCount: 0,
        userHasVotedHelpful: false,
        viewsCount: 1,
        repliesCount: 0,
        academicReference: payload.academicReference,
        replies: [],
      };

      this.posts.update((list) => [newPost, ...list]);
      this.isSubmittingPost.set(false);
      this.closeCreateModal();
      this.activeExpandedPostId.set(newPost.id);
      this.showToast('¡Tu publicación académica fue creada con éxito!');
    }, 400);
    this.timerIds.push(postTimer);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    const toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
    this.timerIds.push(toastTimer);
  }
}
